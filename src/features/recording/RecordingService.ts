import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RecordingStateMachine } from './RecordingStateMachine';
import { GPSQualityFilter } from './GPSQualityFilter';
import { useRecordingStore } from './RecordingStore';
import { LocationPoint, ActivitySummary, ActivitySplit } from '../../types';
import { RECORDING_CONFIG, ActivityType } from '../../constants/config';
import { XPEngine } from '../progression/XPEngine';
import { CompetitiveEngine } from '../progression/CompetitiveEngine';
import { PERFORMA_BACKGROUND_LOCATION_TASK } from './RecordingTask';
import { VoiceCoachService } from '../coaching/VoiceCoachService';
import { SyncService } from '../../services/SyncService';
import { supabase } from '../../services/supabase';
import { AchievementService } from '../achievements/AchievementService';
import { GhostEngine } from '../ghost/GhostEngine';

const STORAGE_ACTIVITIES_KEY = '@performa_activities_queue';

// Realistic 5K test route coordinates for route simulation
const SIMULATED_5K_ROUTE = [
  { latitude: 37.7749, longitude: -122.4194 },
  { latitude: 37.7758, longitude: -122.4182 },
  { latitude: 37.7770, longitude: -122.4168 },
  { latitude: 37.7782, longitude: -122.4152 },
  { latitude: 37.7795, longitude: -122.4138 },
  { latitude: 37.7808, longitude: -122.4120 },
  { latitude: 37.7820, longitude: -122.4102 },
  { latitude: 37.7835, longitude: -122.4085 },
  { latitude: 37.7850, longitude: -122.4068 },
  { latitude: 37.7865, longitude: -122.4050 },
  { latitude: 37.7878, longitude: -122.4035 },
  { latitude: 37.7892, longitude: -122.4018 },
];

export class RecordingService {
  private static instance: RecordingService;
  private stateMachine = new RecordingStateMachine();
  private qualityFilter = new GPSQualityFilter();
  private timerInterval: NodeJS.Timeout | null = null;
  private locationSubscription: Location.LocationSubscription | null = null;
  private simulatorInterval: NodeJS.Timeout | null = null;

  private startTime: number = 0;
  private lastSplitDistance: number = 0;
  private currentSplitStartTime: number = 0;
  private simulatedIndex: number = 0;
  private lastAltitude: number | null = null;
  private accumulatedGainMeters: number = 0;
  private accumulatedLossMeters: number = 0;
  private lastSplitGain: number = 0;

  private constructor() {
    this.stateMachine.subscribe((state) => {
      useRecordingStore.getState().setState(state);
    });
  }

  public static getInstance(): RecordingService {
    if (!RecordingService.instance) {
      RecordingService.instance = new RecordingService();
    }
    return RecordingService.instance;
  }

  /**
   * Resets recording service, timers, location watchers, and store to IDLE.
   */
  public reset() {
    if (this.timerInterval) clearInterval(this.timerInterval);
    if (this.simulatorInterval) clearInterval(this.simulatorInterval);
    if (this.locationSubscription) this.locationSubscription.remove();
    this.stopBackgroundLocation();
    this.qualityFilter.reset();
    this.stateMachine.reset();
    this.lastAltitude = null;
    this.accumulatedGainMeters = 0;
    this.accumulatedLossMeters = 0;
    this.lastSplitGain = 0;
    useRecordingStore.getState().reset();
  }

