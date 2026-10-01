import AsyncStorage from '@react-native-async-storage/async-storage';
import { FriendItem, FriendRequest, RoutePrivacyMode, ActivitySummary, GhostData, UserProfile } from '../../types';

const FRIENDS_STORAGE_KEY = '@performa_friends_roster';
const FRIEND_REQUESTS_KEY = '@performa_friend_requests_pending';
const ROUTE_PRIVACY_KEY = '@performa_route_privacy_mode';

export interface AthleteProfileDetails {
  id: string;
  displayName: string;
  username: string;
  avatarUrl?: string;
  avatarFrameId?: string;
  avatarId?: string;
  bannerThemeId?: string;
  equippedTitle?: string;
  division: string;
  tier: number;
  currentPr: number;
  level: number;
  streakWeeks: number;
  bio: string;
  clanTag?: string;
  routePrivacyMode: RoutePrivacyMode;
  recentActivities: ActivitySummary[];
}

export const SEEDED_ATHLETES: AthleteProfileDetails[] = [
  {
    id: 'ath_marcus_vance',
    displayName: 'Marcus Vance',
    username: 'mvance',
    division: 'GOLD',
    tier: 2,
    currentPr: 2620,
    level: 6,
    streakWeeks: 4,
    avatarFrameId: 'frame_gold_aurora',
    avatarId: 'preset_runner_man',
    bannerThemeId: 'THEME_GOLD',
    equippedTitle: 'Gold Apex Pacer',
    bio: 'Marathoner in training. Building steady consistency on morning loops.',
    clanTag: 'STRD',
    routePrivacyMode: 'FULL',
    recentActivities: [
      {
        id: 'act_marcus_1',
        userId: 'ath_marcus_vance',
        type: 'RUN',
        startTime: Date.now() - 3600 * 24 * 1000,
        endTime: Date.now() - 3600 * 24 * 1000 + 1920000,
        elapsedSeconds: 1920,
        movingSeconds: 1920,
        distanceMeters: 8000,
        avgPaceSecondsPerKm: 240, // 4:00/km
        bestPaceSecondsPerKm: 225,
        avgSpeedMps: 4.16,
        maxSpeedMps: 4.5,
        elevationGainMeters: 45,
        elevationLossMeters: 42,
        xpEarned: 320,
        prEarned: 50,
        verificationStatus: 'VERIFIED',
        qualityScore: 99,
        isNewPb: false,
        routeCoordinates: [
          { latitude: 37.7749, longitude: -122.4194 },
          { latitude: 37.7780, longitude: -122.4160 },
          { latitude: 37.7815, longitude: -122.4125 },
          { latitude: 37.7850, longitude: -122.4090 },
          { latitude: 37.7885, longitude: -122.4055 },
        ],
        splits: [
          { splitNumber: 1, distanceMeters: 1000, elapsedSeconds: 242, paceSecondsPerKm: 242, elevationGainMeters: 5 },
          { splitNumber: 2, distanceMeters: 1000, elapsedSeconds: 238, paceSecondsPerKm: 238, elevationGainMeters: 8 },
          { splitNumber: 3, distanceMeters: 1000, elapsedSeconds: 240, paceSecondsPerKm: 240, elevationGainMeters: 6 },
        ],
      },
      {
        id: 'act_marcus_2',
        userId: 'ath_marcus_vance',
        type: 'RUN',
        startTime: Date.now() - 3600 * 24 * 3 * 1000,
        endTime: Date.now() - 3600 * 24 * 3 * 1000 + 1062000,
        elapsedSeconds: 1062,
        movingSeconds: 1062,
        distanceMeters: 5000,
        avgPaceSecondsPerKm: 212, // 3:32/km
        bestPaceSecondsPerKm: 200,
        avgSpeedMps: 4.71,
        maxSpeedMps: 5.1,
        elevationGainMeters: 28,
        elevationLossMeters: 26,
        xpEarned: 240,
        prEarned: 60,
        verificationStatus: 'VERIFIED',
        qualityScore: 98,
        isNewPb: true,
        routeCoordinates: [
          { latitude: 37.8024, longitude: -122.4058 },
          { latitude: 37.8050, longitude: -122.4080 },
          { latitude: 37.8080, longitude: -122.4110 },
          { latitude: 37.8105, longitude: -122.4140 },
        ],
        splits: [
          { splitNumber: 1, distanceMeters: 1000, elapsedSeconds: 215, paceSecondsPerKm: 215, elevationGainMeters: 4 },
          { splitNumber: 2, distanceMeters: 1000, elapsedSeconds: 210, paceSecondsPerKm: 210, elevationGainMeters: 7 },
        ],
      },
    ],
  },
  {
    id: 'ath_elena_rostova',
    displayName: 'Elena Rostova',
    username: 'erostova',
    division: 'GOLD',
    tier: 4,
    currentPr: 2420,
    level: 5,
    streakWeeks: 3,
    avatarFrameId: 'frame_silver_precision',
    avatarId: 'preset_runner_woman',
    bannerThemeId: 'THEME_VOLT',
    equippedTitle: 'Cadence Architect',
    bio: 'Weekend trail runner & cadence enthusiast.',
    clanTag: 'STRD',
    routePrivacyMode: 'SILHOUETTE_ONLY',
    recentActivities: [
      {
        id: 'act_elena_1',
        userId: 'ath_elena_rostova',
        type: 'RUN',
        startTime: Date.now() - 3600 * 24 * 2 * 1000,
        endTime: Date.now() - 3600 * 24 * 2 * 1000 + 2610000,
        elapsedSeconds: 2610,
        movingSeconds: 2610,
        distanceMeters: 10000,
        avgPaceSecondsPerKm: 261, // 4:21/km
        bestPaceSecondsPerKm: 245,
        avgSpeedMps: 3.83,
        maxSpeedMps: 4.2,
        elevationGainMeters: 85,
        elevationLossMeters: 80,
        xpEarned: 410,
        prEarned: 45,
        verificationStatus: 'VERIFIED',
        qualityScore: 97,
        isNewPb: false,
        routeCoordinates: [
          { latitude: 37.7690, longitude: -122.4460 },
          { latitude: 37.7710, longitude: -122.4510 },
          { latitude: 37.7730, longitude: -122.4560 },
          { latitude: 37.7750, longitude: -122.4610 },
        ],
        splits: [
          { splitNumber: 1, distanceMeters: 1000, elapsedSeconds: 265, paceSecondsPerKm: 265, elevationGainMeters: 10 },
          { splitNumber: 2, distanceMeters: 1000, elapsedSeconds: 258, paceSecondsPerKm: 258, elevationGainMeters: 14 },
        ],
      },
    ],
  },
  {
    id: 'ath_david_kim',
    displayName: 'David Kim',
    username: 'dkim_apex',
    division: 'SILVER',
    tier: 1,
    currentPr: 1850,
    level: 4,
    streakWeeks: 3,
    avatarFrameId: 'frame_silver_precision',
    avatarId: 'preset_cyclist_man',
    bannerThemeId: 'THEME_OBSIDIAN',
    equippedTitle: 'Tempo Specialist',
    bio: 'Tempo running & evening 5Ks.',
    clanTag: 'APEX',
    routePrivacyMode: 'FULL',
    recentActivities: [
      {
        id: 'act_david_1',
        userId: 'ath_david_kim',
        type: 'RUN',
        startTime: Date.now() - 3600 * 24 * 1 * 1000,
        endTime: Date.now() - 3600 * 24 * 1 * 1000 + 1350000,
        elapsedSeconds: 1350,
        movingSeconds: 1350,
        distanceMeters: 6000,
        avgPaceSecondsPerKm: 225, // 3:45/km
        bestPaceSecondsPerKm: 215,
        avgSpeedMps: 4.44,
        maxSpeedMps: 4.8,
        elevationGainMeters: 34,
        elevationLossMeters: 30,
        xpEarned: 270,
        prEarned: 35,
        verificationStatus: 'VERIFIED',
        qualityScore: 98,
        isNewPb: false,
        routeCoordinates: [
          { latitude: 37.7850, longitude: -122.4050 },
          { latitude: 37.7878, longitude: -122.4035 },
          { latitude: 37.7892, longitude: -122.4018 },
        ],
        splits: [
          { splitNumber: 1, distanceMeters: 1000, elapsedSeconds: 228, paceSecondsPerKm: 228, elevationGainMeters: 6 },
          { splitNumber: 2, distanceMeters: 1000, elapsedSeconds: 222, paceSecondsPerKm: 222, elevationGainMeters: 5 },
        ],
      },
    ],
  },
  {
    id: 'ath_chloe_zhao',
    displayName: 'Chloe Zhao',
    username: 'chloe_nightrun',
    division: 'SILVER',
    tier: 3,
    currentPr: 1350,
    level: 3,
    streakWeeks: 2,
    avatarFrameId: 'frame_bronze_classic',
    avatarId: 'preset_cyclist_woman',
    bannerThemeId: 'THEME_NEBULA',
    equippedTitle: 'Night Stride',
    bio: 'Casual runner under streetlights. Slow and steady.',
    clanTag: 'DARK',
    routePrivacyMode: 'HIDDEN',
    recentActivities: [
      {
        id: 'act_chloe_1',
        userId: 'ath_chloe_zhao',
        type: 'RUN',
        startTime: Date.now() - 3600 * 12 * 1000,
        endTime: Date.now() - 3600 * 12 * 1000 + 1440000,
        elapsedSeconds: 1440,
        movingSeconds: 1440,
        distanceMeters: 5000,
        avgPaceSecondsPerKm: 288, // 4:48/km
        bestPaceSecondsPerKm: 275,
        avgSpeedMps: 3.47,
        maxSpeedMps: 3.9,
        elevationGainMeters: 15,
        elevationLossMeters: 14,
        xpEarned: 210,
        prEarned: 25,
        verificationStatus: 'VERIFIED',
        qualityScore: 96,
        isNewPb: false,
        routeCoordinates: [],
        splits: [
          { splitNumber: 1, distanceMeters: 1000, elapsedSeconds: 290, paceSecondsPerKm: 290, elevationGainMeters: 3 },
          { splitNumber: 2, distanceMeters: 1000, elapsedSeconds: 286, paceSecondsPerKm: 286, elevationGainMeters: 4 },
        ],
      },
    ],
  },
  {
    id: 'ath_eliud_fan',
    displayName: 'Eliud Kipchoge Fan',
    username: 'kipchogefan',
    division: 'ZENITH',
    tier: 1,
    currentPr: 4820,
    level: 10,
    streakWeeks: 16,
    avatarFrameId: 'frame_zenith_halo',
    avatarId: 'preset_runner_man',
    bannerThemeId: 'THEME_ZENITH',
    equippedTitle: 'Zenith Apex Pacer',
    bio: 'No human is limited. Chasing sub-2 hour pacing and peak consistency.',
    clanTag: 'STRD',
    routePrivacyMode: 'FULL',
    recentActivities: [
      {
        id: 'act_eliud_1',
        userId: 'ath_eliud_fan',
        type: 'RUN',
        startTime: Date.now() - 3600 * 24 * 1000,
        endTime: Date.now() - 3600 * 24 * 1000 + 1740000,
        elapsedSeconds: 1740,
        movingSeconds: 1740,
        distanceMeters: 10000,
        avgPaceSecondsPerKm: 174, // 2:54/km
        bestPaceSecondsPerKm: 168,
        avgSpeedMps: 5.74,
        maxSpeedMps: 6.2,
        elevationGainMeters: 32,
        elevationLossMeters: 30,
        xpEarned: 500,
        prEarned: 80,
        verificationStatus: 'VERIFIED',
        qualityScore: 99,
        isNewPb: true,
        routeCoordinates: [
          { latitude: 37.7749, longitude: -122.4194 },
          { latitude: 37.778, longitude: -122.416 },
          { latitude: 37.7815, longitude: -122.4125 },
          { latitude: 37.785, longitude: -122.409 },
          { latitude: 37.7885, longitude: -122.4055 },
        ],
        splits: [
          { splitNumber: 1, distanceMeters: 1000, elapsedSeconds: 175, paceSecondsPerKm: 175, elevationGainMeters: 4 },
          { splitNumber: 2, distanceMeters: 1000, elapsedSeconds: 173, paceSecondsPerKm: 173, elevationGainMeters: 6 },
        ],
      },
    ],
  },
  {
    id: 'ath_sarah_jenkins',
    displayName: 'Sarah Jenkins',
    username: 'sarahj',
    division: 'PLATINUM',
    tier: 2,
    currentPr: 2850,
    level: 7,
    streakWeeks: 6,
    avatarFrameId: 'frame_diamond_prism',
    avatarId: 'preset_runner_woman',
    bannerThemeId: 'THEME_CYBERPUNK',
    equippedTitle: 'Progression Strategist',
    bio: 'Negative splits and progression runs. Building for autumn marathon.',
    clanTag: 'APEX',
    routePrivacyMode: 'FULL',
    recentActivities: [
      {
        id: 'act_sarah_1',
        userId: 'ath_sarah_jenkins',
        type: 'RUN',
        startTime: Date.now() - 3600 * 24 * 2 * 1000,
        endTime: Date.now() - 3600 * 24 * 2 * 1000 + 1920000,
        elapsedSeconds: 1920,
        movingSeconds: 1920,
        distanceMeters: 8000,
        avgPaceSecondsPerKm: 240,
        bestPaceSecondsPerKm: 228,
        avgSpeedMps: 4.16,
        maxSpeedMps: 4.6,
        elevationGainMeters: 40,
        elevationLossMeters: 38,
        xpEarned: 320,
        prEarned: 45,
        verificationStatus: 'VERIFIED',
        qualityScore: 98,
        isNewPb: false,
        routeCoordinates: [
          { latitude: 37.7749, longitude: -122.4194 },
          { latitude: 37.778, longitude: -122.416 },
        ],
        splits: [
          { splitNumber: 1, distanceMeters: 1000, elapsedSeconds: 245, paceSecondsPerKm: 245, elevationGainMeters: 5 },
          { splitNumber: 2, distanceMeters: 1000, elapsedSeconds: 235, paceSecondsPerKm: 235, elevationGainMeters: 5 },
        ],
      },
    ],
  },
];

