import AsyncStorage from '@react-native-async-storage/async-storage';
import { ClanItem, ClanMember, UserProfile, ClanAchievement, ClanTitle } from '../../types';
import { supabase, isSupabaseConfigured } from '../../services/supabase';

const USER_CLAN_KEY = '@performa_user_active_clan';
const CLANS_DIRECTORY_KEY = '@performa_all_community_clans';

export const DEFAULT_CLAN_ACHIEVEMENTS: ClanAchievement[] = [
  {
    id: 'clan_ach_mileage_10k',
    title: 'Pack Momentum',
    description: 'Log 10,000 km collective endurance mileage across all active members.',
    category: 'MILEAGE',
    progress: 7420,
    target: 10000,
    unlocked: false,
    points: 500,
    iconName: 'Flame',
  },
  {
    id: 'clan_ach_diamond_5',
    title: 'Apex Syndicate',
    description: 'Have at least 5 clan athletes reach Diamond Division or higher in Season 0.',
    category: 'MEMBERS',
    progress: 3,
    target: 5,
    unlocked: false,
    points: 750,
    iconName: 'Crown',
  },
  {
    id: 'clan_ach_dawn_50',
    title: 'Dawn Patrol',
    description: 'Complete 50 collective early morning sessions (before 7:00 AM).',
    category: 'SEASON',
    progress: 50,
    target: 50,
    unlocked: true,
    points: 400,
    iconName: 'Zap',
  },
  {
    id: 'clan_ach_ghost_25',
    title: 'Shadow Breakers',
    description: 'Defeat 25 rival clan ghosts on verified course segments.',
    category: 'GHOST',
    progress: 25,
    target: 25,
    unlocked: true,
    points: 600,
    iconName: 'Shield',
  },
];

export const DEFAULT_CLAN_TITLES: ClanTitle[] = [
  {
    id: 'title_centurion',
    title: 'Centurion Syndicate',
    description: 'Awarded for completing 100 collective verified sessions.',
    isUnlocked: true,
    isEquipped: true,
  },
  {
    id: 'title_vanguard',
    title: 'Vanguard of the Bay',
    description: 'Awarded for holding Rank #1 in the regional circuit.',
    isUnlocked: true,
    isEquipped: false,
  },
  {
    id: 'title_obsidian',
    title: 'Obsidian Pace Corps',
    description: 'Awarded for achieving 5,000 km collective endurance mileage.',
    isUnlocked: true,
    isEquipped: false,
  },
  {
    id: 'title_zenith_crest',
    title: 'Apex Horizon',
    description: 'Awarded for finishing top 3 in Season 0.',
    isUnlocked: false,
    isEquipped: false,
  },
];

