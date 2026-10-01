import { create } from 'zustand';
import {
  RecordingState,
  GPSQualityScore,
  LocationPoint,
  ActivitySplit,
  GhostData,
  RouteItem,
  RecordingCompetitionMode,
} from '../../types';
import { ActivityType } from '../../constants/config';

interface RecordingStoreState {
  state: RecordingState;
  activityType: ActivityType;
  mode: 'FREE' | 'ROUTE' | 'GHOST' | 'PACER';
  recordingMode: RecordingCompetitionMode;
  selectedRoute: RouteItem | null;
  gpsQuality: GPSQualityScore;
  countdownValue: number;

  // Real-time Tracked Metrics
  elapsedSeconds: number;
  movingSeconds: number;
  distanceMeters: number;
  currentPaceSecondsPerKm: number;
  avgPaceSecondsPerKm: number;
  bestPaceSecondsPerKm: number;
  elevationGainMeters: number;
  routeCoordinates: { latitude: number; longitude: number; altitude?: number }[];
  splits: ActivitySplit[];

  // Ghost Match Data
  ghostOpponent: GhostData | null;
  ghostDeltaSeconds: number; // positive = ahead, negative = behind

  // Testing & Simulation
  isSimulatorActive: boolean;

  // Actions
  setActivityType: (type: ActivityType) => void;
  setMode: (mode: 'FREE' | 'ROUTE' | 'GHOST' | 'PACER') => void;
  setRecordingMode: (mode: RecordingCompetitionMode) => void;
  setSelectedRoute: (route: RouteItem | null) => void;
  setGhostOpponent: (ghost: GhostData | null) => void;
  setSimulatorActive: (active: boolean) => void;
  setState: (state: RecordingState) => void;
  setCountdownValue: (val: number) => void;
  setGpsQuality: (quality: GPSQualityScore) => void;
  updateMetrics: (updates: {
    elapsedSeconds?: number;
    movingSeconds?: number;
    distanceMeters?: number;
    currentPaceSecondsPerKm?: number;
    avgPaceSecondsPerKm?: number;
    bestPaceSecondsPerKm?: number;
    elevationGainMeters?: number;
    coordinate?: { latitude: number; longitude: number; altitude?: number };
    split?: ActivitySplit;
    ghostDeltaSeconds?: number;
  }) => void;
  resetSessionMetrics: () => void;
  reset: () => void;
}

const INITIAL_STATE = {
  state: 'IDLE' as RecordingState,
  activityType: 'RUN' as ActivityType,
  mode: 'FREE' as const,
  recordingMode: 'RANKED' as RecordingCompetitionMode,
  selectedRoute: null,
  gpsQuality: 'GOOD' as GPSQualityScore,
  countdownValue: 3,
  elapsedSeconds: 0,
  movingSeconds: 0,
  distanceMeters: 0,
  currentPaceSecondsPerKm: 0,
  avgPaceSecondsPerKm: 0,
  bestPaceSecondsPerKm: 0,
  elevationGainMeters: 0,
  routeCoordinates: [],
  splits: [],
  ghostOpponent: null,
  ghostDeltaSeconds: 0,
  isSimulatorActive: false,
};

export const useRecordingStore = create<RecordingStoreState>((set) => ({
  ...INITIAL_STATE,

  setActivityType: (activityType) => set({ activityType }),
  setMode: (mode) => set({ mode }),
  setRecordingMode: (recordingMode) => set({ recordingMode }),
  setSelectedRoute: (selectedRoute) => set({ selectedRoute }),
  setGhostOpponent: (ghostOpponent) => set({ ghostOpponent }),
  setSimulatorActive: (isSimulatorActive) => set({ isSimulatorActive }),
  setState: (state) => set({ state }),
  setCountdownValue: (countdownValue) => set({ countdownValue }),
  setGpsQuality: (gpsQuality) => set({ gpsQuality }),

  updateMetrics: (updates) =>
    set((prev) => {
      const newCoords = updates.coordinate
        ? [...prev.routeCoordinates, updates.coordinate]
        : prev.routeCoordinates;

      const newSplits = updates.split
        ? [...prev.splits, updates.split]
        : prev.splits;

      return {
        elapsedSeconds: updates.elapsedSeconds !== undefined ? updates.elapsedSeconds : prev.elapsedSeconds,
        movingSeconds: updates.movingSeconds !== undefined ? updates.movingSeconds : prev.movingSeconds,
        distanceMeters: updates.distanceMeters !== undefined ? updates.distanceMeters : prev.distanceMeters,
        currentPaceSecondsPerKm:
          updates.currentPaceSecondsPerKm !== undefined
            ? updates.currentPaceSecondsPerKm
            : prev.currentPaceSecondsPerKm,
        avgPaceSecondsPerKm:
          updates.avgPaceSecondsPerKm !== undefined
            ? updates.avgPaceSecondsPerKm
            : prev.avgPaceSecondsPerKm,
        bestPaceSecondsPerKm:
          updates.bestPaceSecondsPerKm !== undefined
            ? updates.bestPaceSecondsPerKm
            : prev.bestPaceSecondsPerKm,
        elevationGainMeters:
          updates.elevationGainMeters !== undefined
            ? updates.elevationGainMeters
            : prev.elevationGainMeters,
        routeCoordinates: newCoords,
        splits: newSplits,
        ghostDeltaSeconds:
          updates.ghostDeltaSeconds !== undefined
            ? updates.ghostDeltaSeconds
            : prev.ghostDeltaSeconds,
      };
    }),

  resetSessionMetrics: () =>
    set({
      elapsedSeconds: 0,
      movingSeconds: 0,
      distanceMeters: 0,
      currentPaceSecondsPerKm: 0,
      avgPaceSecondsPerKm: 0,
      bestPaceSecondsPerKm: 0,
      elevationGainMeters: 0,
      routeCoordinates: [],
      splits: [],
      ghostDeltaSeconds: 0,
    }),

  reset: () => set(INITIAL_STATE),
}));