export class FriendService {
  private static instance: FriendService;

  private constructor() {}

  public static getInstance(): FriendService {
    if (!FriendService.instance) {
      FriendService.instance = new FriendService();
    }
    return FriendService.instance;
  }

  /**
   * Retrieves user's route privacy mode. Default: 'FULL'.
   */
  public async getRoutePrivacyMode(): Promise<RoutePrivacyMode> {
    try {
      const mode = await AsyncStorage.getItem(ROUTE_PRIVACY_KEY);
      if (mode === 'SILHOUETTE_ONLY' || mode === 'HIDDEN' || mode === 'FULL') {
        return mode;
      }
      return 'FULL';
    } catch {
      return 'FULL';
    }
  }

  /**
   * Sets user's global route privacy mode.
   */
  public async setRoutePrivacyMode(mode: RoutePrivacyMode): Promise<void> {
    await AsyncStorage.setItem(ROUTE_PRIVACY_KEY, mode);
  }

  /**
   * Retrieves route privacy mode for a specific activity.
   * If not overridden, falls back to the user's global privacy mode.
   */
  public async getActivityPrivacyMode(activityId: string): Promise<RoutePrivacyMode> {
    try {
      const override = await AsyncStorage.getItem(`@performa_activity_privacy_${activityId}`);
      if (override === 'SILHOUETTE_ONLY' || override === 'HIDDEN' || override === 'FULL') {
        return override;
      }
      return await this.getRoutePrivacyMode();
    } catch {
      return await this.getRoutePrivacyMode();
    }
  }

