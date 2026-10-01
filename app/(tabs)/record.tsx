import React, { useState, useEffect, useMemo, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Alert, Image, ImageBackground } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Speech from 'expo-speech';
import {
  Play,
  Pause,
  Square,
  Flame,
  Zap,
  RotateCcw,
  Navigation,
  Heart,
  Bluetooth,
  Footprints,
  Bike,
  PersonStanding,
  Waves,
  Activity as ActivityIcon,
  Sparkles,
  TrendingUp,
  Locate,
  Crosshair,
  X,
} from 'lucide-react-native';
import { RADIUS } from '../../src/constants/theme';
import { useTheme } from '../../src/context/ThemeContext';
import { ActivityType } from '../../src/constants/config';
import { useRecordingStore } from '../../src/features/recording/RecordingStore';
import { RecordingService } from '../../src/features/recording/RecordingService';
import { ActivityMap, ActivityMapRef } from '../../src/components/maps/ActivityMap';
import { PerformaButton, ScreenBackground } from '../../src/components/common';
import { COSMETIC_IMAGES } from '../../src/constants/Cosmetics';
import { RouteService, DEFAULT_ROUTES } from '../../src/features/routes/RouteService';
import { useSensorStore } from '../../src/features/sensors/SensorService';
import { DeviceConnectModal } from '../../src/components/sensors/DeviceConnectModal';
import { ActiveTelemetryDrawer } from '../../src/components/recording/ActiveTelemetryDrawer';
import { GhostTargetModal } from '../../src/components/recording/GhostTargetModal';
import { PacerStrategyModal } from '../../src/components/recording/PacerStrategyModal';
import { PacerService } from '../../src/features/pacer/PacerService';
import { GhostEngine } from '../../src/features/ghost/GhostEngine';
import { RouteItem, GhostData, PacerSettings, PacerSplitStrategy } from '../../src/types';
import { useAuth } from '../../src/features/auth/AuthContext';

