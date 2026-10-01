import { ActivityType } from '../constants/config';

export type Units = 'METRIC' | 'IMPERIAL';

export interface UserProfile {
  id: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
  bio?: string;
  units: Units;
  preferredActivity: ActivityType;
  
  // Progression
  level: number;
  lifetimeXp: number;
  currentXp: number;
  xpForNextLevel: number;
  
  // Competitive
  currentSeasonId: string;
  currentDivision: string; // e.g. "GOLD"
  currentTier: number;     // 1 to 5 (V to I)
  currentPr: number;
  peakPr: number;
  rank?: number;
  isZenith100: boolean;
  zenithBadges: { season: number; rank: number }[];
  
  // Consistency
  streakWeeks: number;
  lastActiveWeek: string;
  qualifyingActivitiesThisWeek: number;
  
  // Stats
  lifetimeDistanceMeters: number;
  lifetimeDurationSeconds: number;
  lifetimeActivitiesCount: number;
  personalBests: {
    distanceLabel: string;
    bestTimeSeconds: number;
    activityId: string;
    date: string;
  }[];

  // Pro Entitlement
  isPro: boolean;
  clanId?: string;
  clanName?: string;
  equippedCosmetics: {
    avatarFrame?: string;
    title?: string;
    badge?: string;
    theme?: string;
  };
}

export type RecordingState =
  | 'IDLE'
  | 'PREPARING'
  | 'COUNTDOWN'
  | 'RECORDING'
  | 'PAUSED'
  | 'RESUMING'
  | 'FINALIZING'
  | 'COMPLETED'
  | 'FAILED';

export type GPSQualityScore = 'EXCELLENT' | 'GOOD' | 'WEAK' | 'NONE';

export interface LocationPoint {
  latitude: number;
  longitude: number;
  altitude?: number;
  accuracy?: number;
  speed?: number; // m/s
  heading?: number;
  timestamp: number;
}

export interface ActivitySplit {
  splitNumber: number;
  distanceMeters: number;
  elapsedSeconds: number;
  paceSecondsPerKm: number;
  elevationGainMeters: number;
  avgHeartRate?: number;
}

export type RecordingCompetitionMode = 'RANKED' | 'CASUAL';

export interface ActivitySummary {
  id: string;
  userId: string;
  type: ActivityType;
  startTime: number;
  endTime: number;
  elapsedSeconds: number;
  movingSeconds: number;
  distanceMeters: number;
  avgPaceSecondsPerKm: number;
  bestPaceSecondsPerKm: number;
  avgSpeedMps: number;
  maxSpeedMps: number;
  elevationGainMeters: number;
  elevationLossMeters: number;
  xpEarned: number;
  prEarned: number;
  recordingMode?: RecordingCompetitionMode;
  title?: string;
  description?: string;
  routeCoordinates: { latitude: number; longitude: number; altitude?: number }[];
  splits: ActivitySplit[];
  verificationStatus: 'VERIFIED' | 'PENDING_REVIEW' | 'FLAGGED';
  qualityScore: number;
  isNewPb?: boolean;
  pbLabel?: string;
  ghostId?: string;
}

export interface GhostData {
  id: string;
  routeId?: string;
  activityId: string;
  athleteName: string;
  activityType: ActivityType;
  totalDistanceMeters: number;
  totalDurationSeconds: number;
  // Normalized distance checkpoints (e.g. every 50m)
  checkpoints: {
    distanceMeters: number;
    elapsedSeconds: number;
    latitude: number;
    longitude: number;
    altitude?: number;
  }[];
}

export interface RouteItem {
  id: string;
  title: string;
  description: string;
  distanceMeters: number;
  elevationGainMeters: number;
  estimatedDurationSeconds: number;
  difficulty: 'EASY' | 'MODERATE' | 'HARD' | 'EXPERT';
  activityType: ActivityType;
  polyline: { latitude: number; longitude: number; altitude?: number }[];
  attemptsCount: number;
  recordHolderName: string;
  recordTimeSeconds: number;
  communityRating: number;
  isSaved?: boolean;
  city?: string;
  region?: string;
  isPrivate?: boolean;
  isCreatedByUser?: boolean;
}

export interface ClanMember {
  userId: string;
  displayName: string;
  username: string;
  avatarUrl?: string;
  division: string;
  tier: number;
  role: 'LEADER' | 'OFFICER' | 'MEMBER';
  contributionPr: number;
  joinedAt: number;
}

export interface ClanAchievement {
  id: string;
  title: string;
  description: string;
  category: 'MILEAGE' | 'SEASON' | 'MEMBERS' | 'GHOST';
  progress: number;
  target: number;
  unlocked: boolean;
  points: number;
  iconName: string;
}

export interface ClanTitle {
  id: string;
  title: string;
  description: string;
  isUnlocked: boolean;
  isEquipped?: boolean;
}

export interface ClanItem {
  id: string;
  name: string;
  tag: string;
  description: string;
  badgeIcon: string;
  accentColor?: string;
  inviteCode: string;
  leaderId: string;
  leaderName?: string;
  memberCount: number;
  seasonPr: number;
  globalRank: number;
  members?: ClanMember[];
  topContributors: {
    userId: string;
    name: string;
    avatarUrl?: string;
    contributionPr: number;
  }[];
  achievements?: ClanAchievement[];
  titles?: ClanTitle[];
  equippedTitle?: string;
}


export interface FriendRequest {
  id: string;
  senderId: string;
  senderName: string;
  senderUsername: string;
  senderDivision: string;
  senderTier: number;
  receiverId: string;
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED';
  createdAt: number;
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  athleteName: string;
  avatarUrl: string;
  pr: number;
  division: string;
  tier: number;
  streakWeeks: number;
  isUser: boolean;
}

export interface FriendItem {
  id: string;
  displayName: string;
  username: string;
  avatarUrl?: string;
  level: number;
  division: string;
  currentPr: number;
  streakWeeks: number;
  lastActiveText: string;
  isFriend: boolean;
  hasGhostAvailable: boolean;
}

export interface MissionItem {
  id: string;
  title: string;
  description: string;
  category: 'WEEKLY' | 'SEASONAL' | 'SOCIAL' | 'PERFORMANCE' | 'EXPLORATION';
  currentProgress: number;
  targetProgress: number;
  progressUnit: string;
  rewardXp: number;
  rewardBadge?: string;
  isCompleted: boolean;
  isClaimed: boolean;
}

export interface InventoryCosmetic {
  id: string;
  name: string;
  type: 'FRAME' | 'TITLE' | 'BADGE' | 'THEME';
  rarity: 'COMMON' | 'RARE' | 'EPIC' | 'ZENITH';
  description: string;
  isOwned: boolean;
  isEquipped: boolean;
  icon: string;
}

export type RoutePrivacyMode = 'FULL' | 'SILHOUETTE_ONLY' | 'HIDDEN';

export type PacerSplitStrategy = 'EVEN' | 'NEGATIVE_SPLIT' | 'POSITIVE_SPLIT';

export type PacerStrategyIntensity = 'MILD' | 'MODERATE' | 'AGGRESSIVE';

export interface PacerSplitTarget {
  kmNumber: number;
  targetPaceSeconds: number;
  cumulativeTargetSeconds: number;
}

export interface PacerSettings {
  enabled: boolean;
  targetDistanceMeters: number;
  targetTimeSeconds: number;
  strategy: PacerSplitStrategy;
  intensity?: PacerStrategyIntensity;
  targetCadence?: number;
  voiceInterval: 'OFF' | '1_KM' | '5_MINUTES' | 'SMART';
  splits?: PacerSplitTarget[];
}