  /**
   * Sets route privacy mode for a specific activity.
   */
  public async setActivityPrivacyMode(activityId: string, mode: RoutePrivacyMode): Promise<void> {
    await AsyncStorage.setItem(`@performa_activity_privacy_${activityId}`, mode);
  }

  /**
   * Updates global privacy and optionally resets/applies to all activities.
   */
  public async setGlobalRoutePrivacyMode(
    mode: RoutePrivacyMode,
    applyToAllActivities: boolean,
    activityIds?: string[]
  ): Promise<void> {
    await AsyncStorage.setItem(ROUTE_PRIVACY_KEY, mode);
    if (applyToAllActivities && activityIds) {
      for (const id of activityIds) {
        await AsyncStorage.setItem(`@performa_activity_privacy_${id}`, mode);
      }
    }
  }


  /**
   * Retrieves accepted friends list.
   */
  public async getFriends(): Promise<FriendItem[]> {
    try {
      const stored = await AsyncStorage.getItem(FRIENDS_STORAGE_KEY);
      if (stored) {
        const list: FriendItem[] = JSON.parse(stored);
        return list.map((f) => {
          const seeded = SEEDED_ATHLETES.find((s) => s.id === f.id);
          if (seeded) {
            return {
              ...f,
              level: seeded.level,
              division: seeded.division,
              currentPr: seeded.currentPr,
              streakWeeks: seeded.streakWeeks,
            };
          }
          return f;
        });
      }
      // Default initial friend (Marcus Vance)
      const defaultFriends: FriendItem[] = [
        {
          id: SEEDED_ATHLETES[0].id,
          displayName: SEEDED_ATHLETES[0].displayName,
          username: SEEDED_ATHLETES[0].username,
          level: SEEDED_ATHLETES[0].level,
          division: SEEDED_ATHLETES[0].division,
          currentPr: SEEDED_ATHLETES[0].currentPr,
          streakWeeks: SEEDED_ATHLETES[0].streakWeeks,
          lastActiveText: '1d ago',
          isFriend: true,
          hasGhostAvailable: true,
        },
      ];
      await AsyncStorage.setItem(FRIENDS_STORAGE_KEY, JSON.stringify(defaultFriends));
      return defaultFriends;
    } catch (err) {
      console.warn('[FriendService] Error getting friends:', err);
      return [];
    }
  }