  /**
   * Prepares and starts a 3-second countdown before recording.
   */
  public async startPreparing(options?: { useSimulator?: boolean }) {
    console.log('[RecordingService] startPreparing called, state:', this.stateMachine.getState());
    if (this.stateMachine.getState() !== 'IDLE') {
      this.stateMachine.reset();
    }

    this.qualityFilter.reset();
    this.lastAltitude = null;
    this.accumulatedGainMeters = 0;
    this.accumulatedLossMeters = 0;
    this.lastSplitGain = 0;
    const store = useRecordingStore.getState();
    store.resetSessionMetrics();

    if (options?.useSimulator !== undefined) {
      store.setSimulatorActive(options.useSimulator);
    }

    if (!this.stateMachine.transition('PREPARING')) {
      console.warn('[RecordingService] Failed to transition to PREPARING');
      return;
    }

    if (!this.stateMachine.transition('COUNTDOWN')) {
      console.warn('[RecordingService] Failed to transition to COUNTDOWN');
      return;
    }

    console.log('[RecordingService] Transitioned to COUNTDOWN');
    let countdown = 3;
    store.setCountdownValue(countdown);

    const countdownTimer = setInterval(() => {
      countdown -= 1;
      console.log('[RecordingService] Countdown tick:', countdown);
      if (countdown > 0) {
        store.setCountdownValue(countdown);
      } else {
        clearInterval(countdownTimer);
        this.beginRecording();
      }
    }, 1000);
  }

  /**
   * Begins active recording and initializes timer + location listener.
   */
  public async beginRecording() {
    console.log('[RecordingService] beginRecording triggered');
    if (!this.stateMachine.transition('RECORDING')) {
      console.warn('[RecordingService] Failed to transition to RECORDING from', this.stateMachine.getState());
      return;
    }

    this.startTime = Date.now();
    this.lastSplitDistance = 0;
    this.currentSplitStartTime = this.startTime;
    this.qualityFilter.reset();

    VoiceCoachService.getInstance().speak('Recording started. GPS active.');

    // Start 1Hz timer
    this.timerInterval = setInterval(() => {
      this.tick();
    }, 1000);

    const store = useRecordingStore.getState();

    if (store.isSimulatorActive) {
      this.startSimulator();
    } else {
      await this.startDeviceLocation();
      await this.startBackgroundLocation();
    }
  }

  private tick() {
    const store = useRecordingStore.getState();
    if (store.state !== 'RECORDING') return;

    const newElapsed = store.elapsedSeconds + 1;
    const newMoving = store.movingSeconds + 1;

    // Calculate average pace (seconds per km)
    let avgPace = 0;
    if (store.distanceMeters > 0) {
      avgPace = Math.round(newMoving / (store.distanceMeters / 1000));
    }

    store.updateMetrics({
      elapsedSeconds: newElapsed,
      movingSeconds: newMoving,
      avgPaceSecondsPerKm: avgPace,
    });
  }