export const DEFAULT_COMMUNITY_CLANS: ClanItem[] = [
  {
    id: 'clan_striders_01',
    name: 'SF Harriers & Striders',
    tag: 'STRD',
    description: 'Bay Area endurance collective. Pacemakers and segment record breakers.',
    badgeIcon: 'Flame',
    accentColor: '#CCFF00',
    inviteCode: 'STRD-1024',
    leaderId: 'usr_strd_leader',
    leaderName: 'Kipchoge Fan',
    memberCount: 24,
    seasonPr: 4820,
    globalRank: 1,
    achievements: DEFAULT_CLAN_ACHIEVEMENTS,
    titles: DEFAULT_CLAN_TITLES,
    equippedTitle: 'Centurion Syndicate',
    members: [
      {
        userId: 'usr_strd_leader',
        displayName: 'Marcus Vance',

        username: 'mvance',
        division: 'ZENITH',
        tier: 1,
        role: 'LEADER',
        contributionPr: 1420,
        joinedAt: Date.now() - 3600 * 24 * 40 * 1000,
      },
      {
        userId: 'usr_strd_02',
        displayName: 'Elena Rostova',
        username: 'erostova',
        division: 'ZENITH',
        tier: 1,
        role: 'OFFICER',
        contributionPr: 1180,
        joinedAt: Date.now() - 3600 * 24 * 35 * 1000,
      },
      {
        userId: 'usr_strd_03',
        displayName: 'Samir Patel',
        username: 'spatel_runs',
        division: 'DIAMOND',
        tier: 2,
        role: 'MEMBER',
        contributionPr: 840,
        joinedAt: Date.now() - 3600 * 24 * 20 * 1000,
      },
    ],
    topContributors: [
      { userId: 'usr_strd_leader', name: 'Marcus Vance', contributionPr: 1420 },
      { userId: 'usr_strd_02', name: 'Elena Rostova', contributionPr: 1180 },
      { userId: 'usr_strd_03', name: 'Samir Patel', contributionPr: 840 },
    ],
  },
  {
    id: 'clan_apex_02',
    name: 'Apex Endurance Syndicate',
    tag: 'APEX',
    description: 'Relentless forward momentum. Negative split precision racing.',
    badgeIcon: 'Crown',
    accentColor: '#FF3B4B',
    inviteCode: 'APEX-5520',
    leaderId: 'usr_apex_leader',
    leaderName: 'David Kim',
    memberCount: 18,
    seasonPr: 3940,
    globalRank: 2,
    members: [
      {
        userId: 'usr_apex_leader',
        displayName: 'David Kim',
        username: 'dkim_apex',
        division: 'ZENITH',
        tier: 1,
        role: 'LEADER',
        contributionPr: 1250,
        joinedAt: Date.now() - 3600 * 24 * 38 * 1000,
      },
      {
        userId: 'usr_apex_02',
        displayName: 'Sarah Jenkins',
        username: 'sarahj',
        division: 'DIAMOND',
        tier: 1,
        role: 'MEMBER',
        contributionPr: 980,
        joinedAt: Date.now() - 3600 * 24 * 25 * 1000,
      },
    ],
    topContributors: [
      { userId: 'usr_apex_leader', name: 'David Kim', contributionPr: 1250 },
      { userId: 'usr_apex_02', name: 'Sarah Jenkins', contributionPr: 980 },
    ],
  },
  {
    id: 'clan_midnight_03',
    name: 'Midnight Cadence',
    tag: 'DARK',
    description: 'We own the quiet asphalt. Late night tempo runs and dawn breakthroughs.',
    badgeIcon: 'Zap',
    accentColor: '#A855F7',
    inviteCode: 'DARK-7711',
    leaderId: 'usr_dark_leader',
    leaderName: 'Chloe Zhao',
    memberCount: 14,
    seasonPr: 2610,
    globalRank: 3,
    members: [
      {
        userId: 'usr_dark_leader',
        displayName: 'Chloe Zhao',
        username: 'chloe_nightrun',
        division: 'PLATINUM',
        tier: 1,
        role: 'LEADER',
        contributionPr: 910,
        joinedAt: Date.now() - 3600 * 24 * 30 * 1000,
      },
    ],
    topContributors: [
      { userId: 'usr_dark_leader', name: 'Chloe Zhao', contributionPr: 910 },
    ],
  },
  {
    id: 'clan_aero_04',
    name: 'Aero Velocity Club',
    tag: 'AERO',
    description: 'Fast cadence and sub-4min kilometer hunting. Cyclists & runners welcome.',
    badgeIcon: 'Shield',
    accentColor: '#00F0FF',
    inviteCode: 'AERO-3349',
    leaderId: 'usr_aero_leader',
    leaderName: 'Lucas Mayer',
    memberCount: 9,
    seasonPr: 1980,
    globalRank: 4,
    members: [
      {
        userId: 'usr_aero_leader',
        displayName: 'Lucas Mayer',
        username: 'lmayer_aero',
        division: 'GOLD',
        tier: 2,
        role: 'LEADER',
        contributionPr: 720,
        joinedAt: Date.now() - 3600 * 24 * 18 * 1000,
      },
    ],
    topContributors: [
      { userId: 'usr_aero_leader', name: 'Lucas Mayer', contributionPr: 720 },
    ],
  },
];

export class ClanService {
  private static instance: ClanService;

  private constructor() {}

  public static getInstance(): ClanService {
    if (!ClanService.instance) {
      ClanService.instance = new ClanService();
    }
    return ClanService.instance;
  }