  /**
   * Retrieves pending incoming friend requests.
   */
  public async getPendingRequests(): Promise<FriendRequest[]> {
    try {
      const stored = await AsyncStorage.getItem(FRIEND_REQUESTS_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
      // Seed 1 initial pending request (Elena Rostova)
      const defaultRequests: FriendRequest[] = [
        {
          id: 'req_elena_01',
          senderId: SEEDED_ATHLETES[1].id,
          senderName: SEEDED_ATHLETES[1].displayName,
          senderUsername: SEEDED_ATHLETES[1].username,
          senderDivision: SEEDED_ATHLETES[1].division,
          senderTier: SEEDED_ATHLETES[1].tier,
          receiverId: 'usr_me',
          status: 'PENDING',
          createdAt: Date.now() - 3600 * 4 * 1000,
        },
      ];
      await AsyncStorage.setItem(FRIEND_REQUESTS_KEY, JSON.stringify(defaultRequests));
      return defaultRequests;
    } catch (err) {
      console.warn('[FriendService] Error getting requests:', err);
      return [];
    }
  }

  /**
   * Searches athletes by username or display name.
   */
  public async searchAthletes(query: string, currentUserId?: string): Promise<FriendItem[]> {
    const q = query.trim().toLowerCase();
    const friends = await this.getFriends();
    const friendIds = new Set(friends.map((f) => f.id));

    let matched = SEEDED_ATHLETES.filter(
      (a) =>
        a.id !== currentUserId &&
        (a.username.toLowerCase().includes(q) || a.displayName.toLowerCase().includes(q))
    );

    if (matched.length === 0 && q.length > 0) {
      const dynamicProfile = this.getAthleteProfile(query);
      if (dynamicProfile) {
        matched = [dynamicProfile];
      }
    }

    return matched.map((a) => ({
      id: a.id,
      displayName: a.displayName,
      username: a.username,
      avatarUrl: a.avatarUrl,
      level: a.level,
      division: a.division,
      currentPr: a.currentPr,
      streakWeeks: a.streakWeeks,
      lastActiveText: 'Recently',
      isFriend: friendIds.has(a.id),
      hasGhostAvailable: a.recentActivities.length > 0,
    }));
  }

  /**
   * Sends a friend request to an athlete.
   */
  public async sendFriendRequest(targetAthleteId: string, currentUser: UserProfile): Promise<boolean> {
    const athlete = this.getAthleteProfile(targetAthleteId);
    if (!athlete) return false;

    const friends = await this.getFriends();
    if (!friends.some((f) => f.id === athlete.id)) {
      const newFriend: FriendItem = {
        id: athlete.id,
        displayName: athlete.displayName,
        username: athlete.username,
        level: athlete.level,
        division: athlete.division,
        currentPr: athlete.currentPr,
        streakWeeks: athlete.streakWeeks,
        lastActiveText: 'Active today',
        isFriend: true,
        hasGhostAvailable: athlete.recentActivities.length > 0,
      };
      const updated = [...friends, newFriend];
      await AsyncStorage.setItem(FRIENDS_STORAGE_KEY, JSON.stringify(updated));
    }
    return true;
  }

  /**
   * Accepts a pending friend request.
   */
  public async acceptFriendRequest(requestId: string): Promise<void> {
    const requests = await this.getPendingRequests();
    const targetReq = requests.find((r) => r.id === requestId);
    if (!targetReq) return;

    // Remove from pending
    const remaining = requests.filter((r) => r.id !== requestId);
    await AsyncStorage.setItem(FRIEND_REQUESTS_KEY, JSON.stringify(remaining));

    // Add to friends roster
    const friends = await this.getFriends();
    const athlete = this.getAthleteProfile(targetReq.senderId);

    const newFriend: FriendItem = {
      id: targetReq.senderId,
      displayName: targetReq.senderName,
      username: targetReq.senderUsername,
      level: athlete?.level || 10,
      division: targetReq.senderDivision,
      currentPr: athlete?.currentPr || 800,
      streakWeeks: athlete?.streakWeeks || 4,
      lastActiveText: 'Active now',
      isFriend: true,
      hasGhostAvailable: true,
    };

    if (!friends.some((f) => f.id === newFriend.id)) {
      await AsyncStorage.setItem(FRIENDS_STORAGE_KEY, JSON.stringify([...friends, newFriend]));
    }
  }

  /**
   * Declines a pending friend request.
   */
  public async declineFriendRequest(requestId: string): Promise<void> {
    const requests = await this.getPendingRequests();
    const remaining = requests.filter((r) => r.id !== requestId);
    await AsyncStorage.setItem(FRIEND_REQUESTS_KEY, JSON.stringify(remaining));
  }

  /**
   * Removes a friend.
   */
  public async removeFriend(friendId: string): Promise<void> {
    const friends = await this.getFriends();
    const updated = friends.filter((f) => f.id !== friendId);
    await AsyncStorage.setItem(FRIENDS_STORAGE_KEY, JSON.stringify(updated));
  }

  /**
   * Retrieves an athlete's full public profile details, finding in seeded roster
   * or dynamically generating rich profile details for any leaderboard contender.
   */
  public getAthleteProfile(
    athleteIdOrName: string,
    fallback?: { displayName: string; division: string; tier: number; pr: number }
  ): AthleteProfileDetails | null {
    const directMatch = SEEDED_ATHLETES.find(
      (a) =>
        a.id === athleteIdOrName ||
        a.displayName.toLowerCase() === athleteIdOrName.toLowerCase() ||
        a.username.toLowerCase() === athleteIdOrName.toLowerCase()
    );
    if (directMatch) return directMatch;

    if (!fallback && !athleteIdOrName) return null;

    const name = fallback?.displayName || athleteIdOrName;
    const cleanId = `ath_${name.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
    const division = fallback?.division || 'GOLD';
    const tier = fallback?.tier || 1;
    const pr = fallback?.pr || 2400;
    const level = Math.max(1, Math.min(10, Math.floor(pr / 500)));
    const streak = Math.max(1, Math.floor(pr / 800));

    return {
      id: cleanId,
      displayName: name,
      username: name.toLowerCase().replace(/[^a-z0-9]/g, ''),
      division,
      tier,
      currentPr: pr,
      level,
      streakWeeks: streak,
      avatarFrameId:
        division === 'ZENITH'
          ? 'frame_zenith_halo'
          : division === 'DIAMOND'
          ? 'frame_diamond_prism'
          : 'frame_gold_aurora',
      avatarId: 'preset_runner_man',
      bannerThemeId:
        division === 'ZENITH'
          ? 'THEME_ZENITH'
          : division === 'DIAMOND'
          ? 'THEME_CYBERPUNK'
          : 'THEME_GOLD',
      equippedTitle: `${division} Competitive Athlete`,
      bio: `Verified contender in Season 0. Active in ${division} Division.`,
      clanTag: 'STRD',
      routePrivacyMode: 'FULL',
      recentActivities: [
        {
          id: `act_${cleanId}_1`,
          userId: cleanId,
          type: 'RUN',
          startTime: Date.now() - 3600 * 24 * 1000,
          endTime: Date.now() - 3600 * 24 * 1000 + 1800000,
          elapsedSeconds: 1800,
          movingSeconds: 1800,
          distanceMeters: 7500,
          avgPaceSecondsPerKm: 240,
          bestPaceSecondsPerKm: 220,
          avgSpeedMps: 4.16,
          maxSpeedMps: 4.8,
          elevationGainMeters: 45,
          elevationLossMeters: 40,
          xpEarned: 350,
          prEarned: 45,
          verificationStatus: 'VERIFIED',
          qualityScore: 99,
          isNewPb: false,
          routeCoordinates: [
            { latitude: 37.7749, longitude: -122.4194 },
            { latitude: 37.778, longitude: -122.416 },
            { latitude: 37.7815, longitude: -122.4125 },
            { latitude: 37.785, longitude: -122.409 },
            { latitude: 37.7885, longitude: -122.4055 },
          ],
          splits: [
            { splitNumber: 1, distanceMeters: 1000, elapsedSeconds: 240, paceSecondsPerKm: 240, elevationGainMeters: 8 },
            { splitNumber: 2, distanceMeters: 1000, elapsedSeconds: 238, paceSecondsPerKm: 238, elevationGainMeters: 10 },
            { splitNumber: 3, distanceMeters: 1000, elapsedSeconds: 242, paceSecondsPerKm: 242, elevationGainMeters: 7 },
          ],
        },
      ],
    };
  }

  /**
   * Converts an athlete's activity into a GhostData opponent for race-against-friend mode.
   */
  public createGhostFromActivity(activity: ActivitySummary, athleteName: string): GhostData {
    const totalDist = activity.distanceMeters || 5000;
    const totalSec = activity.movingSeconds || 1500;
    const coords = activity.routeCoordinates || [];
    const baseLat = coords[0]?.latitude || 37.7749;
    const baseLng = coords[0]?.longitude || -122.4194;

    const checkpoints = (activity.splits || []).map((s, idx) => {
      const coord = coords[Math.min(idx, coords.length - 1)] || { latitude: baseLat, longitude: baseLng };
      return {
        distanceMeters: (idx + 1) * 1000,
        elapsedSeconds: activity.splits.slice(0, idx + 1).reduce((acc, curr) => acc + curr.elapsedSeconds, 0),
        latitude: coord.latitude,
        longitude: coord.longitude,
      };
    });

    return {
      id: `ghost_${activity.id}`,
      routeId: `friend_${activity.id}`,
      activityId: activity.id,
      athleteName,
      activityType: activity.type || 'RUN',
      totalDistanceMeters: totalDist,
      totalDurationSeconds: totalSec,
      checkpoints:
        checkpoints.length > 0
          ? checkpoints
          : [
              { distanceMeters: totalDist * 0.25, elapsedSeconds: totalSec * 0.25, latitude: baseLat, longitude: baseLng },
              { distanceMeters: totalDist * 0.5, elapsedSeconds: totalSec * 0.5, latitude: baseLat + 0.002, longitude: baseLng + 0.002 },
              { distanceMeters: totalDist * 0.75, elapsedSeconds: totalSec * 0.75, latitude: baseLat + 0.004, longitude: baseLng + 0.004 },
              { distanceMeters: totalDist, elapsedSeconds: totalSec, latitude: baseLat + 0.006, longitude: baseLng + 0.006 },
            ],
    };
  }
}