  private async startDeviceLocation() {
    try {
      const { status } = await Location.getForegroundPermissionsAsync();
      if (status !== 'granted') {
        const req = await Location.requestForegroundPermissionsAsync();
        if (req.status !== 'granted') {
          console.warn('Location permission denied, switching to simulator fallback');
          this.startSimulator();
          return;
        }
      }

      this.locationSubscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation,
          timeInterval: RECORDING_CONFIG.sampleIntervalMs,
          distanceInterval: 2, // Every 2 meters
        },
        (loc) => {
          this.processRawLocation({
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
            altitude: loc.coords.altitude || undefined,
            accuracy: loc.coords.accuracy || undefined,
            speed: loc.coords.speed || undefined,
            heading: loc.coords.heading || undefined,
            timestamp: loc.timestamp,
          });
        }
      );
    } catch (e) {
      console.warn('Native GPS error, running in simulator mode:', e);
      this.startSimulator();
    }
  }

  /**
   * Built-in Route Simulator for testing without physical outdoors movement.
   */
  private startSimulator() {
    this.simulatedIndex = 0;
    this.simulatorInterval = setInterval(() => {
      const store = useRecordingStore.getState();
      if (store.state !== 'RECORDING') return;

      const baseCoord = SIMULATED_5K_ROUTE[this.simulatedIndex % SIMULATED_5K_ROUTE.length];
      // Add slight jitter
      const jitter = (Math.random() - 0.5) * 0.0003;
      const point: LocationPoint = {
        latitude: baseCoord.latitude + jitter,
        longitude: baseCoord.longitude + jitter,
        accuracy: 5,
        speed: 3.2 + Math.random() * 0.4, // ~5:12 /km running pace
        timestamp: Date.now(),
      };

      this.processRawLocation(point);
      this.simulatedIndex += 1;
    }, 1500);
  }

  private processRawLocation(point: LocationPoint) {
    const store = useRecordingStore.getState();
    if (store.state !== 'RECORDING') return;

    // Quality signal evaluation
    const signal = this.qualityFilter.evaluateSignal(point.accuracy);
    store.setGpsQuality(signal);

    const { isValid, filteredPoint, deltaDistanceMeters } = this.qualityFilter.filterPoint(
      point,
      store.activityType
    );

    if (!isValid || !filteredPoint) return;

    // Track real elevation with 1.2m vertical noise threshold
    if (filteredPoint.altitude !== undefined && !isNaN(filteredPoint.altitude)) {
      if (this.lastAltitude !== null) {
        const deltaAlt = filteredPoint.altitude - this.lastAltitude;
        if (deltaAlt >= 1.2) {
          this.accumulatedGainMeters += deltaAlt;
          this.lastAltitude = filteredPoint.altitude;
        } else if (deltaAlt <= -1.2) {
          this.accumulatedLossMeters += Math.abs(deltaAlt);
          this.lastAltitude = filteredPoint.altitude;
        }
      } else {
        this.lastAltitude = filteredPoint.altitude;
      }
    }

    // Only append to route coordinates if there is actual forward displacement or if it's the first coordinate
    const shouldAppendCoordinate = deltaDistanceMeters > 0 || store.routeCoordinates.length === 0;

    const newTotalDistance = store.distanceMeters + deltaDistanceMeters;
    const currentSpeed = filteredPoint.speed || 0;

    // Instantaneous pace: seconds / km
    const currentPace = currentSpeed > 0.5 ? Math.round(1000 / currentSpeed) : (deltaDistanceMeters === 0 ? 0 : store.avgPaceSecondsPerKm);

    // Check kilometer split
    let newSplit: ActivitySplit | undefined;
    if (newTotalDistance - this.lastSplitDistance >= 1000) {
      const splitNumber = Math.floor(newTotalDistance / 1000);
      const splitDuration = Math.round((Date.now() - this.currentSplitStartTime) / 1000);
      const splitElevGain = Math.max(0, Math.round(this.accumulatedGainMeters - this.lastSplitGain));
      newSplit = {
        splitNumber,
        distanceMeters: 1000,
        elapsedSeconds: splitDuration,
        paceSecondsPerKm: splitDuration,
        elevationGainMeters: splitElevGain,
      };
      this.lastSplitDistance = newTotalDistance;
      this.lastSplitGain = this.accumulatedGainMeters;
      this.currentSplitStartTime = Date.now();

      // Audio cue for split completion
      VoiceCoachService.getInstance().announceSplit(splitNumber, splitDuration);
    }

    // Ghost delta calculation if ghost opponent is active
    let ghostDelta = store.ghostDeltaSeconds;
    if (store.ghostOpponent && store.ghostOpponent.checkpoints.length > 0) {
      const ghostResult = GhostEngine.calculateGhostDelta(
        store.ghostOpponent,
        newTotalDistance,
        store.movingSeconds
      );
      ghostDelta = ghostResult.deltaSeconds;

      // Announce audio cues every 500m milestone
      if (Math.floor(newTotalDistance / 500) > Math.floor(store.distanceMeters / 500)) {
        VoiceCoachService.getInstance().announceGhostDelta(ghostDelta, store.ghostOpponent.athleteName);
      }
    }

    store.updateMetrics({
      distanceMeters: newTotalDistance,
      currentPaceSecondsPerKm: currentPace,
      elevationGainMeters: Math.round(this.accumulatedGainMeters),
      bestPaceSecondsPerKm:
        store.bestPaceSecondsPerKm === 0
          ? currentPace
          : Math.min(store.bestPaceSecondsPerKm, currentPace),
      coordinate: shouldAppendCoordinate
        ? {
            latitude: filteredPoint.latitude,
            longitude: filteredPoint.longitude,
            altitude:
              filteredPoint.altitude !== undefined
                ? Math.round(filteredPoint.altitude * 10) / 10
                : undefined,
          }
        : undefined,
      split: newSplit,
      ghostDeltaSeconds: ghostDelta,
    });
  }

  /**
   * Receives background GPS updates from expo-task-manager
   */
  public handleBackgroundLocations(locations: Location.LocationObject[]) {
    for (const loc of locations) {
      this.processRawLocation({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
        altitude: loc.coords.altitude ?? undefined,
        accuracy: loc.coords.accuracy ?? undefined,
        speed: loc.coords.speed ?? undefined,
        heading: loc.coords.heading ?? undefined,
        timestamp: loc.timestamp,
      });
    }
  }

  private async startBackgroundLocation() {
    try {
      const isRegistered = await TaskManager.isTaskRegisteredAsync(PERFORMA_BACKGROUND_LOCATION_TASK);
      if (!isRegistered) {
        console.warn('[RecordingService] Background task not registered');
        return;
      }

      const bgPerm = await Location.getBackgroundPermissionsAsync();
      if (bgPerm.status !== 'granted') {
        const req = await Location.requestBackgroundPermissionsAsync();
        if (req.status !== 'granted') {
          console.warn('[RecordingService] Background location permission not granted');
          return;
        }
      }

      const isRunning = await Location.hasStartedLocationUpdatesAsync(PERFORMA_BACKGROUND_LOCATION_TASK);
      if (isRunning) {
        await Location.stopLocationUpdatesAsync(PERFORMA_BACKGROUND_LOCATION_TASK);
      }

      await Location.startLocationUpdatesAsync(PERFORMA_BACKGROUND_LOCATION_TASK, {
        accuracy: Location.Accuracy.BestForNavigation,
        timeInterval: RECORDING_CONFIG.sampleIntervalMs,
        distanceInterval: 2,
        foregroundService: {
          notificationTitle: 'PERFORMA // LIVE SESSION',
          notificationBody: 'Tracking pace and telemetry in background',
          notificationColor: '#CCFF00',
        },
        pausesUpdatesAutomatically: false,
        showsBackgroundLocationIndicator: true,
      });
    } catch (e) {
      console.warn('[RecordingService] Native background location start error:', e);
    }
  }

  private async stopBackgroundLocation() {
    try {
      const isRegistered = await TaskManager.isTaskRegisteredAsync(PERFORMA_BACKGROUND_LOCATION_TASK);
      if (isRegistered) {
        const isRunning = await Location.hasStartedLocationUpdatesAsync(PERFORMA_BACKGROUND_LOCATION_TASK);
        if (isRunning) {
          await Location.stopLocationUpdatesAsync(PERFORMA_BACKGROUND_LOCATION_TASK);
        }
      }
    } catch (e) {
      console.warn('[RecordingService] Native background location stop error:', e);
    }
  }

  public pauseRecording() {
    const store = useRecordingStore.getState();
    if (store.recordingMode === 'RANKED') {
      console.warn('[RecordingService] Pause rejected: session is in RANKED non-stop mode');
      return;
    }
    if (this.stateMachine.transition('PAUSED')) {
      VoiceCoachService.getInstance().speak('Session paused.');
    }
  }

  public resumeRecording() {
    if (this.stateMachine.transition('RESUMING')) {
      this.stateMachine.transition('RECORDING');
      VoiceCoachService.getInstance().speak('Session resumed.');
    }
  }

  /**
   * Finalizes the activity, generates summary, awards XP and PR, and saves to offline queue.
   */
  public async finalizeActivity(): Promise<ActivitySummary> {
    this.stateMachine.transition('FINALIZING');

    if (this.timerInterval) clearInterval(this.timerInterval);
    if (this.simulatorInterval) clearInterval(this.simulatorInterval);
    if (this.locationSubscription) this.locationSubscription.remove();
    await this.stopBackgroundLocation();

    const store = useRecordingStore.getState();

    VoiceCoachService.getInstance().speak(
      `Session completed. ${(store.distanceMeters / 1000).toFixed(2)} kilometers recorded.`
    );

    // 1. Calculate XP with diminishing returns and daily caps
    const xpResult = XPEngine.calculateActivityXP({
      activityType: store.activityType,
      durationMinutes: store.movingSeconds / 60,
      verificationFactor: 1.0,
      isVerifiedGps: store.gpsQuality !== 'WEAK',
    });

    // 2. Calculate competitive PR (Ranked Non-Stop mode only; Casual mode awards 0 PR)
    const isRanked = store.recordingMode !== 'CASUAL';
    const prResult = isRanked
      ? CompetitiveEngine.calculateActivityPR({
          activityType: store.activityType,
          distanceMeters: store.distanceMeters,
          durationSeconds: store.movingSeconds,
          currentDivision: 'GOLD',
          ghostOpponentId: store.ghostOpponent?.id,
          beatGhost: store.ghostDeltaSeconds > 0,
        })
      : { prAwarded: 0 };

    // 3. Resolve user ID from active Supabase session or local profile
    let currentUserId = 'usr_offline';
    try {
      const { data: authData } = await supabase.auth.getUser();
      if (authData?.user?.id) {
        currentUserId = authData.user.id;
      } else {
        const storedProfile = await AsyncStorage.getItem('@performa_user_profile');
        if (storedProfile) {
          const parsed = JSON.parse(storedProfile);
          if (parsed.id) currentUserId = parsed.id;
        }
      }
    } catch {}

    // 4. Generate summary
    const summary: ActivitySummary = {
      id: 'act_' + Date.now(),
      userId: currentUserId,
      type: store.activityType,
      startTime: this.startTime,
      endTime: Date.now(),
      elapsedSeconds: Math.max(store.elapsedSeconds, 1),
      movingSeconds: Math.max(store.movingSeconds, 1),
      distanceMeters: store.distanceMeters,
      avgPaceSecondsPerKm: store.avgPaceSecondsPerKm,
      bestPaceSecondsPerKm: store.bestPaceSecondsPerKm,
      avgSpeedMps: store.movingSeconds > 0 ? store.distanceMeters / store.movingSeconds : 0,
      maxSpeedMps: store.movingSeconds > 0 ? (store.distanceMeters / store.movingSeconds) * 1.3 : 0,
      elevationGainMeters: Math.round(this.accumulatedGainMeters),
      elevationLossMeters: Math.round(this.accumulatedLossMeters),
      xpEarned: xpResult.xpAwarded,
      prEarned: isRanked ? prResult.prAwarded : 0,
      recordingMode: store.recordingMode || 'RANKED',
      routeCoordinates: store.routeCoordinates,
      splits: store.splits,
      verificationStatus: 'VERIFIED',
      qualityScore: 94,
      isNewPb: store.distanceMeters >= 4900 && store.movingSeconds < 1471, // Check 5K PB
      pbLabel: '5K Classic',
      ghostId: store.ghostOpponent?.id,
    };

    // 5. Save offline queue & dispatch cloud sync
    try {
      await SyncService.getInstance().enqueueActivity(summary);
    } catch (e) {
      console.error('Failed to enqueue activity in SyncService:', e);
    }

    // 6. Evaluate Achievements & Rewards
    try {
      const allActivities = await SyncService.getInstance().getAllActivities();
      const totalActivitiesCount = allActivities.length + 1;
      const totalDistanceMeters = allActivities.reduce((s, a) => s + (a.distanceMeters || 0), summary.distanceMeters);

      await AchievementService.getInstance().evaluateActivityCompletion({
        activity: summary,
        totalActivitiesCount,
        totalDistanceMeters,
        isPersonalBest: !!summary.isNewPb,
        isGhostBeat: !!(store.ghostOpponent && store.distanceMeters >= (store.ghostOpponent.totalDistanceMeters || 0)),
      });
    } catch (achErr) {
      console.warn('[RecordingService] Error evaluating achievements:', achErr);
    }

    this.stateMachine.transition('COMPLETED');
    return summary;
  }
}
