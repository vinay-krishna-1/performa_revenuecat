import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Crown,
  Sparkles,
  Award,
  Shield,
  Zap,
  Palette,
  LogOut,
  ChevronRight,
  Sun,
  Moon,
  Cloud,
  CloudOff,
  RefreshCw,
  Flame,
  Trash2,
  Settings,
  Share2,
  Users,
  Edit3,
} from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RADIUS } from '../../src/constants/theme';
import { useTheme } from '../../src/context/ThemeContext';
import { useAuth } from '../../src/features/auth/AuthContext';
import {
  SegmentedControl,
  DivisionBadge,
  XPProgress,
  ScreenBackground,
} from '../../src/components/common';
import { SyncService, SyncStatusInfo } from '../../src/services/SyncService';
import { ActivitySummary, RoutePrivacyMode } from '../../src/types';
import { SettingsModal } from '../../src/components/settings/SettingsModal';
import { SessionCardShareModal } from '../../src/components/activity/SessionCardShareModal';
import { FriendsModal } from '../../src/components/social/FriendsModal';
import { AthleteProfileModal } from '../../src/components/social/AthleteProfileModal';
import { FriendService, AthleteProfileDetails } from '../../src/features/social/FriendService';
import { PlayerBanner } from '../../src/components/profile/PlayerBanner';
import { FrameSelectModal } from '../../src/components/profile/FrameSelectModal';
import { AchievementsTab } from '../../src/components/achievements/AchievementsTab';
import { AchievementUnlockedModal } from '../../src/components/achievements/AchievementUnlockedModal';
import { AchievementService } from '../../src/features/achievements/AchievementService';
import { AchievementDefinition } from '../../src/features/achievements/AchievementTypes';
import { ActivityPrivacyModal } from '../../src/components/activities/ActivityPrivacyModal';
import { AvatarSelectModal } from '../../src/components/profile/AvatarSelectModal';
import { BannerThemeModal, STORAGE_KEY_BANNER_THEME } from '../../src/components/profile/BannerThemeModal';
import { RouteSvgThumbnail } from '../../src/components/activities/RouteSvgThumbnail';
import { EditSessionModal } from '../../src/components/activities/EditSessionModal';

interface CleanCosmetic {
  id: string;
  name: string;
  type: 'FRAME' | 'TITLE' | 'BADGE' | 'THEME';
  rarity: 'COMMON' | 'RARE' | 'EPIC' | 'ZENITH';
  description: string;
  isOwned: boolean;
  isEquipped: boolean;
  iconType: 'shield' | 'zap' | 'award' | 'palette';
}

const BASE_INVENTORY: CleanCosmetic[] = [
  {
    id: 'frame_gold_s1',
    name: 'Season 0 Genesis Crest',
    type: 'FRAME',
    rarity: 'RARE',
    description: 'Awarded for reaching Gold division in Season 0: Genesis Horizon.',
    isOwned: true,
    isEquipped: true,
    iconType: 'shield',
  },
  {
    id: 'title_pacesetter',
    name: 'Pacesetter',
    type: 'TITLE',
    rarity: 'COMMON',
    description: 'Consistent 5K pacing achieved across 10 sessions.',
    isOwned: true,
    isEquipped: true,
    iconType: 'zap',
  },
  {
    id: 'badge_5k_sub25',
    name: 'Sub-25 5K Master',
    type: 'BADGE',
    rarity: 'EPIC',
    description: 'Officially verified sub-25 minute 5K performance.',
    isOwned: true,
    isEquipped: true,
    iconType: 'award',
  },
  {
    id: 'theme_dark_matrix',
    name: 'Stealth Obsidian Theme',
    type: 'THEME',
    rarity: 'EPIC',
    description: 'Pure pitch black OLED canvas with precision volt telemetry.',
    isOwned: true,
    isEquipped: true,
    iconType: 'palette',
  },
  {
    id: 'theme_light_cobalt',
    name: 'Cobalt Daylight Theme',
    type: 'THEME',
    rarity: 'EPIC',
    description: 'Crisp light slate canvas with deep electric cobalt typography.',
    isOwned: true,
    isEquipped: false,
    iconType: 'palette',
  },
];