  /**
   * Retrieves the current user's active clan, if any.
   */
  public async getUserClan(): Promise<ClanItem | null> {
    try {
      const stored = await AsyncStorage.getItem(USER_CLAN_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
      return null;
    } catch (err) {
      console.warn('[ClanService] Error getting user clan:', err);
      return null;
    }
  }

  /**
   * Retrieves all community clans (combining default + user-created).
   */
  public async getAllClans(): Promise<ClanItem[]> {
    try {
      const stored = await AsyncStorage.getItem(CLANS_DIRECTORY_KEY);
      if (stored) {
        const customClans: ClanItem[] = JSON.parse(stored);
        // Merge with defaults, ensuring no duplicates
        const map = new Map<string, ClanItem>();
        DEFAULT_COMMUNITY_CLANS.forEach((c) => map.set(c.id, c));
        customClans.forEach((c) => map.set(c.id, c));
        const list = Array.from(map.values());
        // Sort by Season PR descending
        return list.sort((a, b) => b.seasonPr - a.seasonPr).map((c, idx) => ({ ...c, globalRank: idx + 1 }));
      }
      return DEFAULT_COMMUNITY_CLANS;
    } catch (err) {
      console.warn('[ClanService] Error getting all clans:', err);
      return DEFAULT_COMMUNITY_CLANS;
    }
  }

  /**
   * Creates a brand new clan with the current user as founder and LEADER.
   */
  public async createClan(params: {
    name: string;
    tag: string;
    description: string;
    badgeIcon?: string;
    accentColor?: string;
    user: UserProfile;
  }): Promise<ClanItem> {
    const cleanTag = params.tag.trim().toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 5);
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const inviteCode = `${cleanTag}-${randomSuffix}`;
    const clanId = `clan_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const leaderMember: ClanMember = {
      userId: params.user.id,
      displayName: params.user.displayName || params.user.username || 'Founder',
      username: params.user.username || 'athlete',
      avatarUrl: params.user.avatarUrl,
      division: params.user.currentDivision || 'BRONZE',
      tier: params.user.currentTier || 5,
      role: 'LEADER',
      contributionPr: params.user.currentPr || 0,
      joinedAt: Date.now(),
    };

    const newClan: ClanItem = {
      id: clanId,
      name: params.name.trim(),
      tag: cleanTag,
      description: params.description.trim() || 'A competitive endurance collective on Performa.',
      badgeIcon: params.badgeIcon || 'Shield',
      accentColor: params.accentColor || '#CCFF00',
      inviteCode,
      leaderId: params.user.id,
      leaderName: params.user.displayName || params.user.username,
      memberCount: 1,
      seasonPr: params.user.currentPr || 0,
      globalRank: 5,
      members: [leaderMember],
      topContributors: [
        {
          userId: params.user.id,
          name: leaderMember.displayName,
          avatarUrl: leaderMember.avatarUrl,
          contributionPr: leaderMember.contributionPr,
        },
      ],
    };

    // Save as user's active clan
    await AsyncStorage.setItem(USER_CLAN_KEY, JSON.stringify(newClan));

    // Save to all clans list
    const currentClans = await this.getAllClans();
    const updatedClans = [...currentClans.filter((c) => c.id !== newClan.id), newClan];
    await AsyncStorage.setItem(CLANS_DIRECTORY_KEY, JSON.stringify(updatedClans));

    // Sync to Supabase if configured
    if (isSupabaseConfigured()) {
      try {
        await supabase.from('clans').insert({
          id: newClan.id,
          name: newClan.name,
          tag: newClan.tag,
          description: newClan.description,
          badge_icon: newClan.badgeIcon,
          invite_code: newClan.inviteCode,
          leader_id: newClan.leaderId,
          member_count: 1,
          season_pr: newClan.seasonPr,
        });
      } catch (err) {
        console.warn('[ClanService] Supabase clan sync note (offline safe):', err);
      }
    }

    return newClan;
  }

  /**
   * Joins a clan using its invite code (e.g. "APEX-5520") or Tag ("APEX").
   */
  public async joinClan(
    inviteCodeOrTag: string,
    user: UserProfile
  ): Promise<{ success: boolean; clan?: ClanItem; message?: string }> {
    const query = inviteCodeOrTag.trim().toUpperCase();
    const allClans = await this.getAllClans();

    const targetClan = allClans.find(
      (c) => c.inviteCode.toUpperCase() === query || c.tag.toUpperCase() === query
    );

    if (!targetClan) {
      return { success: false, message: `No clan found with code or tag "${inviteCodeOrTag}".` };
    }

    // Check if user is already in this clan
    const currentMembers = targetClan.members || [];
    const alreadyMember = currentMembers.some((m) => m.userId === user.id);
    if (alreadyMember) {
      await AsyncStorage.setItem(USER_CLAN_KEY, JSON.stringify(targetClan));
      return { success: true, clan: targetClan };
    }

    const newMember: ClanMember = {
      userId: user.id,
      displayName: user.displayName || user.username || 'Athlete',
      username: user.username || 'athlete',
      avatarUrl: user.avatarUrl,
      division: user.currentDivision || 'BRONZE',
      tier: user.currentTier || 5,
      role: 'MEMBER',
      contributionPr: user.currentPr || 0,
      joinedAt: Date.now(),
    };

    const updatedMembers = [...currentMembers, newMember];
    const userPr = user.currentPr || 0;
    const updatedPr = targetClan.seasonPr + userPr;
    const updatedMemberCount = targetClan.memberCount + 1;

    const updatedClan: ClanItem = {
      ...targetClan,
      memberCount: updatedMemberCount,
      seasonPr: updatedPr,
      members: updatedMembers,
      topContributors: [
        ...targetClan.topContributors,
        { userId: user.id, name: newMember.displayName, contributionPr: userPr },
      ].sort((a, b) => b.contributionPr - a.contributionPr),
    };

    // Save active clan for user
    await AsyncStorage.setItem(USER_CLAN_KEY, JSON.stringify(updatedClan));

    // Update global list
    const updatedAll = allClans.map((c) => (c.id === updatedClan.id ? updatedClan : c));
    await AsyncStorage.setItem(CLANS_DIRECTORY_KEY, JSON.stringify(updatedAll));

    return { success: true, clan: updatedClan };
  }

  /**
   * Leaves the current active clan.
   */
  public async leaveClan(userId: string): Promise<void> {
    const activeClan = await this.getUserClan();
    if (!activeClan) return;

    // Filter out user from members
    const updatedMembers = (activeClan.members || []).filter((m) => m.userId !== userId);
    const updatedClan: ClanItem = {
      ...activeClan,
      members: updatedMembers,
      memberCount: Math.max(0, activeClan.memberCount - 1),
    };

    const allClans = await this.getAllClans();
    const updatedAll = allClans.map((c) => (c.id === updatedClan.id ? updatedClan : c));
    await AsyncStorage.setItem(CLANS_DIRECTORY_KEY, JSON.stringify(updatedAll));
    await AsyncStorage.removeItem(USER_CLAN_KEY);
  }

  /**
   * Generates a sharable message for inviting friends to the user's clan.
   */
  public getClanInviteShareMessage(clan: ClanItem): string {
    return `⚡ Join my Athletic Clan [${clan.tag}] "${clan.name}" on Performa!\nUse Invite Code: ${clan.inviteCode}\n\nTeam up to pool Season PR and conquer the Season 0: Genesis Horizon leaderboard // performa.app`;
  }

