import AsyncStorage from '@react-native-async-storage/async-storage';
import { ALL_ACHIEVEMENTS } from './AchievementDefinitions';
import { ALL_FRAMES } from './FrameDefinitions';
import {
  AchievementDefinition,
  UserAchievementState,
  ProfileFrame,
} from './AchievementTypes';
import { ActivitySummary } from '../../types';

const STORAGE_KEY_ACHIEVEMENTS = '@performa_achievements_v1';
const STORAGE_KEY_SHOWCASED = '@performa_showcased_achievements';
const STORAGE_KEY_ACTIVE_FRAME = '@performa_active_frame';
const STORAGE_KEY_AVATAR = '@performa_user_avatar';

type UnlockListener = (achievement: AchievementDefinition) => void;

export class AchievementService {
  private static instance: AchievementService;
  private userAchievements: Map<string, UserAchievementState> = new Map();
  private showcasedIds: string[] = ['act_first_step', 'prog_first_pb', 'gst_first_chase'];
  private activeFrameId: string = 'frame_default';
  private customAvatarUri: string | null = null;
  private unlockListeners: Set<UnlockListener> = new Set();
  private isLoaded = false;

  private constructor() {}

  public static getInstance(): AchievementService {
    if (!AchievementService.instance) {
      AchievementService.instance = new AchievementService();
    }
    return AchievementService.instance;
  }