export default function MeScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ section?: string }>();
  const insets = useSafeAreaInsets();
  const { user, signOut } = useAuth();
  const { colors, isDark, toggleTheme, setTheme } = useTheme();

  const [activeSection, setActiveSection] = useState<'OVERVIEW' | 'ACHIEVEMENTS' | 'ACTIVITIES'>('OVERVIEW');

  React.useEffect(() => {
    if (params.section) {
      const target = params.section.toUpperCase();
      if (['OVERVIEW', 'ACHIEVEMENTS', 'ACTIVITIES'].includes(target)) {
        setActiveSection(target as any);
      }
    }
  }, [params.section]);
  const [inventoryList, setInventoryList] = useState<CleanCosmetic[]>(BASE_INVENTORY);
  const [syncInfo, setSyncInfo] = useState<SyncStatusInfo>(() => SyncService.getInstance().getStatusInfo());
  const [activities, setActivities] = useState<ActivitySummary[]>([]);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showFriendsModal, setShowFriendsModal] = useState(false);
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);
  const [routePrivacyMode, setRoutePrivacyMode] = useState<RoutePrivacyMode>('FULL');
  const [activityPrivacies, setActivityPrivacies] = useState<Record<string, RoutePrivacyMode>>({});
  const [privacyEditingActivity, setPrivacyEditingActivity] = useState<ActivitySummary | null>(null);
  const [showPrivacyModal, setShowPrivacyModal] = useState<boolean>(false);
  const [selectedAthlete, setSelectedAthlete] = useState<AthleteProfileDetails | null>(null);
  const [sharingActivity, setSharingActivity] = useState<ActivitySummary | null>(null);
  const [editingSessionActivity, setEditingSessionActivity] = useState<ActivitySummary | null>(null);
  const [showEditSessionModal, setShowEditSessionModal] = useState<boolean>(false);
  const [sessionFilter, setSessionFilter] = useState<'ALL' | 'RANKED' | 'CASUAL'>('ALL');

  const isRankedActivity = React.useCallback((act: ActivitySummary) => {
    return act.recordingMode ? act.recordingMode === 'RANKED' : (act.prEarned > 0);
  }, []);

  const rankedActivitiesCount = React.useMemo(
    () => activities.filter((a) => isRankedActivity(a)).length,
    [activities, isRankedActivity]
  );

  const casualActivitiesCount = React.useMemo(
    () => activities.filter((a) => !isRankedActivity(a)).length,
    [activities, isRankedActivity]
  );

  const filteredActivities = React.useMemo(() => {
    if (sessionFilter === 'RANKED') {
      return activities.filter((a) => isRankedActivity(a));
    }
    if (sessionFilter === 'CASUAL') {
      return activities.filter((a) => !isRankedActivity(a));
    }
    return activities;
  }, [activities, sessionFilter, isRankedActivity]);

  // Modular Achievements & Rewards System State
  const [showcasedAchievements, setShowcasedAchievements] = useState<AchievementDefinition[]>([]);
  const [activeFrameId, setActiveFrameId] = useState<string>('frame_basic');
  const [totalAp, setTotalAp] = useState<number>(0);
  const [showFrameModal, setShowFrameModal] = useState<boolean>(false);
  const [showAvatarModal, setShowAvatarModal] = useState<boolean>(false);
  const [showBannerThemeModal, setShowBannerThemeModal] = useState<boolean>(false);
  const [avatarId, setAvatarId] = useState<string>('avatar_explorer');
  const [bannerThemeId, setBannerThemeId] = useState<string>('BANNER_EXPLORER');
  const [unlockedModalAch, setUnlockedModalAch] = useState<AchievementDefinition | null>(null);

  const loadActivities = React.useCallback(async () => {
    try {
      const all = await SyncService.getInstance().getAllActivities(user?.id);
      setActivities(all);
      const privMap: Record<string, RoutePrivacyMode> = {};
      for (const act of all) {
        privMap[act.id] = await FriendService.getInstance().getActivityPrivacyMode(act.id);
      }
      setActivityPrivacies(privMap);
    } catch (err) {
      console.warn('[MeScreen] Error loading activities:', err);
    }
  }, [user?.id]);

  const handleSaveActivityPrivacy = async (mode: RoutePrivacyMode, applyToAll: boolean) => {
    if (!privacyEditingActivity) return;
    await FriendService.getInstance().setActivityPrivacyMode(privacyEditingActivity.id, mode);
    if (applyToAll) {
      const allIds = activities.map((a) => a.id);
      await FriendService.getInstance().setGlobalRoutePrivacyMode(mode, true, allIds);
      setRoutePrivacyMode(mode);
      const updatedMap: Record<string, RoutePrivacyMode> = {};
      allIds.forEach((id) => {
        updatedMap[id] = mode;
      });
      setActivityPrivacies(updatedMap);
    } else {
      setActivityPrivacies((prev) => ({ ...prev, [privacyEditingActivity.id]: mode }));
    }
  };

  const handleSaveSessionDetails = async (activityId: string, title: string, description: string) => {
    try {
      await SyncService.getInstance().updateActivity(activityId, { title, description });
      await loadActivities();
    } catch (e) {
      console.warn('[MeScreen] Error updating session details:', e);
    }
  };

  const loadSocialData = React.useCallback(async () => {
    try {
      const [reqs, priv] = await Promise.all([
        FriendService.getInstance().getPendingRequests(),
        FriendService.getInstance().getRoutePrivacyMode(),
      ]);
      setPendingRequestsCount(reqs.length);
      setRoutePrivacyMode(priv);
    } catch (err) {
      console.warn('[MeScreen] Error loading social data:', err);
    }
  }, []);

  const loadAchievementData = React.useCallback(async () => {
    try {
      const service = AchievementService.getInstance();
      await service.initialize();
      setShowcasedAchievements(service.getShowcasedAchievements());
      setActiveFrameId(service.getActiveFrame().id);
      setTotalAp(service.getTotalPoints());

      const [savedAvatar, savedTheme] = await Promise.all([
        AsyncStorage.getItem('@performa_avatar_id'),
        AsyncStorage.getItem(STORAGE_KEY_BANNER_THEME),
      ]);
      if (savedAvatar) {
        const validAvatar = ['avatar_explorer', 'avatar_route', 'avatar_sprinter', 'avatar_summit', 'avatar_ghost', 'avatar_competitor', 'avatar_rounder', 'initials'].includes(savedAvatar)
          ? savedAvatar
          : 'avatar_explorer';
        setAvatarId(validAvatar);
      }
      if (savedTheme) {
        const validTheme = ['BANNER_EXPLORER', 'BANNER_VELOCITY', 'THEME_OBSIDIAN'].includes(savedTheme)
          ? savedTheme
          : 'BANNER_EXPLORER';
        setBannerThemeId(validTheme);
        if (savedTheme === 'BANNER_ZENITH') {
          AsyncStorage.setItem(STORAGE_KEY_BANNER_THEME, 'BANNER_EXPLORER').catch(() => {});
        }
      }
    } catch (err) {
      console.warn('[MeScreen] Error loading achievement data:', err);
    }
  }, []);

  React.useEffect(() => {
    loadActivities();
    loadSocialData();
    loadAchievementData();

    const unsubSync = SyncService.getInstance().subscribe((info) => {
      setSyncInfo(info);
      loadActivities();
    });

    const unsubUnlock = AchievementService.getInstance().subscribeUnlock((ach) => {
      setUnlockedModalAch(ach);
      loadAchievementData();
    });

    return () => {
      unsubSync();
      unsubUnlock();
    };
  }, [loadActivities, loadSocialData, loadAchievementData]);

  // Dynamic lifetime metrics computed directly from recorded activities
  const lifetimeDistKm = React.useMemo(() => {
    const fromActs = activities.reduce((acc, a) => acc + (a.distanceMeters || 0), 0);
    const totalM = Math.max(fromActs, user?.lifetimeDistanceMeters || 0);
    return (totalM / 1000).toFixed(1);
  }, [activities, user?.lifetimeDistanceMeters]);

  const lifetimeTimeFormatted = React.useMemo(() => {
    const fromActs = activities.reduce((acc, a) => acc + (a.movingSeconds || 0), 0);
    const totalSec = Math.max(fromActs, user?.lifetimeDurationSeconds || 0);
    if (totalSec <= 0) return '0m';
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  }, [activities, user?.lifetimeDurationSeconds]);

  const lifetimeSessionsCount = React.useMemo(() => {
    return Math.max(activities.length, user?.lifetimeActivitiesCount || 0);
  }, [activities.length, user?.lifetimeActivitiesCount]);

  const sportBreakdown = React.useMemo(() => {
    const runs = activities.filter((a) => a.type === 'RUN');
    const cycles = activities.filter((a) => a.type === 'CYCLE');
    const walks = activities.filter((a) => a.type === 'WALK');
    return {
      runKm: (runs.reduce((s, a) => s + a.distanceMeters, 0) / 1000).toFixed(1),
      runCount: runs.length,
      cycleKm: (cycles.reduce((s, a) => s + a.distanceMeters, 0) / 1000).toFixed(1),
      cycleCount: cycles.length,
      walkKm: (walks.reduce((s, a) => s + a.distanceMeters, 0) / 1000).toFixed(1),
      walkCount: walks.length,
    };
  }, [activities]);

  const formatDuration = (totalSec: number) => {
    const m = Math.floor(totalSec / 60);
    const s = Math.floor(totalSec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const formatPace = (paceSec: number) => {
    if (!paceSec || paceSec <= 0) return "--'--\"/km";
    const m = Math.floor(paceSec / 60);
    const s = Math.floor(paceSec % 60);
    return `${m}'${s < 10 ? '0' : ''}${s}"/km`;
  };

  const formatDate = (timestamp: number) => {
    const d = new Date(timestamp);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    if (isToday) {
      return `Today at ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
    return d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const handleDeleteActivity = (id: string) => {
    Alert.alert(
      'Delete Activity',
      'Are you sure you want to permanently delete this workout? This action cannot be undone and will update your local records and cloud sync.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await SyncService.getInstance().deleteActivity(id);
            await loadActivities();
          },
        },
      ]
    );
  };

  const toggleEquip = (itemId: string) => {
    // If user clicks a theme cosmetic, trigger the theme engine!
    if (itemId === 'theme_dark_matrix') {
      setTheme('dark');
    } else if (itemId === 'theme_light_cobalt') {
      setTheme('light');
    }

    setInventoryList((prev) =>
      prev.map((item) => {
        if (item.id === itemId) {
          return { ...item, isEquipped: !item.isEquipped };
        }
        if (item.type === prev.find((x) => x.id === itemId)?.type) {
          return { ...item, isEquipped: false };
        }
        return item;
      })
    );
  };

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await signOut();
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  const renderIcon = (type: CleanCosmetic['iconType']) => {
    const iconColor = colors.textPrimary;
    switch (type) {
      case 'shield':
        return <Shield size={18} color={iconColor} />;
      case 'zap':
        return <Zap size={18} color={iconColor} />;
      case 'award':
        return <Award size={18} color={iconColor} />;
      case 'palette':
        return <Palette size={18} color={iconColor} />;
    }
  };

  return (
    <View style={[styles.screen, { backgroundColor: 'transparent', paddingTop: insets.top }]}>
      <ScreenBackground />
      {/* Profile Header */}
      <View style={styles.header}>
        <View style={styles.headerLeftCol}>
          <Text style={[styles.headerScreenTitle, { color: colors.textPrimary }]} numberOfLines={1}>ATHLETE PROFILE</Text>
          <Text style={[styles.headerScreenSub, { color: colors.textMuted }]} numberOfLines={1}>SEASON 0: GENESIS HORIZON</Text>
        </View>

        <View style={styles.headerRightActions}>
          {/* Minimalist Upgrade Link */}
          {!user?.isPro ? (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => router.push('/pro')}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 5,
                paddingHorizontal: 8,
                paddingVertical: 5,
              }}
            >
              <Sparkles size={12} color={colors.accent} />
              <Text style={{ color: colors.accent, fontWeight: '800', fontSize: 11, letterSpacing: 0.8 }}>
                UPGRADE
              </Text>
            </TouchableOpacity>
          ) : (
            <View style={[styles.proBadgeHeader, { borderColor: isDark ? 'rgba(234, 179, 8, 0.35)' : 'rgba(217, 119, 6, 0.3)' }]}>
              <Crown size={10} color={colors.gold} />
              <Text style={[styles.proBadgeHeaderText, { color: colors.gold }]}>PRO</Text>
            </View>
          )}

          {/* Dedicated Community / Friends Button */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setShowFriendsModal(true)}
            style={[
              styles.iconActionBtn,
              {
                borderColor: colors.surfaceBorder,
                backgroundColor: isDark ? '#111116' : '#FFFFFF',
              },
            ]}
          >
            <Users size={14} color={colors.textPrimary} />
            {pendingRequestsCount > 0 && (
              <View style={[styles.headerBadgeDot, { backgroundColor: colors.accent }]} />
            )}
          </TouchableOpacity>

          {/* Dedicated Settings Button */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setShowSettingsModal(true)}
            style={[
              styles.iconActionBtn,
              {
                borderColor: colors.surfaceBorder,
                backgroundColor: isDark ? '#111116' : '#FFFFFF',
              },
            ]}
          >
            <Settings size={15} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 90 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Athlete Player Banner (Custom Frame, Level, Apex 3-slot flex showcase, Collapsible lifetime telemetry) */}
        <View style={styles.bannerWrapper}>
          <PlayerBanner
            user={user}
            activeFrameId={activeFrameId}
            avatarId={avatarId}
            bannerThemeId={bannerThemeId}
            showcasedAchievements={showcasedAchievements}
            totalAp={totalAp}
            activities={activities}
            onOpenFrameSelect={() => setShowFrameModal(true)}
            onOpenAvatarSelect={() => setShowAvatarModal(true)}
            onOpenBannerTheme={() => setShowBannerThemeModal(true)}
            onOpenAchievements={() => setActiveSection('ACHIEVEMENTS')}
            onOpenCommunity={() => setShowFriendsModal(true)}
            pendingCommunityRequests={pendingRequestsCount}
          />
        </View>

        {/* Navigation Switch */}
        <View style={styles.segmentedContainer}>
          <SegmentedControl<'OVERVIEW' | 'ACHIEVEMENTS' | 'ACTIVITIES'>
            options={[
              { id: 'OVERVIEW', label: 'Identity' },
              { id: 'ACHIEVEMENTS', label: 'Honors' },
              { id: 'ACTIVITIES', label: `Sessions${activities.length > 0 ? ` (${activities.length})` : ''}` },
            ]}
            selectedId={activeSection}
            onSelect={(id) => setActiveSection(id)}
          />
        </View>
        {activeSection === 'OVERVIEW' && (
          <View style={styles.flowContainer}>
            {/* Seamless XP Progression (NO BOX) */}
            <View style={styles.flowSection}>
              <XPProgress
                level={user?.level || 1}
                currentXp={user?.currentXp || 0}
                nextLevelXp={user?.xpForNextLevel || 1000}
              />
            </View>

            {user?.zenithBadges && user.zenithBadges.length > 0 && (
              <>
                <View style={[styles.sectionDivider, { backgroundColor: colors.divider }]} />
                <View style={styles.flowSection}>
                  <View style={styles.rowBetween}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Crown size={15} color={colors.gold} />
                      <Text style={[styles.prestigeTitle, { color: colors.gold }]}>ZENITH PRESTIGE RECORD</Text>
                    </View>
                    <Text style={[styles.zenithCount, { color: colors.textMuted }]}>
                      {user.zenithBadges.length} BADGE{user.zenithBadges.length > 1 ? 'S' : ''} EARNED
                    </Text>
                  </View>
                  <View style={styles.zenithRow}>
                    {user.zenithBadges.map((b, i) => (
                      <View
                        key={i}
                        style={[
                          styles.zenithBadge,
                          {
                            backgroundColor: isDark ? 'rgba(234, 179, 8, 0.06)' : 'rgba(217, 119, 6, 0.08)',
                            borderColor: isDark ? 'rgba(234, 179, 8, 0.2)' : 'rgba(217, 119, 6, 0.25)',
                          },
                        ]}
                      >
                        <Text style={[styles.zenithBadgeSeason, { color: colors.textMuted }]}>SEASON 0{b.season}</Text>
                        <Text style={[styles.zenithBadgeRank, { color: colors.gold }]}>#{b.rank} ZENITH 100</Text>
                      </View>
                    ))}
                  </View>
                </View>
              </>
            )}

            <View style={[styles.sectionDivider, { backgroundColor: colors.divider }]} />

            {/* Seamless Personal Bests */}
            <View style={styles.flowSection}>
              <Text style={[styles.subSectionTitle, { color: colors.textMuted }]}>PERSONAL BESTS (PB)</Text>
              {user?.personalBests && user.personalBests.length > 0 ? (
                <View style={styles.pbRow}>
                  {user.personalBests.map((pb, idx) => (
                    <React.Fragment key={idx}>
                      {idx > 0 && <View style={[styles.pbDivider, { backgroundColor: colors.surfaceBorder }]} />}
                      <View style={styles.pbCol}>
                        <Text style={[styles.pbVal, { color: colors.textPrimary }]}>
                          {formatDuration(pb.bestTimeSeconds)}
                        </Text>
                        <Text style={[styles.pbLabel, { color: colors.accent }]}>{pb.distanceLabel} RECORD</Text>
                        <Text style={[styles.pbDate, { color: colors.textMuted }]}>{pb.date}</Text>
                      </View>
                    </React.Fragment>
                  ))}
                </View>
              ) : (
                <Text style={{ fontSize: 13, color: colors.textMuted, marginTop: 4 }}>
                  Complete activities to automatically set and verify your official personal bests.
                </Text>
              )}
            </View>

            <View style={[styles.sectionDivider, { backgroundColor: colors.divider }]} />

            {/* Seamless Sport Breakdown */}
            <View style={styles.flowSection}>
              <Text style={[styles.subSectionTitle, { color: colors.textMuted }]}>SPORT BREAKDOWN</Text>
              <View style={styles.sportList}>
                <View style={styles.sportRow}>
                  <Text style={[styles.sportName, { color: colors.textPrimary }]}>Running</Text>
                  <Text style={[styles.sportVal, { color: colors.textSecondary }]}>
                    {sportBreakdown.runKm} km ({sportBreakdown.runCount} {sportBreakdown.runCount === 1 ? 'session' : 'sessions'})
                  </Text>
                </View>
                <View style={[styles.rowSeparator, { backgroundColor: colors.divider }]} />
                <View style={styles.sportRow}>
                  <Text style={[styles.sportName, { color: colors.textPrimary }]}>Cycling</Text>
                  <Text style={[styles.sportVal, { color: colors.textSecondary }]}>
                    {sportBreakdown.cycleKm} km ({sportBreakdown.cycleCount} {sportBreakdown.cycleCount === 1 ? 'session' : 'sessions'})
                  </Text>
                </View>
                <View style={[styles.rowSeparator, { backgroundColor: colors.divider }]} />
                <View style={styles.sportRow}>
                  <Text style={[styles.sportName, { color: colors.textPrimary }]}>Walking</Text>
                  <Text style={[styles.sportVal, { color: colors.textSecondary }]}>
                    {sportBreakdown.walkKm} km ({sportBreakdown.walkCount} {sportBreakdown.walkCount === 1 ? 'session' : 'sessions'})
                  </Text>
                </View>
              </View>
            </View>

            <View style={[styles.sectionDivider, { backgroundColor: colors.divider }]} />

            {/* Community & Friends Shortcut */}
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setShowFriendsModal(true)}
              style={styles.proActionRow}
            >
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={[styles.proCardTitle, { color: colors.textPrimary }]}>Friends & Training Partners</Text>
                  {pendingRequestsCount > 0 && (
                    <View style={[styles.badgePill, { backgroundColor: colors.accent }]}>
                      <Text style={styles.badgePillText}>{pendingRequestsCount} NEW</Text>
                    </View>
                  )}
                </View>
                <Text style={[styles.proCardDesc, { color: colors.textSecondary }]}>
                  Search athletes, friend requests, friends roster & race as ghost.
                </Text>
              </View>
              <ChevronRight size={16} color={colors.textMuted} />
            </TouchableOpacity>

            <View style={[styles.sectionDivider, { backgroundColor: colors.divider }]} />

            {/* Dedicated Settings Row */}
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setShowSettingsModal(true)}
              style={styles.proActionRow}
            >
              <View style={{ flex: 1 }}>
                <Text style={[styles.proCardTitle, { color: colors.textPrimary }]}>Preferences & Settings</Text>
                <Text style={[styles.proCardDesc, { color: colors.textSecondary }]}>
                  Units, Voice Coach, Appearance, Cloud Sync & Security.
                </Text>
              </View>
              <ChevronRight size={16} color={colors.textMuted} />
            </TouchableOpacity>

            <View style={[styles.sectionDivider, { backgroundColor: colors.divider }]} />

            {/* Pro Upgrade Shortcut */}
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => router.push('/pro')}
              style={styles.proActionRow}
            >
              <View style={{ flex: 1 }}>
                <Text style={[styles.proCardTitle, { color: colors.textPrimary }]}>Performa Pro</Text>
                <Text style={[styles.proCardDesc, { color: colors.textSecondary }]}>
                  Ghost Mode, Pacer Strategy, and Voice Coach.
                </Text>
              </View>
              <ChevronRight size={16} color={colors.textMuted} />
            </TouchableOpacity>
          </View>
        )}

        {activeSection === 'ACTIVITIES' && (
          <View style={styles.flowContainer}>
            <View style={styles.rowBetween}>
              <Text style={[styles.subSectionTitle, { color: colors.textMuted }]}>RECORDED SESSIONS</Text>
              <Text style={[styles.activityCountSub, { color: colors.textSecondary }]}>
                {activities.length} {activities.length === 1 ? 'Session' : 'Sessions'}
              </Text>
            </View>

            {/* Session Category Filter Pills */}
            <View style={styles.sessionFilterRow}>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setSessionFilter('ALL')}
                style={[
                  styles.sessionFilterPill,
                  sessionFilter === 'ALL' && {
                    backgroundColor: colors.accent,
                    borderColor: colors.accent,
                  },
                  sessionFilter !== 'ALL' && {
                    backgroundColor: isDark ? '#141A22' : '#F1F5F9',
                    borderColor: colors.surfaceBorder,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.sessionFilterText,
                    {
                      color:
                        sessionFilter === 'ALL'
                          ? (isDark ? '#000000' : '#FFFFFF')
                          : colors.textSecondary,
                      fontWeight: sessionFilter === 'ALL' ? '900' : '700',
                    },
                  ]}
                >
                  ALL ({activities.length})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setSessionFilter('RANKED')}
                style={[
                  styles.sessionFilterPill,
                  sessionFilter === 'RANKED' && {
                    backgroundColor: colors.accent,
                    borderColor: colors.accent,
                  },
                  sessionFilter !== 'RANKED' && {
                    backgroundColor: isDark ? '#141A22' : '#F1F5F9',
                    borderColor: colors.surfaceBorder,
                  },
                ]}
              >
                <Zap
                  size={11}
                  color={
                    sessionFilter === 'RANKED'
                      ? (isDark ? '#000000' : '#FFFFFF')
                      : colors.accent
                  }
                />
                <Text
                  style={[
                    styles.sessionFilterText,
                    {
                      color:
                        sessionFilter === 'RANKED'
                          ? (isDark ? '#000000' : '#FFFFFF')
                          : colors.textPrimary,
                      fontWeight: sessionFilter === 'RANKED' ? '900' : '700',
                    },
                  ]}
                >
                  ⚡ RANKED ({rankedActivitiesCount})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setSessionFilter('CASUAL')}
                style={[
                  styles.sessionFilterPill,
                  sessionFilter === 'CASUAL' && {
                    backgroundColor: colors.accent,
                    borderColor: colors.accent,
                  },
                  sessionFilter !== 'CASUAL' && {
                    backgroundColor: isDark ? '#141A22' : '#F1F5F9',
                    borderColor: colors.surfaceBorder,
                  },
                ]}
              >
                <Text style={{ fontSize: 10 }}>☕</Text>
                <Text
                  style={[
                    styles.sessionFilterText,
                    {
                      color:
                        sessionFilter === 'CASUAL'
                          ? (isDark ? '#000000' : '#FFFFFF')
                          : colors.textPrimary,
                      fontWeight: sessionFilter === 'CASUAL' ? '900' : '700',
                    },
                  ]}
                >
                  CASUAL ({casualActivitiesCount})
                </Text>
              </TouchableOpacity>
            </View>

            {activities.length === 0 ? (
              <View style={[styles.emptyActivitiesBox, { borderColor: colors.surfaceBorder }]}>
                <Flame size={32} color={colors.accent} />
                <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No Sessions Recorded Yet</Text>
                <Text style={[styles.emptyDesc, { color: colors.textMuted }]}>
                  Hit the Record button below to track your pace, live GPS map, and earn XP and PR.
                </Text>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => router.push('/(tabs)/record')}
                  style={[styles.recordCtaBtn, { backgroundColor: colors.accent }]}
                >
                  <Text style={[styles.recordCtaText, { color: isDark ? '#000000' : '#FFFFFF' }]}>RECORD A SESSION</Text>
                </TouchableOpacity>
              </View>
            ) : filteredActivities.length === 0 ? (
              <View style={[styles.emptyActivitiesBox, { borderColor: colors.surfaceBorder, paddingVertical: 28 }]}>
                <Text style={{ fontSize: 14, fontWeight: '800', color: colors.textPrimary, marginBottom: 4 }}>
                  No {sessionFilter === 'RANKED' ? 'Ranked' : 'Casual'} Sessions
                </Text>
                <Text style={[styles.emptyDesc, { color: colors.textMuted }]}>
                  {sessionFilter === 'RANKED'
                    ? 'Start an unpaused Ranked session in the Record tab to earn Division PR.'
                    : 'Casual sessions allow pausing and will appear here.'}
                </Text>
              </View>
            ) : (
              filteredActivities.map((act) => (
                <TouchableOpacity
                  key={act.id}
                  activeOpacity={0.75}
                  onPress={() =>
                    router.push({
                      pathname: '/activity/[id]',
                      params: { id: act.id, data: JSON.stringify(act) },
                    })
                  }
                  style={[
                    styles.sessionSeamlessRow,
                    {
                      borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)',
                    },
                  ]}
                >
                  {/* Route Silhouette Map Thumbnail */}
                  <RouteSvgThumbnail
                    coordinates={act.routeCoordinates}
                    activityType={act.type}
                    size={52}
                  />

                  {/* Main Session Content */}
                  <View style={styles.sessionContentCol}>
                    <View style={styles.sessionTitleLine}>
                      <Text style={[styles.sessionTitleText, { color: colors.textPrimary }]} numberOfLines={1}>
                        {act.title || `${act.type === 'RUN' ? 'Run' : act.type === 'CYCLE' ? 'Cycle' : 'Walk'} Workout`}
                      </Text>
                      <TouchableOpacity
                        activeOpacity={0.7}
                        onPress={(e) => {
                          e.stopPropagation?.();
                          setEditingSessionActivity(act);
                          setShowEditSessionModal(true);
                        }}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        style={styles.inlineEditBtn}
                      >
                        <Edit3 size={12} color={colors.textMuted} />
                      </TouchableOpacity>
                    </View>

                    {act.description ? (
                      <Text style={[styles.sessionDescText, { color: colors.textSecondary }]} numberOfLines={1}>
                        "{act.description}"
                      </Text>
                    ) : null}

                    {/* Metric Strip */}
                    <View style={styles.sessionMetricsInline}>
                      <Text style={[styles.sessionMetricBold, { color: colors.textPrimary }]}>
                        {(act.distanceMeters / 1000).toFixed(2)} km
                      </Text>
                      <Text style={[styles.sessionMetricBullet, { color: colors.textMuted }]}>•</Text>
                      <Text style={[styles.sessionMetricMuted, { color: colors.textSecondary }]}>
                        {formatDuration(act.movingSeconds)}
                      </Text>
                      <Text style={[styles.sessionMetricBullet, { color: colors.textMuted }]}>•</Text>
                      <Text style={[styles.sessionMetricMuted, { color: colors.textSecondary }]}>
                        {formatPace(act.avgPaceSecondsPerKm)}/km
                      </Text>
                    </View>

                    <View style={styles.sessionDateRow}>
                      <Text style={[styles.sessionDateSub, { color: colors.textMuted }]}>
                        {formatDate(act.startTime)}
                      </Text>

                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        {/* Mode Badge */}
                        {isRankedActivity(act) ? (
                          <View
                            style={[
                              styles.sessionModeBadge,
                              {
                                backgroundColor: isDark
                                  ? 'rgba(204, 255, 0, 0.12)'
                                  : 'rgba(0, 82, 255, 0.1)',
                                borderColor: colors.accent,
                              },
                            ]}
                          >
                            <Zap size={9} color={colors.accent} />
                            <Text style={[styles.sessionModeBadgeText, { color: colors.accent }]}>
                              RANKED • NON-STOP
                            </Text>
                          </View>
                        ) : (
                          <View
                            style={[
                              styles.sessionModeBadge,
                              {
                                backgroundColor: isDark
                                  ? 'rgba(255, 255, 255, 0.05)'
                                  : '#F1F5F9',
                                borderColor: colors.surfaceBorder,
                              },
                            ]}
                          >
                            <Text style={{ fontSize: 9 }}>☕</Text>
                            <Text style={[styles.sessionModeBadgeText, { color: colors.textMuted }]}>
                              CASUAL
                            </Text>
                          </View>
                        )}

                        {/* PR Badge */}
                        {act.prEarned > 0 ? (
                          <View
                            style={[
                              styles.sessionPrBadge,
                              {
                                backgroundColor: isDark
                                  ? 'rgba(204, 255, 0, 0.12)'
                                  : 'rgba(0, 82, 255, 0.1)',
                              },
                            ]}
                          >
                            <Text style={[styles.sessionPrText, { color: colors.accent }]}>
                              +{act.prEarned} PR
                            </Text>
                          </View>
                        ) : (
                          <View
                            style={[
                              styles.sessionPrBadge,
                              {
                                backgroundColor: isDark
                                  ? 'rgba(255, 255, 255, 0.04)'
                                  : 'rgba(0, 0, 0, 0.04)',
                              },
                            ]}
                          >
                            <Text style={[styles.sessionPrText, { color: colors.textMuted }]}>
                              +0 PR
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>
                  </View>

                  {/* Actions */}
                  <View style={styles.sessionActionsCol}>
                    <TouchableOpacity
                      activeOpacity={0.65}
                      onPress={(e) => {
                        e.stopPropagation?.();
                        setSharingActivity(act);
                      }}
                      hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                      style={{ padding: 4 }}
                    >
                      <Share2 size={14} color={colors.accent} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      activeOpacity={0.65}
                      onPress={(e) => {
                        e.stopPropagation?.();
                        handleDeleteActivity(act.id);
                      }}
                      hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                      style={{ padding: 4 }}
                    >
                      <Trash2 size={13} color={colors.textMuted} />
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </View>
        )}

        {activeSection === 'ACHIEVEMENTS' && (
          <AchievementsTab onShowcaseChanged={loadAchievementData} />
        )}
      </ScrollView>

      {/* Session Details Name & Description Modal */}
      <EditSessionModal
        visible={showEditSessionModal}
        activity={editingSessionActivity}
        onClose={() => {
          setShowEditSessionModal(false);
          setEditingSessionActivity(null);
        }}
        onSave={handleSaveSessionDetails}
      />

      {/* Community & Friends Squad Modal */}
      <FriendsModal
        visible={showFriendsModal}
        onClose={() => {
          setShowFriendsModal(false);
          loadSocialData();
        }}
        onSelectAthlete={(ath) => {
          setShowFriendsModal(false);
          setSelectedAthlete(ath);
        }}
      />

      {/* Public Athlete Profile Modal */}
      <AthleteProfileModal
        visible={!!selectedAthlete}
        onClose={() => {
          setSelectedAthlete(null);
          setShowFriendsModal(true);
        }}
        athlete={selectedAthlete}
      />

      {/* Dedicated Settings Modal */}
      <SettingsModal
        visible={showSettingsModal}
        onClose={() => {
          setShowSettingsModal(false);
          loadSocialData();
        }}
      />

      {/* Athletic Performance Card Sharing Modal */}
      {sharingActivity && (
        <SessionCardShareModal
          visible={!!sharingActivity}
          activity={sharingActivity}
          onClose={() => setSharingActivity(null)}
        />
      )}

      {/* Profile Frame Customizer Modal */}
      <FrameSelectModal
        visible={showFrameModal}
        onClose={() => setShowFrameModal(false)}
        activeFrameId={activeFrameId}
        userLevel={user?.level || 1}
        userInitials={(user?.displayName || 'A').slice(0, 2).toUpperCase()}
        onFrameSelected={(frameId) => {
          setActiveFrameId(frameId);
          loadAchievementData();
        }}
      />

      {/* Profile Picture Selector Modal */}
      <AvatarSelectModal
        visible={showAvatarModal}
        onClose={() => setShowAvatarModal(false)}
        currentAvatarId={avatarId}
        userInitials={(user?.displayName || 'A').slice(0, 2).toUpperCase()}
        onSelectAvatar={async (id) => {
          setAvatarId(id);
          await AsyncStorage.setItem('@performa_avatar_id', id);
        }}
      />

      {/* Banner Theme Customizer Modal */}
      <BannerThemeModal
        visible={showBannerThemeModal}
        onClose={() => setShowBannerThemeModal(false)}
        activeThemeId={bannerThemeId}
        onThemeSelected={async (id) => {
          setBannerThemeId(id);
          await AsyncStorage.setItem(STORAGE_KEY_BANNER_THEME, id);
        }}
      />

      {/* Achievement Unlocked Celebratory Modal */}
      <AchievementUnlockedModal
        visible={!!unlockedModalAch}
        onClose={() => setUnlockedModalAch(null)}
        achievement={unlockedModalAch}
        onEquipReward={(assetId) => {
          AchievementService.getInstance().setActiveFrame(assetId);
          setActiveFrameId(assetId);
          setUnlockedModalAch(null);
        }}
      />

      {/* Activity Map Display Privacy Modal */}
      <ActivityPrivacyModal
        visible={showPrivacyModal}
        onClose={() => setShowPrivacyModal(false)}
        activityTitle={
          privacyEditingActivity
            ? `${(privacyEditingActivity.distanceMeters / 1000).toFixed(2)} km ${privacyEditingActivity.type}`
            : undefined
        }
        currentMode={
          privacyEditingActivity
            ? activityPrivacies[privacyEditingActivity.id] || routePrivacyMode
            : routePrivacyMode
        }
        onSave={handleSaveActivityPrivacy}
      />
    </View>
  );
}


const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    paddingBottom: 16,
    paddingHorizontal: 20,
  },
  headerLeftCol: {
    flex: 1,
    marginRight: 8,
    justifyContent: 'center',
  },
  headerScreenTitle: {
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  headerScreenSub: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    marginTop: 2,
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 0,
  },
  upgradeBtnMinimal: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: RADIUS.full,
    borderWidth: 1,
  },
  upgradeBtnMinimalText: {
    fontWeight: '800',
    fontSize: 10,
    letterSpacing: 0.6,
  },
  proBadgeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    backgroundColor: 'rgba(234, 179, 8, 0.08)',
  },
  proBadgeHeaderText: {
    fontWeight: '900',
    fontSize: 9.5,
    letterSpacing: 0.5,
  },
  iconActionBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  themeTogglePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    gap: 4,
  },
  themeToggleText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  proPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    gap: 5,
  },
  proPillText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  segmentedContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  flowContainer: {
    paddingTop: 4,
  },
  flowSection: {
    paddingVertical: 6,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionDivider: {
    height: 1,
    marginVertical: 18,
  },
  prestigeTitle: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.0,
  },
  zenithCount: {
    fontSize: 10,
    fontWeight: '700',
  },
  zenithRow: {
    flexDirection: 'row',
    marginTop: 6,
  },
  zenithBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
  },
  zenithBadgeSeason: {
    fontSize: 9,
    fontWeight: '700',
  },
  zenithBadgeRank: {
    fontSize: 12,
    fontWeight: '800',
    marginTop: 1,
  },
  subSectionTitle: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginBottom: 12,
  },
  pbRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  pbCol: {
    flex: 1,
    alignItems: 'center',
  },
  pbVal: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.8,
  },
  pbLabel: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1.0,
    marginTop: 2,
  },
  pbDate: {
    fontSize: 10,
    marginTop: 2,
  },
  pbDivider: {
    width: 1,
    height: 32,
  },
  themeRowTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  themeRowSub: {
    fontSize: 12,
    marginTop: 2,
  },
  themeSwitchBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
  },
  themeSwitchBtnText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  proActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  proCardTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  proCardDesc: {
    fontSize: 12,
    marginTop: 2,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
  },
  signOutText: {
    fontSize: 13,
    fontWeight: '700',
  },
  statsStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
  },
  statsCol: {
    flex: 1,
    alignItems: 'center',
  },
  statsVal: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  statsUnit: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1.0,
    marginTop: 2,
  },
  statsDivider: {
    width: 1,
    height: 24,
  },
  sportList: {
    marginTop: 4,
  },
  sportRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  sportName: {
    fontSize: 14,
    fontWeight: '600',
  },
  sportVal: {
    fontSize: 13,
  },
  rowSeparator: {
    height: 1,
  },
  inventoryList: {
    marginTop: 4,
  },
  inventoryRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  inventoryIconBox: {
    width: 38,
    height: 38,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  inventoryDetails: {
    flex: 1,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '700',
  },
  rarityBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 3,
  },
  rarityText: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  itemDesc: {
    fontSize: 12,
    marginTop: 2,
    lineHeight: 16,
  },
  itemActions: {
    marginTop: 8,
  },
  equipBtn: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: RADIUS.full,
  },
  equipBtnText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  activityCountSub: {
    fontSize: 11,
    fontWeight: '600',
  },
  emptyActivitiesBox: {
    padding: 30,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginTop: 12,
  },
  emptyDesc: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 6,
    marginBottom: 16,
    maxWidth: 260,
  },
  recordCtaBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: RADIUS.full,
  },
  recordCtaText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  activityRowCard: {
    padding: 14,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    marginBottom: 10,
  },
  activityCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  activitySportPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sportDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  activitySportText: {
    fontSize: 13,
    fontWeight: '700',
  },
  activityDateText: {
    fontSize: 11,
  },
  activityMetricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  activityMetricCol: {
    flex: 1,
    alignItems: 'center',
  },
  metricMainText: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  metricSubText: {
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginTop: 2,
  },
  activityVDivider: {
    width: 1,
    height: 18,
  },
  headerBadgeDot: {
    position: 'absolute',
    top: 5,
    right: 5,
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  badgePill: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: RADIUS.full,
  },
  badgePillText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#000000',
  },
  privacyMiniPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    marginLeft: 6,
  },
  privacyMiniPillText: {
    fontSize: 8.5,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  bannerWrapper: {
    marginBottom: 16,
  },
  customizeFrameBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    marginBottom: 16,
  },
  customizeFrameTitle: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.6,
  },
  customizeFrameDesc: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
    lineHeight: 15,
  },
  sessionSeamlessRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    gap: 12,
  },
  sessionContentCol: {
    flex: 1,
  },
  sessionTitleLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sessionTitleText: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  inlineEditBtn: {
    padding: 3,
  },
  sessionDescText: {
    fontSize: 11,
    fontStyle: 'italic',
    marginTop: 2,
    lineHeight: 15,
  },
  sessionMetricsInline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  sessionMetricBold: {
    fontSize: 12,
    fontWeight: '800',
  },
  sessionMetricMuted: {
    fontSize: 11,
    fontWeight: '600',
  },
  sessionMetricBullet: {
    fontSize: 11,
  },
  sessionDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  sessionDateSub: {
    fontSize: 10,
    fontWeight: '600',
  },
  sessionPrBadge: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  sessionPrText: {
    fontSize: 9,
    fontWeight: '800',
  },
  sessionFilterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
    marginBottom: 12,
  },
  sessionFilterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    gap: 5,
  },
  sessionFilterText: {
    fontSize: 10.5,
    letterSpacing: 0.4,
  },
  sessionModeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 4,
    borderWidth: 1,
    gap: 3,
  },
  sessionModeBadgeText: {
    fontSize: 8.5,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  sessionActionsCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
});