  /**
   * Equips a clan title for the user's active clan.
   */
  public async equipClanTitle(clanId: string, titleId: string): Promise<ClanItem | null> {
    const userClan = await this.getUserClan();
    if (userClan && userClan.id === clanId) {
      const titles = (userClan.titles || DEFAULT_CLAN_TITLES).map((t) => ({
        ...t,
        isEquipped: t.id === titleId,
      }));
      const equipped = titles.find((t) => t.id === titleId);
      const updated: ClanItem = {
        ...userClan,
        titles,
        equippedTitle: equipped?.title,
      };
      await AsyncStorage.setItem(USER_CLAN_KEY, JSON.stringify(updated));
      return updated;
    }
    return null;
  }

  /**
   * Updates an athlete member's profile across their active clan roster and community directory.
   */
  public async updateMemberProfile(
    userId: string,
    updates: { username?: string; displayName?: string; avatarUrl?: string }
  ): Promise<ClanItem | null> {
    const activeClan = await this.getUserClan();
    if (!activeClan) return null;

    let changed = false;
    const updatedMembers = (activeClan.members || []).map((m) => {
      if (m.userId === userId) {
        changed = true;
        return {
          ...m,
          username: updates.username !== undefined ? updates.username : m.username,
          displayName: updates.displayName !== undefined ? updates.displayName : m.displayName,
          avatarUrl: updates.avatarUrl !== undefined ? updates.avatarUrl : m.avatarUrl,
        };
      }
      return m;
    });

    const isLeader = activeClan.leaderId === userId;
    const updatedClan: ClanItem = {
      ...activeClan,
      leaderName:
        isLeader && (updates.displayName || updates.username)
          ? (updates.displayName || updates.username)!
          : activeClan.leaderName,
      members: updatedMembers,
      topContributors: (activeClan.topContributors || []).map((tc) => {
        if (tc.userId === userId) {
          return {
            ...tc,
            name: updates.displayName || updates.username || tc.name,
            avatarUrl: updates.avatarUrl !== undefined ? updates.avatarUrl : tc.avatarUrl,
          };
        }
        return tc;
      }),
    };

    if (changed || isLeader) {
      await AsyncStorage.setItem(USER_CLAN_KEY, JSON.stringify(updatedClan));
      const allClans = await this.getAllClans();
      const updatedAll = allClans.map((c) => (c.id === updatedClan.id ? updatedClan : c));
      await AsyncStorage.setItem(CLANS_DIRECTORY_KEY, JSON.stringify(updatedAll));
      return updatedClan;
    }

    return activeClan;
  }
}

