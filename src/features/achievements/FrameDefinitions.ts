import { ProfileFrame } from './AchievementTypes';
import { COSMETIC_IMAGES } from '../../constants/Cosmetics';

export const ALL_FRAMES: ProfileFrame[] = [
  {
    id: 'frame_basic',
    name: 'Carbon Edge',
    rarity: 'COMMON',
    borderColor: '#475569',
    glowColor: 'rgba(71, 85, 105, 0.25)',
    unlocked: true,
    image: COSMETIC_IMAGES.frames.basic,
    unlockRequirement: 'Standard issue tactical frame',
  },
  {
    id: 'frame_pulse',
    name: 'Volt Pulse',
    rarity: 'RARE',
    borderColor: '#CCFF00',
    glowColor: 'rgba(204, 255, 0, 0.40)',
    unlocked: true,
    achievementId: 'cons_seasoned',
    image: COSMETIC_IMAGES.frames.pulse,
    unlockRequirement: 'Reach Level 5 or 25 km Total Distance',
  },
  {
    id: 'frame_circuit',
    name: 'Cyber Circuit',
    rarity: 'EPIC',
    borderColor: '#00E5FF',
    glowColor: 'rgba(0, 229, 255, 0.45)',
    unlocked: false,
    achievementId: 'cons_one_week',
    image: COSMETIC_IMAGES.frames.circuit,
    unlockRequirement: 'Complete a 7-Day Workout Streak',
  },
  {
    id: 'frame_phantom',
    name: 'Phantom Veil',
    rarity: 'EPIC',
    borderColor: '#A855F7',
    glowColor: 'rgba(168, 85, 247, 0.50)',
    unlocked: false,
    achievementId: 'gst_ghost_hunter',
    image: COSMETIC_IMAGES.frames.phantom,
    unlockRequirement: 'Defeat 3 Rival Ghosts in Ghost Chase',
  },
  {
    id: 'frame_champion',
    name: 'Apex Champion',
    rarity: 'LEGENDARY',
    borderColor: '#F59E0B',
    glowColor: 'rgba(245, 158, 11, 0.60)',
    unlocked: false,
    achievementId: 'comp_gold_standard',
    image: COSMETIC_IMAGES.frames.champion,
    unlockRequirement: 'Reach Gold Division or Top 50 Rank',
  },
  {
    id: 'frame_zenith',
    name: 'Zenith Nova',
    rarity: 'ZENITH',
    borderColor: '#CCFF00',
    glowColor: 'rgba(204, 255, 0, 0.85)',
    unlocked: false,
    achievementId: 'comp_zenith',
    image: COSMETIC_IMAGES.frames.zenith,
    unlockRequirement: 'Attain Zenith Division 100 Status',
  },
];

// Helper to resolve frame ID with fallback
export function resolveFrame(frameId?: string): ProfileFrame {
  if (!frameId || frameId === 'frame_default') return ALL_FRAMES[0];
  return ALL_FRAMES.find((f) => f.id === frameId) || ALL_FRAMES[0];
}