  public async initialize(): Promise<void> {
    if (this.isLoaded) return;
    try {
      const [savedAch, savedShowcased, savedFrame, savedAvatar] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEY_ACHIEVEMENTS),
        AsyncStorage.getItem(STORAGE_KEY_SHOWCASED),
        AsyncStorage.getItem(STORAGE_KEY_ACTIVE_FRAME),
        AsyncStorage.getItem(STORAGE_KEY_AVATAR),
      ]);

      if (savedAch) {
        const parsed: Record<string, UserAchievementState> = JSON.parse(savedAch);
        Object.entries(parsed).forEach(([id, state]) => {
          this.userAchievements.set(id, state);
        });
      } else {
        // Initialize default progress for all achievements
        ALL_ACHIEVEMENTS.forEach((ach) => {
          this.userAchievements.set(ach.id, {
            achievementId: ach.id,
            progress: 0,
            unlocked: false,
          });
        });
        // Seed first step if user already completed workouts
        this.userAchievements.set('act_first_step', {
          achievementId: 'act_first_step',
          progress: 1,
          unlocked: true,
          unlockedAt: new Date().toISOString(),
        });
        await this.persist();
      }

      if (savedShowcased) {
        this.showcasedIds = JSON.parse(savedShowcased);
      }
      if (savedFrame) {
        this.activeFrameId = savedFrame;
      }
      if (savedAvatar) {
        this.customAvatarUri = savedAvatar;
      }

      this.isLoaded = true;
    } catch (e) {
      console.warn('[AchievementService] Error initializing:', e);
    }
  }

  private async persist(): Promise<void> {
    try {
      const obj: Record<string, UserAchievementState> = {};
      this.userAchievements.forEach((val, key) => {
        obj[key] = val;
      });
      await AsyncStorage.setItem(STORAGE_KEY_ACHIEVEMENTS, JSON.stringify(obj));
    } catch (e) {
      console.warn('[AchievementService] Persist error:', e);
    }
  }

  public subscribeUnlock(listener: UnlockListener): () => void {
    this.unlockListeners.add(listener);
    return () => this.unlockListeners.delete(listener);
  }

  public getAchievements(): {
    definition: AchievementDefinition;
    state: UserAchievementState;
  }[] {
    return ALL_ACHIEVEMENTS.map((def) => {
      const state = this.userAchievements.get(def.id) || {
        achievementId: def.id,
        progress: 0,
        unlocked: false,
      };
      return { definition: def, state };
    });
  }

  public getUnlockedAchievements(): AchievementDefinition[] {
    return ALL_ACHIEVEMENTS.filter((def) => {
      const state = this.userAchievements.get(def.id);
      return state?.unlocked;
    });
  }

  public getTotalPoints(): number {
    let points = 0;
    ALL_ACHIEVEMENTS.forEach((def) => {
      const state = this.userAchievements.get(def.id);
      if (state?.unlocked) {
        points += def.achievementPoints;
      }
    });
    return points;
  }

  public getUnlockedCount(): number {
    let count = 0;
    this.userAchievements.forEach((st) => {
      if (st.unlocked) count++;
    });
    return count;
  }

  public getTotalCount(): number {
    return ALL_ACHIEVEMENTS.length;
  }

  // Showcased flex banner achievements (up to 3)
  public getShowcasedAchievements(): AchievementDefinition[] {
    return this.showcasedIds
      .map((id) => ALL_ACHIEVEMENTS.find((a) => a.id === id))
      .filter((a): a is AchievementDefinition => !!a);
  }

  public async setShowcasedAchievements(ids: string[]): Promise<boolean> {
    const valid = ids.slice(0, 3).filter((id) => {
      const st = this.userAchievements.get(id);
      return st?.unlocked;
    });
    this.showcasedIds = valid;
    await AsyncStorage.setItem(STORAGE_KEY_SHOWCASED, JSON.stringify(valid));
    return true;
  }

  // Profile Frames
  public getAllFrames(): ProfileFrame[] {
    return ALL_FRAMES.map((f) => {
      if (f.id === 'frame_basic' || f.id === 'frame_default') {
        return { ...f, unlocked: true };
      }
      if (f.achievementId) {
        const st = this.userAchievements.get(f.achievementId);
        return { ...f, unlocked: !!st?.unlocked };
      }
      return f;
    });
  }

  public getActiveFrame(): ProfileFrame {
    const frames = this.getAllFrames();
    const targetId = this.activeFrameId === 'frame_default' ? 'frame_basic' : this.activeFrameId;
    return frames.find((f) => f.id === targetId && f.unlocked) || frames[0];
  }

  public async setActiveFrame(frameId: string): Promise<boolean> {
    const frame = this.getAllFrames().find((f) => f.id === frameId && f.unlocked);
    if (!frame) return false;
    this.activeFrameId = frameId;
    await AsyncStorage.setItem(STORAGE_KEY_ACTIVE_FRAME, frameId);
    return true;
  }

  // Avatar Photo
  public getAvatarUri(): string | null {
    return this.customAvatarUri;
  }

  public async setAvatarUri(uri: string | null): Promise<void> {
    this.customAvatarUri = uri;
    if (uri) {
      await AsyncStorage.setItem(STORAGE_KEY_AVATAR, uri);
    } else {
      await AsyncStorage.removeItem(STORAGE_KEY_AVATAR);
    }
  }

  // Milestone Evaluator
  public async evaluateActivityCompletion(params: {
    activity: ActivitySummary;
    totalActivitiesCount: number;
    totalDistanceMeters: number;
    isPersonalBest?: boolean;
    pbCount?: number;
    isGhostBeat?: boolean;
    isOwnShadowBeat?: boolean;
    isFriendGhostBeat?: boolean;
    isRouteRun?: boolean;
    uniqueRoutesCount?: number;
    allActivityTypesCompleted?: string[];
  }): Promise<AchievementDefinition[]> {
    await this.initialize();
    const newlyUnlocked: AchievementDefinition[] = [];

    const updateProgress = (id: string, progress: number, target: number) => {
      const def = ALL_ACHIEVEMENTS.find((a) => a.id === id);
      if (!def) return;
      const current = this.userAchievements.get(id) || {
        achievementId: id,
        progress: 0,
        unlocked: false,
      };

      if (!current.unlocked) {
        current.progress = Math.min(progress, target);
        if (current.progress >= target) {
          current.unlocked = true;
          current.unlockedAt = new Date().toISOString();
          newlyUnlocked.push(def);
          this.unlockListeners.forEach((fn) => fn(def));
        }
        this.userAchievements.set(id, current);
      }
    };

    // 1. Activity count milestones
    updateProgress('act_first_step', params.totalActivitiesCount, 1);
    updateProgress('act_getting_started', params.totalActivitiesCount, 10);
    updateProgress('act_century', params.totalActivitiesCount, 100);

    // 2. Distance milestones
    const totalKm = params.totalDistanceMeters / 1000;
    if (params.activity.type === 'RUN') {
      updateProgress('dist_road_runner', totalKm, 100);
      updateProgress('dist_road_warrior', totalKm, 500);
    } else if (params.activity.type === 'CYCLE') {
      updateProgress('dist_long_haul', totalKm, 1000);
    }

    // 3. PB Milestones
    if (params.isPersonalBest) {
      updateProgress('prog_first_pb', 1, 1);
    }
    if (params.pbCount) {
      updateProgress('prog_breakthrough', params.pbCount, 5);
      updateProgress('prog_legend', params.pbCount, 20);
    }

    // 4. Ghost Milestones
    if (params.activity.ghostId) {
      updateProgress('gst_first_chase', 1, 1);
    }
    if (params.isGhostBeat) {
      const curr = this.userAchievements.get('gst_ghost_hunter')?.progress || 0;
      updateProgress('gst_ghost_hunter', curr + 1, 5);
    }
    if (params.isOwnShadowBeat) {
      updateProgress('gst_own_shadow', 1, 1);
    }
    if (params.isFriendGhostBeat) {
      updateProgress('gst_friendly_rivalry', 1, 1);
    }

    // 5. Exploration Milestones
    if (params.isRouteRun) {
      updateProgress('expl_pathfinder', 1, 1);
    }
    if (params.uniqueRoutesCount) {
      updateProgress('expl_explorer', params.uniqueRoutesCount, 5);
      updateProgress('expl_trailblazer', params.uniqueRoutesCount, 25);
    }

    // 6. Variety Milestones
    if (params.allActivityTypesCompleted) {
      const distinct = new Set(params.allActivityTypesCompleted).size;
      updateProgress('var_switch_it_up', distinct, 3);
      updateProgress('var_all_rounder', distinct, 4);
    }

    if (newlyUnlocked.length > 0) {
      await this.persist();
    }

    return newlyUnlocked;
  }

  // Social & Clan Milestones
  public async evaluateSocialMilestones(type: 'FRIEND_ADDED' | 'CHALLENGE_COMPLETED' | 'CLAN_PARTICIPATED'): Promise<AchievementDefinition[]> {
    await this.initialize();
    const newlyUnlocked: AchievementDefinition[] = [];

    const unlock = (id: string) => {
      const def = ALL_ACHIEVEMENTS.find((a) => a.id === id);
      if (!def) return;
      const current = this.userAchievements.get(id) || {
        achievementId: id,
        progress: 0,
        unlocked: false,
      };
      if (!current.unlocked) {
        current.progress = def.target;
        current.unlocked = true;
        current.unlockedAt = new Date().toISOString();
        this.userAchievements.set(id, current);
        newlyUnlocked.push(def);
        this.unlockListeners.forEach((fn) => fn(def));
      }
    };

    if (type === 'FRIEND_ADDED') {
      unlock('soc_first_connection');
    } else if (type === 'CHALLENGE_COMPLETED') {
      unlock('soc_friendly_comp');
    } else if (type === 'CLAN_PARTICIPATED') {
      unlock('soc_team_player');
    }

    if (newlyUnlocked.length > 0) {
      await this.persist();
    }
    return newlyUnlocked;
  }

  // Competitive Division Milestones
  public async evaluateDivisionMilestone(division: string): Promise<AchievementDefinition[]> {
    await this.initialize();
    const newlyUnlocked: AchievementDefinition[] = [];
    const div = division.toUpperCase();

    const unlock = (id: string) => {
      const def = ALL_ACHIEVEMENTS.find((a) => a.id === id);
      if (!def) return;
      const current = this.userAchievements.get(id) || {
        achievementId: id,
        progress: 0,
        unlocked: false,
      };
      if (!current.unlocked) {
        current.progress = def.target;
        current.unlocked = true;
        current.unlockedAt = new Date().toISOString();
        this.userAchievements.set(id, current);
        newlyUnlocked.push(def);
        this.unlockListeners.forEach((fn) => fn(def));
      }
    };

    if (div.includes('SILVER') || div.includes('GOLD') || div.includes('PLATINUM') || div.includes('DIAMOND') || div.includes('ZENITH')) {
      unlock('comp_silver');
    }
    if (div.includes('GOLD') || div.includes('PLATINUM') || div.includes('DIAMOND') || div.includes('ZENITH')) {
      unlock('comp_gold_standard');
    }
    if (div.includes('PLATINUM') || div.includes('DIAMOND') || div.includes('ZENITH')) {
      unlock('comp_platinum');
    }
    if (div.includes('DIAMOND') || div.includes('ZENITH')) {
      unlock('comp_diamond');
    }
    if (div.includes('ZENITH')) {
      unlock('comp_zenith');
    }

    if (newlyUnlocked.length > 0) {
      await this.persist();
    }
    return newlyUnlocked;
  }
}