export default function RecordScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ routeId?: string; mode?: string }>();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const recordingService = RecordingService.getInstance();
  const { colors, isDark } = useTheme();

  const store = useRecordingStore();
  const { activeHeartRate, activeCadence, connectedDevices } = useSensorStore();
  const connectedDevice = connectedDevices.find((d) => d.isConnected);

  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const [showDeviceModal, setShowDeviceModal] = useState(false);
  const [showGhostTargetModal, setShowGhostTargetModal] = useState(false);
  const [showPacerModal, setShowPacerModal] = useState(false);
  const [isMidRunPacerAdjust, setIsMidRunPacerAdjust] = useState(false);
  const [careAlertDismissed, setCareAlertDismissed] = useState(false);
  const [useSimulator, setUseSimulator] = useState(false);
  const [loadedCourseRoute, setLoadedCourseRoute] = useState<RouteItem | null>(null);
  const mapRef = useRef<ActivityMapRef | null>(null);


  // Pacer Strategy State
  const [pacerSettings, setPacerSettings] = useState<PacerSettings>({
    enabled: false,
    targetDistanceMeters: 5000,
    targetTimeSeconds: 1500, // 25:00
    strategy: 'NEGATIVE_SPLIT',
    voiceInterval: '1_KM',
  });

  const activeRoute = loadedCourseRoute || store.selectedRoute;

  useEffect(() => {
    (async () => {
      if (params.routeId) {
        const route = await RouteService.getInstance().getRouteById(params.routeId);
        if (route) {
          setLoadedCourseRoute(route);
          store.setSelectedRoute(route);
          store.setActivityType(route.activityType);
          if (params.mode === 'GHOST') {
            const ghost = RouteService.getInstance().createGhostFromRoute(route);
            store.setMode('GHOST');
            store.setGhostOpponent(ghost);
          } else if (params.mode === 'ROUTE') {
            store.setMode('ROUTE');
            store.setGhostOpponent(null);
          } else {
            store.setMode('FREE');
          }
          return;
        }
      }
      if (store.selectedRoute && !loadedCourseRoute) {
        setLoadedCourseRoute(store.selectedRoute);
      }
      if (params.mode === 'GHOST' && !store.ghostOpponent) {
        store.setMode('GHOST');
        const defaultRoute = DEFAULT_ROUTES[0];
        const ghost = RouteService.getInstance().createGhostFromRoute(defaultRoute);
        store.setGhostOpponent(ghost);
      }
    })();
  }, [params.routeId, params.mode, store.selectedRoute]);

  useEffect(() => {
    if (store.state === 'COMPLETED' || store.state === 'FAILED') {
      recordingService.reset();
    }
  }, [store.state]);

  // Cardiac & Pacing Care Redline Detection (Zone 5 > 175 BPM OR High-Strain Ghost Chase)
  const isZone5Cardiac = (activeHeartRate || 0) >= 175;
  const isLaggingSignificantly =
    store.mode === 'GHOST' &&
    store.ghostDeltaSeconds <= -30 &&
    store.distanceMeters >= 400;
  const shouldShowCareAlert =
    (isZone5Cardiac || isLaggingSignificantly) &&
    !careAlertDismissed &&
    store.state === 'RECORDING';

  useEffect(() => {
    if (shouldShowCareAlert) {
      try {
        const spoken = isZone5Cardiac
          ? 'Cardiac check. Heart rate in peak zone. Listen to your body and ease cadence.'
          : 'Pacing check. Take it easy, champion. Form over speed. Listen to your body.';
        Speech.speak(spoken, {
          language: 'en',
          rate: 0.95,
        });
      } catch (_) {}
    }
  }, [shouldShowCareAlert, isZone5Cardiac]);

  const formatTime = (totalSeconds: number) => {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    const h = Math.floor(m / 60);
    if (h > 0) {
      const remM = m % 60;
      return `${h}:${remM < 10 ? '0' : ''}${remM}:${s < 10 ? '0' : ''}${s}`;
    }
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const formatPace = (paceSec: number) => {
    if (!paceSec || paceSec <= 0 || paceSec > 1800) return '--:--';
    const m = Math.floor(paceSec / 60);
    const s = Math.round(paceSec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleStart = async () => {
    try {
      console.log('[RECORD] handleStart pressed, useSimulator:', useSimulator, 'state:', store.state);
      // If pacer enabled but splits not yet generated, build them now
      if (pacerSettings.enabled && (!pacerSettings.splits || pacerSettings.splits.length === 0)) {
        const splits = PacerService.getInstance().generateSplits(
          pacerSettings.targetDistanceMeters,
          pacerSettings.targetTimeSeconds,
          pacerSettings.strategy
        );
        setPacerSettings((prev) => ({ ...prev, splits }));
      }
      await recordingService.startPreparing({ useSimulator });
    } catch (err) {
      console.error('[RECORD] startPreparing error:', err);
    }
  };

  const handlePause = () => {
    recordingService.pauseRecording();
  };

  const handleResume = () => {
    recordingService.resumeRecording();
  };

  const handleFinish = async () => {
    setShowEndConfirm(false);
    const activity = await recordingService.finalizeActivity();
    if (activity) {
      router.replace({
        pathname: '/activity/[id]',
        params: { id: activity.id, data: JSON.stringify(activity) },
      });
    }
  };

  const handleDiscard = () => {
    setShowEndConfirm(false);
    recordingService.reset();
  };

  // Live Purple Ghost Map Blob Coordinate Calculation
  const ghostCurrentCoord = useMemo(() => {
    if (store.mode !== 'GHOST' || !store.ghostOpponent) return null;
    return GhostEngine.getGhostCoordinateAtElapsedSeconds(
      store.ghostOpponent,
      store.movingSeconds
    );
  }, [store.mode, store.ghostOpponent, store.movingSeconds]);

  // Active Pacer Target Evaluation
  const currentKm = Math.max(1, Math.ceil(store.distanceMeters / 1000));
  const currentPacerSplit = pacerSettings.splits?.find((s) => s.kmNumber === currentKm);
  const pacerFeedback = useMemo(() => {
    if (!pacerSettings.enabled || !currentPacerSplit) return null;
    return PacerService.getInstance().evaluatePace(
      store.currentPaceSecondsPerKm,
      currentPacerSplit.targetPaceSeconds
    );
  }, [pacerSettings.enabled, currentPacerSplit, store.currentPaceSecondsPerKm]);

  // Mid-run adaptive handlers
  const handleRelaxPaceMidRun = (bufferSec: number) => {
    if (pacerSettings.splits) {
      const relaxed = PacerService.getInstance().relaxRemainingSplits(
        currentKm,
        pacerSettings.splits,
        bufferSec
      );
      setPacerSettings((prev) => ({ ...prev, splits: relaxed }));
    }
  };

  const handleSurgePaceMidRun = (surgeSec: number) => {
    if (pacerSettings.splits) {
      const surged = PacerService.getInstance().surgeRemainingSplits(
        currentKm,
        pacerSettings.splits,
        surgeSec
      );
      setPacerSettings((prev) => ({ ...prev, splits: surged }));
    }
  };

  const handleSwitchStrategyMidRun = (newStrategy: PacerSplitStrategy) => {
    const regenerated = PacerService.getInstance().generateSplits(
      pacerSettings.targetDistanceMeters,
      pacerSettings.targetTimeSeconds,
      newStrategy
    );
    setPacerSettings((prev) => ({
      ...prev,
      strategy: newStrategy,
      splits: regenerated,
    }));
  };

  // Spoken Voice Coach Integration (RevenueCat Pro Feature)
  const lastAnnouncedKmRef = useRef<number>(0);
  useEffect(() => {
    if (store.state === 'IDLE' || store.state === 'COMPLETED' || store.state === 'FAILED') {
      lastAnnouncedKmRef.current = 0;
      return;
    }

    if (
      store.state === 'RECORDING' &&
      user?.isPro &&
      pacerSettings.enabled &&
      currentKm > lastAnnouncedKmRef.current &&
      store.distanceMeters >= currentKm * 1000
    ) {
      lastAnnouncedKmRef.current = currentKm;
      const targetPaceStr = currentPacerSplit ? formatPace(currentPacerSplit.targetPaceSeconds) : '';
      const feedbackStr =
        pacerFeedback?.status === 'BEHIND'
          ? 'Behind target split. Increase cadence.'
          : pacerFeedback?.status === 'AHEAD'
          ? 'Ahead of pace. Holding steady rhythm.'
          : 'Splits on target.';

      Speech.speak(`Kilometer ${currentKm}. Target pace ${targetPaceStr}. ${feedbackStr}`, {
        language: 'en',
        rate: 0.95,
      });
    }
  }, [store.state, store.distanceMeters, currentKm, user?.isPro, pacerSettings.enabled, currentPacerSplit, pacerFeedback]);

  // 1. UNIFIED STATE LOGIC
  const isActivelyRecording =
    store.state === 'RECORDING' || store.state === 'PAUSED' || store.state === 'FINALIZING';
  const isPaused = store.state === 'PAUSED';

  const sports: { type: ActivityType; label: string; icon: any }[] = [
    { type: 'RUN', label: 'Run', icon: Footprints },
    { type: 'CYCLE', label: 'Cycle', icon: Bike },
    { type: 'WALK', label: 'Walk', icon: PersonStanding },
  ];

  const activeMapGhostCoords =
    store.ghostOpponent?.checkpoints.map((c) => ({
      latitude: c.latitude,
      longitude: c.longitude,
    })) || activeRoute?.polyline || [];

  const idleMapCoords = activeRoute?.polyline || [];

  return (
    <View style={styles.screen}>
      {/* Permanent Unified Live Map Canvas (Never re-instantiates on state switch) */}
      <ActivityMap
        ref={mapRef}
        coordinates={isActivelyRecording ? store.routeCoordinates : []}
        ghostCoordinates={isActivelyRecording && store.mode === 'GHOST' ? activeMapGhostCoords : (store.mode === 'ROUTE' ? idleMapCoords : [])}
        ghostCurrentCoordinate={isActivelyRecording && store.mode === 'GHOST' ? ghostCurrentCoord : undefined}
        ghostOpponentName={isActivelyRecording && store.mode === 'GHOST' ? (store.ghostOpponent?.athleteName || 'GHOST') : undefined}
        gpsQuality={isActivelyRecording ? store.gpsQuality : 'GOOD'}
        interactive={true}
        followUser={isActivelyRecording}
        showControls={false}
        style={styles.fullBleedMap}
      />

      {/* Countdown Overlay HUD */}
      {store.state === 'COUNTDOWN' && (
        <View style={[styles.countdownOverlay, { backgroundColor: isDark ? 'rgba(5, 7, 10, 0.88)' : 'rgba(255, 255, 255, 0.92)' }]}>
          <Text style={[styles.countdownKicker, { color: colors.accent }]}>LOCKING GPS // PREPARING</Text>
          <Text style={[styles.countdownText, { color: colors.textPrimary }]}>{store.countdownValue}</Text>
          <Text style={[styles.countdownSub, { color: colors.textSecondary }]}>
            {pacerSettings.enabled
              ? `Pacer Strategy Locked • ${pacerSettings.strategy === 'NEGATIVE_SPLIT' ? 'Negative Split' : pacerSettings.strategy === 'POSITIVE_SPLIT' ? 'Positive Split' : 'Even Split'}`
              : store.mode === 'GHOST'
              ? `Ghost Opponent • ${store.ghostOpponent?.athleteName || 'Course Record'}`
              : 'Get ready to move'}
          </Text>
          <View style={[styles.countdownCarePill, { borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)' }]}>
            <Heart size={11} color={colors.accent} />
            <Text style={[styles.countdownCareText, { color: colors.textMuted }]}>
              Form over fatigue • We care about your long-term health
            </Text>
          </View>
        </View>
      )}

      {isActivelyRecording ? (
        <>
          {/* Floating Athletic Top Telemetry HUD */}

        <View style={[styles.floatingActiveHeader, { top: insets.top + 8 }]}>
          <View style={styles.topHudPillRow}>
            <View
              style={[
                styles.floatingPill,
                {
                  backgroundColor: isDark ? 'rgba(11, 15, 20, 0.94)' : 'rgba(255, 255, 255, 0.96)',
                  borderColor: isPaused ? '#F59E0B' : colors.surfaceBorder,
                },
              ]}
            >
              <View style={[styles.liveDot, { backgroundColor: isPaused ? '#F59E0B' : colors.accent }]} />
              <Text style={[styles.activityBadgeText, { color: colors.textPrimary }]}>
                {isPaused ? 'PAUSED' : `LIVE // ${store.activityType}`}
              </Text>
            </View>

            {useSimulator && (
              <View
                style={[
                  styles.floatingPill,
                  {
                    backgroundColor: isDark ? 'rgba(11, 15, 20, 0.94)' : 'rgba(255, 255, 255, 0.96)',
                    borderColor: colors.surfaceBorder,
                  },
                ]}
              >
                <Text style={[styles.simBadgeText, { color: colors.textMuted }]}>SIMULATOR</Text>
              </View>
            )}

            {activeHeartRate ? (
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setShowDeviceModal(true)}
                style={[
                  styles.floatingPill,
                  {
                    backgroundColor: isDark ? 'rgba(11, 15, 20, 0.94)' : 'rgba(255, 255, 255, 0.96)',
                    borderColor: isZone5Cardiac ? '#FF453A' : '#FF5C6C',
                  },
                ]}
              >
                <Heart size={11} color={isZone5Cardiac ? '#FF453A' : '#FF5C6C'} fill={isZone5Cardiac ? '#FF453A' : 'none'} />
                <Text style={{ color: isZone5Cardiac ? '#FF453A' : '#FF5C6C', fontWeight: '900', fontSize: 10 }}>
                  {activeHeartRate} BPM
                </Text>
              </TouchableOpacity>
            ) : null}

            {/* Ghost Delta Live Pill */}
            {store.mode === 'GHOST' && (
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setShowGhostTargetModal(true)}
                style={[
                  styles.floatingPill,
                  {
                    backgroundColor: isDark ? 'rgba(11, 15, 20, 0.94)' : 'rgba(255, 255, 255, 0.96)',
                    borderColor: colors.surfaceBorder,
                  },
                ]}
              >
                <Zap size={11} color="#A855F7" />
                <Text
                  style={{
                    color: store.ghostDeltaSeconds >= 0 ? colors.accent : '#FF453A',
                    fontWeight: '900',
                    fontSize: 10,
                  }}
                >
                  {store.ghostDeltaSeconds >= 0
                    ? `+${store.ghostDeltaSeconds}s LEAD`
                    : `${store.ghostDeltaSeconds}s LAG`}
                </Text>
              </TouchableOpacity>
            )}

            {/* Adaptive Pacer Target Pill (Tappable for on-the-fly adjustment) */}
            {pacerSettings.enabled && currentPacerSplit && (
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => {
                  setIsMidRunPacerAdjust(true);
                  setShowPacerModal(true);
                }}
                style={[
                  styles.floatingPill,
                  {
                    backgroundColor: isDark ? 'rgba(11, 15, 20, 0.94)' : 'rgba(255, 255, 255, 0.96)',
                    borderColor: colors.accent,
                  },
                ]}
              >
                <ActivityIcon size={11} color={colors.accent} />
                <Text style={{ color: colors.accent, fontWeight: '900', fontSize: 10 }}>
                  KM {currentKm}: {formatPace(currentPacerSplit.targetPaceSeconds)}
                </Text>
              </TouchableOpacity>
            )}

            {store.mode === 'ROUTE' && activeRoute && (
              <View
                style={[
                  styles.floatingPill,
                  {
                    backgroundColor: isDark ? 'rgba(11, 15, 20, 0.94)' : 'rgba(255, 255, 255, 0.96)',
                    borderColor: colors.accent,
                  },
                ]}
              >
                <Navigation size={11} color={colors.accent} />
                <Text style={{ color: colors.accent, fontWeight: '800', fontSize: 10 }}>
                  {Math.max(0, (activeRoute.distanceMeters - store.distanceMeters) / 1000).toFixed(1)} KM TO GO
                </Text>
              </View>
            )}

            {/* Active Recenter Crosshair Button */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => mapRef.current?.recenter()}
              style={[
                styles.floatingPill,
                {
                  backgroundColor: isDark ? 'rgba(11, 15, 20, 0.94)' : 'rgba(255, 255, 255, 0.96)',
                  borderColor: colors.surfaceBorder,
                  paddingHorizontal: 8,
                },
              ]}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityLabel="Recenter location"
            >
              <Crosshair size={12} color={colors.accent} strokeWidth={2.4} />
            </TouchableOpacity>
          </View>
        </View>


        {/* Cardiac Care & Anti-Overtraining Guardrail Banner */}
        {shouldShowCareAlert && (
          <View
            style={[
              styles.careAlertFloatingBanner,
              {
                top: insets.top + 54,
                backgroundColor: isDark ? 'rgba(28, 10, 14, 0.96)' : 'rgba(255, 241, 242, 0.98)',
                borderColor: isZone5Cardiac ? '#FF453A' : '#A855F7',
              },
            ]}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 }}>
              <Heart size={13} color={isZone5Cardiac ? '#FF453A' : '#A855F7'} fill={isZone5Cardiac ? '#FF453A' : '#A855F7'} />
              <Text style={[styles.careAlertTitle, { color: isZone5Cardiac ? '#FF453A' : '#A855F7' }]}>
                {isZone5Cardiac ? 'PACING CARE • ZONE 5 REDLINE' : 'PACING CARE • TAKE IT EASY'}
              </Text>
            </View>
            <Text style={[styles.careAlertBody, { color: colors.textSecondary }]}>
              {isZone5Cardiac
                ? 'Heart rate in peak intensity. Consistency builds champions. Listen to your body and ease cadence.'
                : 'Take it easy, champion. Form over speed. Don’t over-push yourself chasing ghosts — we care about your long-term health.'}
            </Text>
            <View style={styles.careAlertActionRow}>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => {
                  handleRelaxPaceMidRun(30);
                  setCareAlertDismissed(true);
                }}
                style={styles.careAlertActionBtn}
              >
                <Text style={styles.careAlertActionBtnText}>EASE CADENCE (+30s/km)</Text>
              </TouchableOpacity>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setCareAlertDismissed(true)}
                style={styles.careAlertDismissBtn}
              >
                <Text style={[styles.careAlertDismissText, { color: colors.textMuted }]}>Dismiss</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Edge-to-Edge Athletic Telemetry Drawer with Full Gestures & Live Biometrics */}
        <ActiveTelemetryDrawer
          distanceMeters={store.distanceMeters}
          movingSeconds={store.movingSeconds}
          avgPaceSecondsPerKm={store.avgPaceSecondsPerKm || store.currentPaceSecondsPerKm}
          currentPaceSecondsPerKm={store.currentPaceSecondsPerKm}
          splits={store.splits || []}
          elevationGainMeters={store.elevationGainMeters}
          ghostData={store.ghostOpponent}
          ghostDeltaSeconds={store.ghostDeltaSeconds}
          activityType={store.activityType}
          recordingMode={store.recordingMode}
          isPaused={isPaused}
          onPause={handlePause}
          onResume={handleResume}
          onFinish={() => setShowEndConfirm(true)}
        />

        {/* Finish Confirmation Dialog - Anti-Exploit (Timer Never Pauses in Ranked Mode) */}
        <Modal visible={showEndConfirm} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View
              style={[
                styles.modalBox,
                {
                  backgroundColor: isDark ? '#0D0D10' : '#FFFFFF',
                  borderColor: colors.surfaceBorder,
                },
              ]}
            >
              {store.recordingMode === 'RANKED' ? (
                <>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <Zap size={16} color={colors.accent} />
                    <Text style={[styles.modalTitle, { color: colors.textPrimary, marginBottom: 0 }]}>
                      Finish Ranked Session?
                    </Text>
                  </View>

                  {/* Warning that timer is actively running and pace is dropping */}
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 6,
                      backgroundColor: isDark ? 'rgba(255, 69, 58, 0.12)' : 'rgba(255, 69, 58, 0.08)',
                      borderColor: '#FF453A',
                      borderWidth: 1,
                      borderRadius: 8,
                      paddingHorizontal: 10,
                      paddingVertical: 6,
                      marginTop: 8,
                      marginBottom: 10,
                    }}
                  >
                    <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#FF453A' }} />
                    <Text style={{ fontSize: 10.5, fontWeight: '800', color: '#FF453A', letterSpacing: 0.5 }}>
                      TIMER STILL RUNNING • PACE DROPPING
                    </Text>
                  </View>

                  <Text style={[styles.modalDesc, { color: colors.textSecondary }]}>
                    Ranked mode enforces continuous, non-stop effort. The clock is active in the background. Tap 'Keep Going' to resume running immediately with no time lost, or 'Save & Finish' to record your PR.
                  </Text>

                  <View style={styles.modalActionStack}>
                    <PerformaButton
                      title="SAVE & FINISH"
                      onPress={handleFinish}
                      variant="accent"
                      size="md"
                      style={{ marginBottom: 8 }}
                    />
                    <PerformaButton
                      title="Keep Going (Resume)"
                      onPress={() => setShowEndConfirm(false)}
                      variant="secondary"
                      size="md"
                      style={{ marginBottom: 8 }}
                    />
                    <PerformaButton
                      title="Discard Session"
                      onPress={handleDiscard}
                      variant="danger"
                      size="md"
                    />
                  </View>
                </>
              ) : (
                <>
                  <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Complete Casual Session?</Text>
                  <Text style={[styles.modalDesc, { color: colors.textSecondary }]}>
                    Verified telemetry will be saved to your profile and lifetime XP awarded. (Casual sessions earn 0 Division PR).
                  </Text>

                  <View style={styles.modalActionStack}>
                    <PerformaButton
                      title="SAVE & FINISH"
                      onPress={handleFinish}
                      variant="accent"
                      size="md"
                      style={{ marginBottom: 8 }}
                    />
                    <PerformaButton
                      title="Resume Recording"
                      onPress={() => setShowEndConfirm(false)}
                      variant="secondary"
                      size="md"
                      style={{ marginBottom: 8 }}
                    />
                    <PerformaButton
                      title="Discard Session"
                      onPress={handleDiscard}
                      variant="danger"
                      size="md"
                    />
                  </View>
                </>
              )}
            </View>
          </View>
        </Modal>

        </>
      ) : (
        store.state !== 'COUNTDOWN' && (
          <>
            {/* Floating Top Header: Live GPS Status & Exit */}
      <View style={[styles.floatingPreHeader, { top: insets.top + 8 }]}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => router.replace('/(tabs)/home')}
          style={[
            styles.floatingBackBtn,
            {
              backgroundColor: isDark ? 'rgba(11, 15, 20, 0.94)' : 'rgba(255, 255, 255, 0.96)',
              borderColor: colors.surfaceBorder,
            },
          ]}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          accessibilityLabel="Back to Home"
        >
          <X size={16} color={colors.textPrimary} strokeWidth={2.4} />
        </TouchableOpacity>

        <View
          style={[
            styles.floatingGpsPill,
            {
              backgroundColor: isDark ? 'rgba(11, 15, 20, 0.94)' : 'rgba(255, 255, 255, 0.96)',
              borderColor: colors.surfaceBorder,
            },
          ]}
        >
          <View style={[styles.liveDot, { backgroundColor: colors.accent }]} />
          <Text style={[styles.gpsPillText, { color: colors.textPrimary }]}>GPS ACTIVE</Text>
        </View>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => mapRef.current?.recenter()}
          style={[
            styles.floatingBackBtn,
            {
              backgroundColor: isDark ? 'rgba(11, 15, 20, 0.94)' : 'rgba(255, 255, 255, 0.96)',
              borderColor: colors.surfaceBorder,
            },
          ]}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          accessibilityLabel="Recenter location"
        >
          <Crosshair size={18} color={colors.accent} strokeWidth={2.4} />
        </TouchableOpacity>
      </View>

      {/* If a route is pre-loaded for navigation or ghost racing */}
      {activeRoute && (
        <View
          style={[
            styles.loadedRouteFloatingBanner,
            {
              top: insets.top + 52,
              backgroundColor: isDark ? 'rgba(11, 15, 20, 0.94)' : 'rgba(255, 255, 255, 0.96)',
              borderColor: colors.accent,
            },
          ]}
        >
          <Navigation size={12} color={colors.accent} />
          <Text style={[styles.loadedRouteText, { color: colors.textPrimary }]} numberOfLines={1}>
            Loaded Course: {activeRoute.title} ({(activeRoute.distanceMeters / 1000).toFixed(1)} km)
          </Text>
          <TouchableOpacity
            activeOpacity={0.7}
            hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}
            style={{ padding: 4, marginLeft: 4 }}
            onPress={() => {
              setLoadedCourseRoute(null);
              store.setSelectedRoute(null);
              store.setGhostOpponent(null);
              store.setMode('FREE');
              try {
                router.setParams({ routeId: '', mode: '' });
              } catch (_) {}
            }}
          >
            <Text style={{ color: colors.textMuted, fontSize: 13, fontWeight: '800' }}>✕</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Docked Edge-to-Edge Bottom Cockpit Sheet */}
      <View
        style={[
          styles.idleDockSheet,
          {
            backgroundColor: isDark ? '#0D0D10' : '#FFFFFF',
            borderTopColor: isDark ? 'rgba(255, 255, 255, 0.14)' : 'rgba(0, 0, 0, 0.1)',
            paddingBottom: Math.max(insets.bottom, 6),
          },
        ]}
      >
        {/* Cyber Lines Artistic Background */}
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          <Image
            source={COSMETIC_IMAGES.backgrounds.cyberLines}
            style={StyleSheet.absoluteFill}
            resizeMode="cover"
          />
          <View
            style={[
              StyleSheet.absoluteFill,
              { backgroundColor: isDark ? 'rgba(8, 10, 15, 0.78)' : 'rgba(255, 255, 255, 0.88)' },
            ]}
          />
        </View>

        {/* Tactile Sheet Handle Grabber */}
        <View style={[styles.sheetHandleBar, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.22)' : 'rgba(0, 0, 0, 0.15)' }]} />

        {/* Ergonomic Sport Selector Tabs */}
        <View
          style={[
            styles.sportTabsRow,
            {
              backgroundColor: isDark ? '#141A22' : '#F1F5F9',
              borderColor: colors.surfaceBorder,
            },
          ]}
        >
          {sports.map((item) => {
            const isSelected = store.activityType === item.type;
            const Icon = item.icon;
            return (
              <TouchableOpacity
                key={item.type}
                activeOpacity={0.8}
                onPress={() => store.setActivityType(item.type)}
                style={[
                  styles.sportTabItem,
                  isSelected && {
                    backgroundColor: colors.accent,
                    shadowColor: colors.accent,
                    shadowOpacity: 0.35,
                    shadowRadius: 5,
                  },
                ]}
              >
                <Icon size={14} color={isSelected ? '#000000' : colors.textMuted} />
                <Text
                  style={[
                    styles.sportTabLabel,
                    {
                      color: isSelected ? '#000000' : colors.textMuted,
                      fontWeight: isSelected ? '900' : '700',
                    },
                  ]}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Athletic Mode Switcher: Ranked (Non-Stop) vs Casual (Flexible) */}
        <View style={styles.modeSelectorBlock}>
          <View
            style={[
              styles.modeSwitcherRow,
              {
                backgroundColor: isDark ? '#141A22' : '#F1F5F9',
                borderColor: colors.surfaceBorder,
              },
            ]}
          >
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => store.setRecordingMode('RANKED')}
              style={[
                styles.modeSwitcherTab,
                store.recordingMode === 'RANKED' && {
                  backgroundColor: colors.accent,
                  shadowColor: colors.accent,
                  shadowOpacity: 0.35,
                  shadowRadius: 5,
                },
              ]}
            >
              <Zap
                size={13}
                color={
                  store.recordingMode === 'RANKED'
                    ? '#000000'
                    : colors.textMuted
                }
              />
              <Text
                style={[
                  styles.modeSwitcherLabel,
                  {
                    color:
                      store.recordingMode === 'RANKED'
                        ? '#000000'
                        : colors.textMuted,
                    fontWeight: store.recordingMode === 'RANKED' ? '900' : '700',
                  },
                ]}
              >
                ⚡ RANKED (NON-STOP)
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => store.setRecordingMode('CASUAL')}
              style={[
                styles.modeSwitcherTab,
                store.recordingMode === 'CASUAL' && {
                  backgroundColor: isDark ? '#232D3F' : '#E2E8F0',
                  shadowColor: '#000000',
                  shadowOpacity: 0.15,
                  shadowRadius: 3,
                },
              ]}
            >
              <Text style={{ fontSize: 11 }}>☕</Text>
              <Text
                style={[
                  styles.modeSwitcherLabel,
                  {
                    color:
                      store.recordingMode === 'CASUAL'
                        ? colors.textPrimary
                        : colors.textMuted,
                    fontWeight: store.recordingMode === 'CASUAL' ? '900' : '700',
                  },
                ]}
              >
                CASUAL (FLEXIBLE)
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Dual Athletic Cockpit Row: Ghost Opponent & Adaptive Pacer Strategy */}
        <View style={styles.idleOptionsRow}>
          {/* Ghost Target Chip (Performa Pro Instrument) */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => {
              if (!user?.isPro) {
                Alert.alert(
                  '👻 Ghost Mode (Performa Pro)',
                  'Ghost Mode lets you race real-time ghost avatars of your personal records and rival athletes. Unlock with Performa Pro.',
                  [
                    { text: 'Later', style: 'cancel' },
                    { text: 'Unlock Pro / Judge Access', onPress: () => router.push('/pro') },
                  ]
                );
                return;
              }
              setShowGhostTargetModal(true);
            }}
            style={[
              styles.idleOptionChip,
              {
                backgroundColor: isDark ? '#141A22' : '#F8FAFC',
                borderColor: store.mode === 'GHOST' ? '#A855F7' : colors.surfaceBorder,
                flex: 1,
              },
            ]}
          >
            <Zap size={13} color={store.mode === 'GHOST' ? '#A855F7' : (user?.isPro ? colors.textMuted : '#A855F7')} />
            <Text
              style={[
                styles.idleOptionText,
                { color: store.mode === 'GHOST' ? '#A855F7' : (user?.isPro ? colors.textSecondary : '#A855F7') },
              ]}
              numberOfLines={1}
            >
              {store.mode === 'GHOST'
                ? store.ghostOpponent
                  ? store.ghostOpponent.athleteName.split(' ')[0]
                  : 'Ghost Race'
                : user?.isPro
                ? 'Ghost Mode'
                : 'Ghost (PRO)'}
            </Text>
          </TouchableOpacity>

          {/* Adaptive Pacer Strategy Chip */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => {
              if (!user?.isPro) {
                Alert.alert(
                  '✨ Performa Pro Instrument',
                  'Adaptive Pacer Strategy is a Pro feature powered by RevenueCat. Unlock now or activate the Judge VIP Trial for free.',
                  [
                    { text: 'Later', style: 'cancel' },
                    { text: 'Unlock Pro / Judge Access', onPress: () => router.push('/pro') },
                  ]
                );
                return;
              }
              setIsMidRunPacerAdjust(false);
              setShowPacerModal(true);
            }}
            style={[
              styles.idleOptionChip,
              {
                backgroundColor: isDark ? '#141A22' : '#F8FAFC',
                borderColor: pacerSettings.enabled ? colors.accent : colors.surfaceBorder,
                flex: 1,
              },
            ]}
          >
            <ActivityIcon size={13} color={pacerSettings.enabled ? colors.accent : (user?.isPro ? colors.textMuted : colors.accent)} />
            <Text
              style={[
                styles.idleOptionText,
                { color: pacerSettings.enabled ? colors.accent : (user?.isPro ? colors.textSecondary : colors.accent) },
              ]}
              numberOfLines={1}
            >
              {pacerSettings.enabled
                ? pacerSettings.strategy === 'NEGATIVE_SPLIT'
                  ? 'Neg Split'
                  : pacerSettings.strategy === 'POSITIVE_SPLIT'
                  ? 'Pos Split'
                  : 'Even Split'
                : user?.isPro
                ? 'Pacer'
                : 'Pacer (PRO)'}
            </Text>
          </TouchableOpacity>

          {/* Bluetooth Sensor Hub Chip */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setShowDeviceModal(true)}
            style={[
              styles.idleOptionChip,
              {
                backgroundColor: isDark ? '#141A22' : '#F8FAFC',
                borderColor: connectedDevice ? '#FF5C6C' : colors.surfaceBorder,
                flex: 1,
              },
            ]}
          >
            {connectedDevice ? (
              <>
                <Heart size={13} color="#FF5C6C" fill="#FF5C6C" />
                <Text
                  style={[styles.idleOptionText, { color: '#FF5C6C', fontWeight: '800' }]}
                  numberOfLines={1}
                >
                  {activeHeartRate ? `${activeHeartRate} BPM` : 'Sensor OK'}
                </Text>
              </>
            ) : (
              <>
                <Bluetooth size={13} color={colors.textMuted} strokeWidth={2.2} />
                <Text
                  style={[styles.idleOptionText, { color: colors.textSecondary }]}
                  numberOfLines={1}
                >
                  Sensor
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Big Athletic START ACTIVITY Button - Raster Game Plate */}
        <TouchableOpacity
          activeOpacity={0.88}
          onPress={handleStart}
          style={styles.rasterStartBtn}
          accessibilityRole="button"
          accessibilityLabel="Start Activity"
        >
          <Image
            source={COSMETIC_IMAGES.buttons.startActivity}
            style={styles.rasterStartBtnImg}
            resizeMode="contain"
          />
        </TouchableOpacity>
      </View>
        </>
      ))}

      {/* Bluetooth Sensor Modal */}
      <DeviceConnectModal visible={showDeviceModal} onClose={() => setShowDeviceModal(false)} />

      {/* Ghost Target Selection Modal */}
      <GhostTargetModal
        visible={showGhostTargetModal}
        onClose={() => setShowGhostTargetModal(false)}
        activeRoute={activeRoute}
        currentGhost={store.ghostOpponent}
        onSelectGhost={(ghost) => {
          store.setMode('GHOST');
          store.setGhostOpponent(ghost);
        }}
        onDisableGhost={() => {
          store.setMode('FREE');
          store.setGhostOpponent(null);
        }}
      />

      {/* Pacer Strategy Modal */}
      <PacerStrategyModal
        visible={showPacerModal}
        onClose={() => setShowPacerModal(false)}
        isMidRun={isMidRunPacerAdjust}
        currentDistanceMeters={store.distanceMeters}
        pacerSettings={pacerSettings}
        onSaveSettings={setPacerSettings}
        onRelaxPace={handleRelaxPaceMidRun}
        onSurgePace={handleSurgePaceMidRun}
        onSwitchStrategy={handleSwitchStrategyMidRun}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  countdownOverlay: {
    ...StyleSheet.absoluteFill as any,
    zIndex: 50,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },

  centered: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  fullBleedMap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  },

  countdownKicker: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 2,
    marginBottom: 8,
  },
  countdownText: {
    fontSize: 100,
    fontWeight: '900',
    letterSpacing: -4,
    lineHeight: 110,
  },
  countdownSub: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 12,
  },
  countdownCarePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    marginTop: 18,
  },
  countdownCareText: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  floatingActiveHeader: {
    position: 'absolute',
    left: 14,
    right: 14,
    zIndex: 30,
  },
  topHudPillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  floatingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    gap: 5,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  activityBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  simBadgeText: {
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  topMetricBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: RADIUS.md,
    borderWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 6,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 6,
  },
  topMetricCell: {
    flex: 1,
    alignItems: 'center',
  },
  topMetricVal: {
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: -0.4,
  },
  topMetricLabel: {
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginTop: 1,
  },
  topMetricDivider: {
    width: 1,
    height: 20,
    opacity: 0.6,
  },
  careAlertFloatingBanner: {
    position: 'absolute',
    left: 14,
    right: 14,
    borderRadius: RADIUS.lg,
    borderWidth: 1.5,
    padding: 12,
    zIndex: 35,
    shadowColor: '#FF453A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 8,
  },
  careAlertTitle: {
    fontSize: 10,
    fontWeight: '900',
    color: '#FF453A',
    letterSpacing: 0.8,
  },
  careAlertBody: {
    fontSize: 11,
    fontWeight: '600',
    lineHeight: 15,
    marginTop: 2,
    marginBottom: 8,
  },
  careAlertActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  careAlertActionBtn: {
    backgroundColor: '#FF453A',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.sm,
  },
  careAlertActionBtnText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  careAlertDismissBtn: {
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  careAlertDismissText: {
    fontSize: 10,
    fontWeight: '700',
  },
  floatingPreHeader: {
    position: 'absolute',
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 30,
  },
  floatingBackBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  floatingGpsPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    gap: 6,
  },
  gpsPillText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  sensorPillButton: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 4,
    elevation: 3,
  },
  loadedRouteFloatingBanner: {
    position: 'absolute',
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    gap: 8,
    zIndex: 30,
  },
  loadedRouteText: {
    fontSize: 11,
    fontWeight: '700',
    flex: 1,
  },
  idleDockSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    width: '100%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1.5,
    borderLeftWidth: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    paddingHorizontal: 16,
    paddingTop: 8,
    zIndex: 30,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 16,
  },
  sheetHandleBar: {
    width: 32,
    height: 3,
    borderRadius: 1.5,
    alignSelf: 'center',
    marginBottom: 6,
  },
  floatingRecenterFab: {
    position: 'absolute',
    right: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 35,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 8,
  },
  sportTabsRow: {
    flexDirection: 'row',
    borderRadius: RADIUS.full,
    borderWidth: 1,
    padding: 2,
    marginBottom: 6,
    gap: 4,
  },
  sportTabItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 5,
    borderRadius: RADIUS.full,
    gap: 4,
  },
  selectedTabOverflow: {
    paddingVertical: 0,
    paddingHorizontal: 0,
    overflow: 'hidden',
  },
  sportTabPlateBg: {
    width: '100%',
    height: 32,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RADIUS.full,
    overflow: 'hidden',
    gap: 4,
  },
  sportTabInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  sportTabLabel: {
    fontSize: 10.5,
    letterSpacing: 0.5,
  },
  modeSelectorBlock: {
    marginBottom: 6,
  },
  modeSwitcherRow: {
    flexDirection: 'row',
    borderRadius: RADIUS.full,
    borderWidth: 1,
    padding: 2,
    gap: 4,
  },
  modeSwitcherTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 5,
    borderRadius: RADIUS.full,
    gap: 4,
  },
  modePlateBg: {
    width: '100%',
    height: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RADIUS.full,
    overflow: 'hidden',
    gap: 4,
  },
  modeInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  modeSwitcherLabel: {
    fontSize: 10,
    letterSpacing: 0.4,
  },
  idleOptionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 6,
  },
  idleOptionChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 4,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    gap: 4,
  },
  idleOptionText: {
    fontSize: 10.5,
    fontWeight: '700',
  },
  rasterStartBtn: {
    width: '100%',
    height: 70,
    marginTop: 8,
    marginBottom: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rasterStartBtnImg: {
    width: '100%',
    height: '100%',
  },
  startHeroBtn: {
    width: '100%',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  modalBox: {
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    padding: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '900',
    marginBottom: 8,
  },
  modalDesc: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 20,
  },
  modalActionStack: {
    width: '100%',
  },
});
