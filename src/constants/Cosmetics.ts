/**
 * Performa Tactical Cosmetics Catalog
 * Centralized raster assets, unlock conditions, and metadata for:
 * - Raster Banners (16:9 widescreen)
 * - Raster Avatars (1024x1024 HD discs)
 * - Raster Transparent Avatar Frames (1024x1024 PNG rings)
 */

export const COSMETIC_IMAGES = {
  banners: {
    explorer: require('../../assets/cosmetics/banners/banner_explorer.jpg'),
    velocity: require('../../assets/cosmetics/banners/banner_velocity.jpg'),
    zenith: require('../../assets/cosmetics/banners/banner_zenith.jpg'),
  },
  avatars: {
    explorer: require('../../assets/cosmetics/avatars/avatar_explorer.jpg'),
    route: require('../../assets/cosmetics/avatars/avatar_route.jpg'),
    sprinter: require('../../assets/cosmetics/avatars/avatar_sprinter.jpg'),
    summit: require('../../assets/cosmetics/avatars/avatar_summit.jpg'),
    ghost: require('../../assets/cosmetics/avatars/avatar_ghost.jpg'),
    competitor: require('../../assets/cosmetics/avatars/avatar_competitor.jpg'),
    rounder: require('../../assets/cosmetics/avatars/avatar_rounder.jpg'),
  },
  frames: {
    basic: require('../../assets/cosmetics/frames/frame_basic.png'),
    pulse: require('../../assets/cosmetics/frames/frame_pulse.png'),
    circuit: require('../../assets/cosmetics/frames/frame_circuit.png'),
    phantom: require('../../assets/cosmetics/frames/frame_phantom.png'),
    champion: require('../../assets/cosmetics/frames/frame_champion.png'),
    zenith: require('../../assets/cosmetics/frames/frame_zenith.png'),
  },
  badges: {
    bronze: require('../../assets/cosmetics/badges/badge_bronze.png'),
    silver: require('../../assets/cosmetics/badges/badge_silver.png'),
    gold: require('../../assets/cosmetics/badges/badge_gold.png'),
    platinum: require('../../assets/cosmetics/badges/badge_platinum.png'),
    diamond: require('../../assets/cosmetics/badges/badge_diamond.png'),
    zenith: require('../../assets/cosmetics/badges/badge_zenith.png'),
    ap: require('../../assets/cosmetics/badges/badge_ap.png'),
  },
  buttons: {
    startActivity: require('../../assets/ui/btn_start_activity.png'),
    recordOrb: require('../../assets/ui/btn_record_orb.png'),
    limePlate: require('../../assets/ui/btn_lime_plate.png'),
    levelPlate: require('../../assets/ui/badge_level_plate.png'),
  },
  tabs: {
    home: require('../../assets/ui/tab_home.png'),
    routes: require('../../assets/ui/tab_routes.png'),
    compete: require('../../assets/ui/tab_compete.png'),
    profile: require('../../assets/ui/tab_profile.png'),
  },
  backgrounds: {
    gameWallpaper: require('../../assets/ui/bg_wallpaper.png'),
    cyberLines: require('../../assets/ui/bg_cyber_lines.png'),
  },
};

export interface RasterAvatarItem {
  id: string;
  name: string;
  category: 'DISCOVERY' | 'NAVIGATION' | 'SPEED' | 'ELEVATION' | 'STEALTH' | 'COMPETITIVE' | 'MASTERY';
  image: any;
  color: string;
  bg: string;
  isLocked?: boolean;
  unlockRequirement?: string;
  achievementId?: string;
}

