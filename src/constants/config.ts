/**
 * PERFORMA Centralized Game & Progression Balancing Configuration
 * Never hardcode balance numbers across the codebase!
 */

export type ActivityType = 'RUN' | 'CYCLE' | 'WALK' | 'SWIM';

export const XP_CONFIG = {
  baseXpPerMinute: {
    RUN: 7,
    CYCLE: 6,
    WALK: 5,
    SWIM: 8,
  } as Record<ActivityType, number>,

  // Diminishing returns progression to discourage dangerous volume
  diminishingReturns: [
    { upToMinutes: 30, multiplier: 1.0 },
    { upToMinutes: 60, multiplier: 0.7 },
    { upToMinutes: 120, multiplier: 0.4 },
    { upToMinutes: Infinity, multiplier: 0.2 },
  ],

  dailyCap: 1500,
  weeklyCap: 8000,

  // Level curve: Level L requires XP = 500 * (L ^ 1.6)
  levelFormula: {
    baseMultiplier: 500,
    exponent: 1.6,
  },
};

export const COMPETITIVE_CONFIG = {
  seasonDurationDays: 56, // Exactly 8 weeks (8 * 7 days)
  seasonDurationWeeks: 8,
  
  // Weekly streak definition: Healthy consistency
  qualifyingActivitiesForWeeklyStreak: 2,
  minActivityDurationSeconds: 600, // 10 minutes minimum
  minActivityDistanceMeters: 1000, // 1 km minimum

  // Divisions with 5 tiers each (V is lowest, I is highest)
  divisions: [
    { name: 'Bronze', basePr: 0, prPerTier: 200, color: '#CD7F32' },
    { name: 'Silver', basePr: 1000, prPerTier: 250, color: '#C0C0C0' },
    { name: 'Gold', basePr: 2400, prPerTier: 200, color: '#FFD700' },
    { name: 'Platinum', basePr: 3400, prPerTier: 300, color: '#00E5FF' },
    { name: 'Diamond', basePr: 4900, prPerTier: 400, color: '#B9F2FF' },
  ] as const,

  zenithThresholdRank: 100, // Top 100 in each category by Sunday 23:59:59 UTC earns Zenith Season (X) title
};

export const RECORDING_CONFIG = {
  // GPS Quality Filter Thresholds
  maxSpeedMps: {
    RUN: 12.5,   // ~45 km/h (world record sprint speed)
    WALK: 4.5,   // ~16 km/h
    CYCLE: 25.0, // ~90 km/h (downhill sprint)
    SWIM: 3.0,   // ~10.8 km/h
  } as Record<ActivityType, number>,

  maxAccelerationMps2: 8.0, // Discard sudden teleportation
  maxAccuracyMeters: 25.0,  // Drop points with >25m GPS horizontal error
  sampleIntervalMs: 1000,   // 1 Hz tracking
  uiThrottleIntervalMs: 1000, // Throttled UI render loop

  autoPauseSpeedThresholdMps: 0.6, // < ~2.1 km/h triggers auto-pause
  autoPauseDelaySeconds: 4,
};

export const PACER_CONFIG = {
  defaultTargetDistances: [
    { id: '1k', label: '1K Time Trial', meters: 1000 },
    { id: '5k', label: '5K Classic', meters: 5000 },
    { id: '10k', label: '10K Challenge', meters: 10000 },
    { id: 'half', label: 'Half Marathon', meters: 21097.5 },
  ],
  speechIntervals: ['OFF', '1_KM', '5_MINUTES', 'SMART'] as const,
};
