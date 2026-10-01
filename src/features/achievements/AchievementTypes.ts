export type AchievementCategory =
  | 'ACTIVITY'
  | 'DISTANCE'
  | 'PROGRESS'
  | 'CONSISTENCY'
  | 'EXPLORATION'
  | 'GHOSTS'
  | 'SOCIAL'
  | 'COMPETITIVE'
  | 'VARIETY';

export type AchievementRarity =
  | 'COMMON'
  | 'UNCOMMON'
  | 'RARE'
  | 'EPIC'
  | 'LEGENDARY'
  | 'ZENITH';

export const RARITY_POINTS: Record<AchievementRarity, number> = {
  COMMON: 10,
  UNCOMMON: 25,
  RARE: 50,
  EPIC: 100,
  LEGENDARY: 250,
  ZENITH: 500,
};

export const RARITY_COLORS: Record<AchievementRarity, { text: string; bg: string; border: string }> = {
  COMMON: { text: '#94A3B8', bg: 'rgba(148, 163, 184, 0.12)', border: '#475569' },
  UNCOMMON: { text: '#34D399', bg: 'rgba(52, 211, 153, 0.12)', border: '#059669' },
  RARE: { text: '#38BDF8', bg: 'rgba(56, 189, 248, 0.12)', border: '#0284C7' },
  EPIC: { text: '#A855F7', bg: 'rgba(168, 85, 247, 0.12)', border: '#7E22CE' },
  LEGENDARY: { text: '#F59E0B', bg: 'rgba(245, 158, 11, 0.14)', border: '#D97706' },
  ZENITH: { text: '#CCFF00', bg: 'rgba(204, 255, 0, 0.14)', border: '#CCFF00' },
};

export interface AchievementReward {
  id: string;
  type: 'BADGE' | 'TITLE' | 'FRAME' | 'BANNER';
  name: string;
  assetId: string;
}

export interface AchievementDefinition {
  id: string;
  name: string;
  description: string;
  category: AchievementCategory;
  rarity: AchievementRarity;
  achievementPoints: number;
  iconName: string;
  target: number;
  unit?: string;
  rewards: AchievementReward[];
}

export interface UserAchievementState {
  achievementId: string;
  progress: number;
  unlocked: boolean;
  unlockedAt?: string;
}

export interface ProfileFrame {
  id: string;
  name: string;
  rarity: AchievementRarity;
  borderColor: string;
  glowColor: string;
  unlocked: boolean;
  achievementId?: string;
  image?: any;
  unlockRequirement?: string;
}