export const OFFICIAL_AVATARS: RasterAvatarItem[] = [
  {
    id: 'avatar_explorer',
    name: 'Explorer Disc',
    category: 'DISCOVERY',
    image: COSMETIC_IMAGES.avatars.explorer,
    color: '#CCFF00',
    bg: '#0E170A',
    isLocked: false,
    unlockRequirement: 'Default Athlete Disc',
  },
  {
    id: 'avatar_route',
    name: 'Route Pioneer',
    category: 'NAVIGATION',
    image: COSMETIC_IMAGES.avatars.route,
    color: '#00E5FF',
    bg: '#061924',
    isLocked: false,
    unlockRequirement: 'Log 3 GPS Outdoor Sessions',
    achievementId: 'expl_pathfinder',
  },
  {
    id: 'avatar_sprinter',
    name: 'Apex Sprinter',
    category: 'SPEED',
    image: COSMETIC_IMAGES.avatars.sprinter,
    color: '#FF6B00',
    bg: '#210C02',
    isLocked: false,
    unlockRequirement: 'Record Sub-4:30/km Pace or 1K Sprint',
    achievementId: 'prog_first_pb',
  },
  {
    id: 'avatar_summit',
    name: 'Summit Conqueror',
    category: 'ELEVATION',
    image: COSMETIC_IMAGES.avatars.summit,
    color: '#10B981',
    bg: '#041B12',
    isLocked: false,
    unlockRequirement: 'Accumulate 250m+ Elevation Gain',
    achievementId: 'expl_explorer',
  },
  {
    id: 'avatar_ghost',
    name: 'Ghost Hunter',
    category: 'STEALTH',
    image: COSMETIC_IMAGES.avatars.ghost,
    color: '#A855F7',
    bg: '#160824',
    isLocked: false,
    unlockRequirement: 'Defeat 1 Rival Ghost in Compete Mode',
    achievementId: 'gst_first_chase',
  },
  {
    id: 'avatar_competitor',
    name: 'Tournament Ace',
    category: 'COMPETITIVE',
    image: COSMETIC_IMAGES.avatars.competitor,
    color: '#F43F5E',
    bg: '#20080E',
    isLocked: false,
    unlockRequirement: 'Complete 10 Ranked Division Activities',
    achievementId: 'act_getting_started',
  },
  {
    id: 'avatar_rounder',
    name: 'Tri-Athlete Master',
    category: 'MASTERY',
    image: COSMETIC_IMAGES.avatars.rounder,
    color: '#F59E0B',
    bg: '#1C1204',
    isLocked: false,
    unlockRequirement: 'Complete Run, Ride & Walk Sessions',
  },
];

export interface RasterBannerTheme {
  id: string;
  name: string;
  tagline: string;
  image?: any;
  bgDark: string;
  bgLight: string;
  borderColor: string;
  accentColor: string;
  badgeBg: string;
  isLocked?: boolean;
  unlockRequirement?: string;
  tacticalCode: string;
}

export const OFFICIAL_BANNERS: RasterBannerTheme[] = [
  {
    id: 'BANNER_EXPLORER',
    name: 'Topo Explorer',
    tagline: 'Bioluminescent topographic contours on dark carbon terrain',
    image: COSMETIC_IMAGES.banners.explorer,
    bgDark: '#0A0F0D',
    bgLight: '#F0FDF4',
    borderColor: '#CCFF00',
    accentColor: '#CCFF00',
    badgeBg: 'rgba(204, 255, 0, 0.12)',
    isLocked: false,
    unlockRequirement: 'Standard Issue Tactical Banner',
    tacticalCode: 'GRID-01 // TOPO',
  },
  {
    id: 'BANNER_VELOCITY',
    name: 'Velocity Apex',
    tagline: 'Rain-slicked night circuit with neon volt apex curve',
    image: COSMETIC_IMAGES.banners.velocity,
    bgDark: '#060E18',
    bgLight: '#F0F9FF',
    borderColor: '#00E5FF',
    accentColor: '#00E5FF',
    badgeBg: 'rgba(0, 229, 255, 0.12)',
    isLocked: false,
    unlockRequirement: 'Defeat 1 Ghost or Run Sub-4:30/km Pace',
    tacticalCode: 'SECTOR-09 // APEX',
  },
  {
    id: 'BANNER_ZENITH',
    name: 'Zenith Summit',
    tagline: 'Monochrome alpine summit ridges under stellar galaxy',
    image: COSMETIC_IMAGES.banners.zenith,
    bgDark: '#0D0E12',
    bgLight: '#FEFCE8',
    borderColor: '#F59E0B',
    accentColor: '#F59E0B',
    badgeBg: 'rgba(245, 158, 11, 0.12)',
    isLocked: true,
    unlockRequirement: 'Reach Zenith Division or Top 100 Global Rank',
    tacticalCode: 'ZENITH-PRO // SUMMIT',
  },
  {
    id: 'THEME_OBSIDIAN',
    name: 'Stealth Obsidian',
    tagline: 'Pure OLED carbon minimalism with hairline edges',
    bgDark: '#0D0D12',
    bgLight: '#FFFFFF',
    borderColor: '#262D3D',
    accentColor: '#CCFF00',
    badgeBg: 'rgba(255, 255, 255, 0.06)',
    isLocked: false,
    unlockRequirement: 'Standard Stealth Chassis',
    tacticalCode: 'OLED-00 // STEALTH',
  },
];

export interface RasterFrameItem {
  id: string;
  name: string;
  rarity: 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY' | 'ZENITH';
  image: any;
  borderColor: string;
  glowColor: string;
  unlocked: boolean;
  achievementId?: string;
  unlockRequirement: string;
}

export const OFFICIAL_FRAMES: RasterFrameItem[] = [
  {
    id: 'frame_basic',
    name: 'Carbon Edge',
    rarity: 'COMMON',
    image: COSMETIC_IMAGES.frames.basic,
    borderColor: '#475569',
    glowColor: 'rgba(71, 85, 105, 0.25)',
    unlocked: true,
    unlockRequirement: 'Standard issue athletic frame',
  },
  {
    id: 'frame_pulse',
    name: 'Volt Pulse',
    rarity: 'RARE',
    image: COSMETIC_IMAGES.frames.pulse,
    borderColor: '#CCFF00',
    glowColor: 'rgba(204, 255, 0, 0.40)',
    unlocked: true,
    achievementId: 'cons_seasoned',
    unlockRequirement: 'Reach Level 5 or 25 km Total Distance',
  },
  {
    id: 'frame_circuit',
    name: 'Cyber Circuit',
    rarity: 'EPIC',
    image: COSMETIC_IMAGES.frames.circuit,
    borderColor: '#00E5FF',
    glowColor: 'rgba(0, 229, 255, 0.45)',
    unlocked: true,
    achievementId: 'cons_one_week',
    unlockRequirement: 'Complete a 7-Day Workout Streak',
  },
  {
    id: 'frame_phantom',
    name: 'Phantom Veil',
    rarity: 'EPIC',
    image: COSMETIC_IMAGES.frames.phantom,
    borderColor: '#A855F7',
    glowColor: 'rgba(168, 85, 247, 0.50)',
    unlocked: true,
    achievementId: 'gst_ghost_hunter',
    unlockRequirement: 'Defeat 3 Rival Ghosts in Ghost Chase',
  },
  {
    id: 'frame_champion',
    name: 'Apex Champion',
    rarity: 'LEGENDARY',
    image: COSMETIC_IMAGES.frames.champion,
    borderColor: '#F59E0B',
    glowColor: 'rgba(245, 158, 11, 0.60)',
    unlocked: true,
    achievementId: 'comp_gold_standard',
    unlockRequirement: 'Reach Gold Division or Top 50 Rank',
  },
  {
    id: 'frame_zenith',
    name: 'Zenith Nova',
    rarity: 'ZENITH',
    image: COSMETIC_IMAGES.frames.zenith,
    borderColor: '#CCFF00',
    glowColor: 'rgba(204, 255, 0, 0.85)',
    unlocked: true,
    achievementId: 'comp_zenith',
    unlockRequirement: 'Attain Zenith Division 100 Status',
  },
];
