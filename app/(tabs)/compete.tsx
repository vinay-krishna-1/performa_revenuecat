import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Share, Alert, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Crown,
  Shield,
  ChevronRight,
  Users,
  Cloud,
  CloudOff,
  Award,
  Sparkles,
  Flame,
  Plus,
  Share2,
  LogOut,
  Copy,
  ArrowRight,
  Lock,
  Check,
  Trophy,
  CheckCircle2,
  Zap,
  Info,
  Clock,
} from 'lucide-react-native';
import { RADIUS } from '../../src/constants/theme';
import { useTheme } from '../../src/context/ThemeContext';
import { ActivityType } from '../../src/constants/config';
import { useAuth } from '../../src/features/auth/AuthContext';
import {
  SegmentedControl,
  DivisionBadge,
  PRProgress,
  PerformaButton,
  InfoModal,
  ScreenBackground,
} from '../../src/components/common';
import { SupabaseService, isSupabaseConfigured } from '../../src/services/supabase';
import { LeaderboardEntry, ClanItem } from '../../src/types';
import { SeasonService } from '../../src/features/progression/SeasonService';
import { CompetitiveEngine } from '../../src/features/progression/CompetitiveEngine';
import { ClanService, DEFAULT_CLAN_ACHIEVEMENTS, DEFAULT_CLAN_TITLES } from '../../src/features/clans/ClanService';
import { CreateClanModal } from '../../src/components/clans/CreateClanModal';
import { JoinClanModal } from '../../src/components/clans/JoinClanModal';
import { AthleteProfileModal } from '../../src/components/social/AthleteProfileModal';
import { FriendService, AthleteProfileDetails } from '../../src/features/social/FriendService';

interface DisplayLeaderboardUser {
  rank: number;
  displayName: string;
  division: string;
  tier: number;
  pr: number;
  isCurrentUser?: boolean;
}

const SPORT_MOCK_ROSTERS: Record<string, { displayName: string; division: string; tier: number; pr: number }[]> = {
  RUN: [
    { displayName: 'Eliud Kipchoge Fan', division: 'ZENITH', tier: 1, pr: 4820 },
    { displayName: 'Elena Rostova', division: 'ZENITH', tier: 1, pr: 4450 },
    { displayName: 'Marcus Vance', division: 'DIAMOND', tier: 1, pr: 3980 },
    { displayName: 'David Kim', division: 'DIAMOND', tier: 3, pr: 3420 },
    { displayName: 'Sarah Jenkins', division: 'PLATINUM', tier: 2, pr: 2850 },
    { displayName: 'Lucas Mayer', division: 'GOLD', tier: 1, pr: 2210 },
    { displayName: 'Chloe Zhao', division: 'SILVER', tier: 2, pr: 1420 },
    { displayName: 'Samir Patel', division: 'BRONZE', tier: 1, pr: 650 },
  ],
  CYCLE: [
    { displayName: 'Tadej Pogačar Spirit', division: 'ZENITH', tier: 1, pr: 6240 },
    { displayName: 'Matteo Rossi', division: 'ZENITH', tier: 1, pr: 5790 },
    { displayName: 'Aero Cadence Pro', division: 'DIAMOND', tier: 1, pr: 4950 },
    { displayName: 'Hans Becker', division: 'PLATINUM', tier: 1, pr: 3820 },
    { displayName: 'Camilla Silva', division: 'GOLD', tier: 2, pr: 2640 },
    { displayName: 'Tomás Ward', division: 'SILVER', tier: 1, pr: 1820 },
    { displayName: 'Julian Vance', division: 'BRONZE', tier: 2, pr: 480 },
  ],
  WALK: [
    { displayName: 'Trail Nomad', division: 'DIAMOND', tier: 1, pr: 3150 },
    { displayName: 'Maya Lin', division: 'PLATINUM', tier: 2, pr: 2780 },
    { displayName: 'Arun Verma', division: 'PLATINUM', tier: 4, pr: 2410 },
    { displayName: 'Elena Vasquez', division: 'GOLD', tier: 3, pr: 1920 },
    { displayName: 'Liam O’Connor', division: 'SILVER', tier: 2, pr: 1210 },
    { displayName: 'Jordan Reed', division: 'BRONZE', tier: 2, pr: 430 },
  ],
};

export default function CompeteScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { colors, isDark } = useTheme();

  const season = useMemo(() => SeasonService.getInstance().getCurrentSeason(), []);
  const divisionStatus = useMemo(
    () => CompetitiveEngine.getDivisionStatus(user?.currentPr || 0),
    [user?.currentPr]
  );

  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'LEADERBOARD' | 'CLANS'>('OVERVIEW');
  const [selectedSport, setSelectedSport] = useState<ActivityType>('RUN');
  const [leaderboardScope, setLeaderboardScope] = useState<'GLOBAL' | 'COUNTRY' | 'FRIENDS'>('GLOBAL');

  const [cloudLeaderboard, setCloudLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [cloudClans, setCloudClans] = useState<ClanItem[]>([]);
  const [userClan, setUserClan] = useState<ClanItem | null>(null);
  const [allClans, setAllClans] = useState<ClanItem[]>([]);
  const [showCreateClanModal, setShowCreateClanModal] = useState(false);
  const [showJoinClanModal, setShowJoinClanModal] = useState(false);
  const [showZenithInfo, setShowZenithInfo] = useState(false);
  const [showDivisionInfo, setShowDivisionInfo] = useState(false);
  const [selectedAthlete, setSelectedAthlete] = useState<AthleteProfileDetails | null>(null);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [clanSubTab, setClanSubTab] = useState<'MY_CLAN' | 'LEADERBOARD' | 'HONORS'>('MY_CLAN');
  const isCloudConfigured = isSupabaseConfigured();

  const handleOpenAthleteProfile = (item: DisplayLeaderboardUser) => {
    if (item.isCurrentUser) {
      router.push('/(tabs)/me');
      return;
    }
    const profile = FriendService.getInstance().getAthleteProfile(item.displayName, {
      displayName: item.displayName,
      division: item.division,
      tier: item.tier,
      pr: item.pr,
    });
    if (profile) {
      setSelectedAthlete(profile);
    }
  };

  const isUserClanLeader = useMemo(() => {
    if (!userClan || !user) return false;
    if (userClan.leaderId === user.id) return true;
    const member = userClan.members?.find((m) => m.userId === user.id);
    return member?.role === 'LEADER';
  }, [userClan, user]);

  const handleEquipTitle = async (titleId: string) => {
    if (!userClan) return;
    if (!isUserClanLeader) {
      Alert.alert('Leader Only', 'Only the Clan Founder or Leader has permission to equip honors and titles for the syndicate.');
      return;
    }
    const updated = await ClanService.getInstance().equipClanTitle(userClan.id, titleId);
    if (updated) {
      setUserClan(updated);
      Alert.alert('Honor Equipped', `Your clan now bears the honor "${updated.equippedTitle}".`);
    }
  };

  const sortedClanLeaderboard = useMemo(() => {
    return [...allClans].sort((a, b) => b.seasonPr - a.seasonPr);
  }, [allClans]);

  const loadClanData = useCallback(async () => {
    const [uClan, cList] = await Promise.all([
      ClanService.getInstance().getUserClan(),
      ClanService.getInstance().getAllClans(),
    ]);
    setUserClan(uClan);
    setAllClans(cList);
  }, []);

  const fetchCloudData = useCallback(async () => {
    await loadClanData();
    if (!isCloudConfigured) return;
    try {
      await SupabaseService.getInstance().ensureProfilesSeeded();
      const [lb, clans] = await Promise.all([
        SupabaseService.getInstance().fetchLeaderboard(selectedSport),
        SupabaseService.getInstance().fetchClanLeaderboard(),
      ]);
      if (lb && lb.length > 0) setCloudLeaderboard(lb);
      if (clans && clans.length > 0) setCloudClans(clans);
    } catch (err) {
      console.warn('[CompeteScreen] Error fetching cloud data:', err);
    }
  }, [selectedSport, isCloudConfigured, loadClanData]);

  useEffect(() => {
    fetchCloudData();
  }, [fetchCloudData]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchCloudData();
    setIsRefreshing(false);
  };

  const handleShareInvite = async (clan: ClanItem) => {
    try {
      await Share.share({
        message: ClanService.getInstance().getClanInviteShareMessage(clan),
        title: `Join Clan [${clan.tag}] on Performa`,
      });
    } catch (e) {
      console.warn('Share error:', e);
    }
  };

  const handleLeaveClan = () => {
    if (!userClan || !user) return;
    Alert.alert(
      'Leave Clan',
      `Are you sure you want to leave [${userClan.tag}] ${userClan.name}? Your contributed Season PR will remain with the clan.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Leave Clan',
          style: 'destructive',
          onPress: async () => {
            await ClanService.getInstance().leaveClan(user.id);
            setUserClan(null);
            loadClanData();
            Alert.alert('Left Clan', 'You have departed the clan roster.');
          },
        },
      ]
    );
  };

  // Build active leaderboard from cloud data if available, or distinct sport rosters
  const activeLeaderboard: DisplayLeaderboardUser[] = useMemo(() => {
    const userPr = user?.currentPr || 0;
    const userEntry = {
      displayName: `${user?.displayName || 'You'} (YOU)`,
      division: divisionStatus.division,
      tier: divisionStatus.tier,
      pr: userPr,
      isCurrentUser: true,
    };

    let baseList: { displayName: string; division: string; tier: number; pr: number }[];
    if (cloudLeaderboard.length > 0) {
      baseList = cloudLeaderboard.map((c) => ({
        displayName: c.athleteName,
        division: c.division,
        tier: c.tier,
        pr: c.pr,
      }));
    } else {
      baseList = SPORT_MOCK_ROSTERS[selectedSport] || SPORT_MOCK_ROSTERS.RUN;
    }

    const combined = [...baseList, userEntry].sort((a, b) => b.pr - a.pr);
    return combined.map((item, idx) => ({
      ...item,
      rank: idx + 1,
    }));
  }, [selectedSport, user, divisionStatus, cloudLeaderboard]);

  const podiumAthletes = activeLeaderboard.slice(0, 3);
  const clusterAthletes = activeLeaderboard.slice(3);

  return (
    <View style={[styles.screen, { backgroundColor: 'transparent', paddingTop: insets.top }]}>
      <ScreenBackground />
      {/* Minimal Header */}
      <View style={styles.header}>
        <View>
          <View style={styles.kickerRow}>
            <Text style={[styles.headerKicker, { color: colors.textMuted }]}>COMPETITIVE DIVISION</Text>
            <View style={styles.cloudBadge}>
              <View
                style={[
                  styles.statusDot,
                  { backgroundColor: isCloudConfigured ? colors.accent : colors.textMuted },
                ]}
              />
              <Text style={[styles.cloudText, { color: colors.textMuted }]}>
                {isCloudConfigured ? 'CLOUD' : 'OFFLINE'}
              </Text>
            </View>
          </View>
          <Text style={[styles.seasonHeader, { color: colors.textPrimary }]}>{season.name}</Text>
          <Text style={[styles.seasonSub, { color: colors.textMuted }]}>
            {season.theme} • Week {season.currentWeek} of {season.totalWeeks} ({season.daysRemaining}d left)
          </Text>
        </View>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => setShowDivisionInfo(true)}
          style={styles.rulesMinimalBtn}
        >
          <Info size={12} color={colors.accent} />
          <Text style={[styles.rulesMinimalText, { color: colors.textPrimary }]}>RULES</Text>
        </TouchableOpacity>
      </View>

      {/* Main Segmented Navigation */}
      <View style={styles.segmentedContainer}>
        <SegmentedControl<'OVERVIEW' | 'LEADERBOARD' | 'CLANS'>
          options={[
            { id: 'OVERVIEW', label: 'Division' },
            { id: 'LEADERBOARD', label: 'Leaderboard' },
            { id: 'CLANS', label: 'Clans' },
          ]}
          selectedId={activeTab}
          onSelect={(id) => setActiveTab(id)}
        />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 90 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={colors.accent}
            colors={[colors.accent]}
          />
        }
      >
        {activeTab === 'OVERVIEW' && (
          <View style={styles.tabFlow}>
            {/* Division Standing Card */}
            <View style={styles.flowSection}>
              <View style={styles.rowBetween}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>CURRENT STANDING</Text>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => setShowDivisionInfo(true)}
                    hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                    style={{ padding: 2 }}
                  >
                    <Info size={12} color={colors.textMuted} />
                  </TouchableOpacity>
                </View>
                <View
                  style={[
                    styles.seasonTierTag,
                    {
                      backgroundColor: isDark ? 'rgba(204, 255, 0, 0.08)' : 'rgba(0, 82, 255, 0.08)',
                      borderColor: isDark ? 'rgba(204, 255, 0, 0.22)' : 'rgba(0, 82, 255, 0.20)',
                    },
                  ]}
                >
                  <View style={[styles.statusDot, { backgroundColor: colors.accent }]} />
                  <Text style={[styles.seasonTierTagText, { color: colors.accent }]}>ACTIVE PROTOCOL</Text>
                </View>
              </View>

              <PRProgress
                currentDivision={divisionStatus.division}
                currentTier={divisionStatus.tier}
                currentPr={user?.currentPr || 0}
                nextTierDivision={divisionStatus.nextTierDivision}
                nextTier={divisionStatus.nextTier}
                prToPromotion={divisionStatus.prToPromotion}
                progressPercent={divisionStatus.progressPercent}
                style={styles.progressComponent}
              />

              <Text style={[styles.explainerText, { color: colors.textMuted }]}>
                Earn PR by completing verified sessions and competing in ghost challenges. Healthy consistency protects your rating against decay.
              </Text>
            </View>

            <View style={[styles.sectionDivider, { backgroundColor: colors.divider }]} />

            {/* Subtle Zenith 100 Status Bar */}
            <View style={styles.flowSection}>
              <TouchableOpacity
                activeOpacity={0.75}
                onPress={() => setShowZenithInfo(true)}
                style={[
                  styles.zenithSubtleRow,
                  {
                    backgroundColor: isDark ? 'rgba(234, 179, 8, 0.05)' : '#FDFBF7',
                    borderColor: isDark ? 'rgba(234, 179, 8, 0.22)' : '#FDE68A',
                  },
                ]}
              >
                <Crown size={14} color={colors.gold} />
                <View style={{ flex: 1, marginLeft: 8 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Text style={[styles.zenithSubtleTitle, { color: colors.gold }]}>
                      ZENITH 100 PRESTIGE
                    </Text>
                    <Text style={[styles.zenithSubtleCountdown, { color: colors.textMuted }]}>
                      Eval in {season.weeklyRolloverUtc.formattedCountdown}
                    </Text>
                  </View>
                  <Text style={[styles.zenithSubtleSub, { color: colors.textSecondary }]}>
                    Top 100 global athletes qualify for the Zenith Prestige Crest at weekly evaluation.
                  </Text>
                </View>
                <ChevronRight size={13} color={colors.gold} style={{ opacity: 0.6, marginLeft: 6 }} />
              </TouchableOpacity>
            </View>

            <View style={[styles.sectionDivider, { backgroundColor: colors.divider }]} />
          </View>
        )}

        {activeTab === 'LEADERBOARD' && (
          <View style={styles.tabFlow}>
            {/* Filter selectors */}
            <View style={styles.subSegmentRow}>
              <SegmentedControl<ActivityType>
                options={[
                  { id: 'RUN', label: 'Run' },
                  { id: 'CYCLE', label: 'Cycle' },
                  { id: 'WALK', label: 'Walk' },
                ]}
                selectedId={selectedSport}
                onSelect={(id) => setSelectedSport(id)}
              />
            </View>

            <View style={styles.subSegmentRow}>
              <SegmentedControl<'GLOBAL' | 'COUNTRY' | 'FRIENDS'>
                options={[
                  { id: 'GLOBAL', label: 'Global' },
                  { id: 'COUNTRY', label: 'National' },
                  { id: 'FRIENDS', label: 'Friends' },
                ]}
                selectedId={leaderboardScope}
                onSelect={(id) => setLeaderboardScope(id)}
              />
            </View>

            {/* 3-Step Physical Championship Podium (PUBG / Apex / Olympic Style) */}
            {podiumAthletes.length > 0 && (
              <View style={styles.podiumStageSection}>
                <View style={styles.podiumKickerRow}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Trophy size={14} color={colors.gold} />
                    <Text style={[styles.podiumKickerText, { color: colors.gold }]}>
                      SEASON CHAMPIONSHIP PODIUM
                    </Text>
                  </View>
                  <Text style={[styles.podiumSubText, { color: colors.textMuted }]}>
                    TOP 3 FINISHERS
                  </Text>
                </View>

                <View style={styles.podiumStage}>
                  {/* #2 SILVER PEDESTAL (Left) */}
                  {podiumAthletes[1] ? (
                    <View style={styles.podiumColumn}>
                      {/* Athlete Floating Header */}
                      <TouchableOpacity
                        activeOpacity={0.7}
                        onPress={() => handleOpenAthleteProfile(podiumAthletes[1])}
                        style={styles.podiumAthleteCard}
                      >
                        <View style={styles.podiumMedalIconRow}>
                          <Award size={18} color="#E2E8F0" />
                        </View>
                        <View
                          style={[
                            styles.podiumAvatarRim,
                            {
                              borderColor: '#CBD5E1',
                              backgroundColor: isDark ? '#1E293B' : '#F1F5F9',
                            },
                            podiumAthletes[1].isCurrentUser && { borderColor: colors.accent, borderWidth: 2 },
                          ]}
                        >
                          <Text style={[styles.podiumAvatarText, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>
                            {podiumAthletes[1].displayName.charAt(0).toUpperCase()}
                          </Text>
                        </View>
                        <View style={[styles.podiumRankTag, { backgroundColor: '#CBD5E1' }]}>
                          <Text style={styles.podiumRankTagText}>#2</Text>
                        </View>
                        <Text style={[styles.podiumAthleteName, { color: colors.textPrimary }]} numberOfLines={1}>
                          {podiumAthletes[1].displayName}
                        </Text>
                        <DivisionBadge division={podiumAthletes[1].division} tier={podiumAthletes[1].tier} size="sm" />
                        <Text style={[styles.podiumPrVal, { color: isDark ? '#E2E8F0' : '#475569' }]}>
                          {podiumAthletes[1].pr.toLocaleString()} PR
                        </Text>
                      </TouchableOpacity>

                      {/* Physical Silver Pedestal Block */}
                      <View
                        style={[
                          styles.pedestalBlock,
                          styles.pedestalSilver,
                          {
                            backgroundColor: isDark ? 'rgba(203, 213, 225, 0.08)' : 'rgba(203, 213, 225, 0.35)',
                            borderColor: isDark ? 'rgba(203, 213, 225, 0.25)' : 'rgba(148, 163, 184, 0.50)',
                          },
                          podiumAthletes[1].isCurrentUser && {
                            borderColor: colors.accent,
                            backgroundColor: isDark ? 'rgba(204, 255, 0, 0.10)' : 'rgba(0, 82, 255, 0.10)',
                          },
                        ]}
                      >
                        <View style={[styles.pedestalTopCap, { backgroundColor: '#CBD5E1' }]} />
                        <Text style={[styles.pedestalWatermark, { color: isDark ? 'rgba(203, 213, 225, 0.12)' : 'rgba(148, 163, 184, 0.22)' }]}>
                          2
                        </Text>
                        <Text style={[styles.pedestalPlaceLabel, { color: '#94A3B8' }]}>2ND</Text>
                      </View>
                    </View>
                  ) : (
                    <View style={styles.podiumColumnPlaceholder} />
                  )}

                  {/* #1 GOLD CHAMPION PEDESTAL (Center, Elevated) */}
                  {podiumAthletes[0] ? (
                    <View style={[styles.podiumColumn, styles.podiumColumnElevated]}>
                      {/* Athlete Floating Header */}
                      <TouchableOpacity
                        activeOpacity={0.7}
                        onPress={() => handleOpenAthleteProfile(podiumAthletes[0])}
                        style={styles.podiumAthleteCard}
                      >
                        <View style={styles.podiumMedalIconRow}>
                          <Crown size={24} color="#F59E0B" fill="#F59E0B" />
                        </View>
                        <View
                          style={[
                            styles.podiumAvatarRim,
                            styles.podiumAvatarGold,
                            {
                              borderColor: '#F59E0B',
                              backgroundColor: isDark ? '#2E1A05' : '#FEF3C7',
                            },
                            podiumAthletes[0].isCurrentUser && { borderColor: colors.accent, borderWidth: 3 },
                          ]}
                        >
                          <Text style={[styles.podiumAvatarText, { color: '#F59E0B', fontSize: 17 }]}>
                            {podiumAthletes[0].displayName.charAt(0).toUpperCase()}
                          </Text>
                        </View>
                        <View style={[styles.podiumRankTag, { backgroundColor: '#F59E0B', paddingHorizontal: 7 }]}>
                          <Text style={[styles.podiumRankTagText, { color: '#000000', fontWeight: '900' }]}>#1 CHAMPION</Text>
                        </View>
                        <Text style={[styles.podiumAthleteName, { color: colors.textPrimary, fontWeight: '900' }]} numberOfLines={1}>
                          {podiumAthletes[0].displayName}
                        </Text>
                        <DivisionBadge division={podiumAthletes[0].division} tier={podiumAthletes[0].tier} size="sm" />
                        <Text style={[styles.podiumPrVal, { color: '#F59E0B', fontWeight: '900' }]}>
                          {podiumAthletes[0].pr.toLocaleString()} PR
                        </Text>
                      </TouchableOpacity>

                      {/* Physical Gold Pedestal Block */}
                      <View
                        style={[
                          styles.pedestalBlock,
                          styles.pedestalGold,
                          {
                            backgroundColor: isDark ? 'rgba(245, 158, 11, 0.14)' : 'rgba(254, 243, 199, 0.85)',
                            borderColor: isDark ? 'rgba(245, 158, 11, 0.45)' : 'rgba(245, 158, 11, 0.65)',
                          },
                          podiumAthletes[0].isCurrentUser && {
                            borderColor: colors.accent,
                            backgroundColor: isDark ? 'rgba(204, 255, 0, 0.12)' : 'rgba(0, 82, 255, 0.12)',
                          },
                        ]}
                      >
                        <View style={[styles.pedestalTopCap, { backgroundColor: '#F59E0B' }]} />
                        <Text style={[styles.pedestalWatermark, { color: isDark ? 'rgba(245, 158, 11, 0.18)' : 'rgba(245, 158, 11, 0.28)' }]}>
                          1
                        </Text>
                        <Text style={[styles.pedestalPlaceLabel, { color: '#F59E0B', fontWeight: '900' }]}>1ST</Text>
                      </View>
                    </View>
                  ) : null}

                  {/* #3 BRONZE PEDESTAL (Right) */}
                  {podiumAthletes[2] ? (
                    <View style={styles.podiumColumn}>
                      {/* Athlete Floating Header */}
                      <TouchableOpacity
                        activeOpacity={0.7}
                        onPress={() => handleOpenAthleteProfile(podiumAthletes[2])}
                        style={styles.podiumAthleteCard}
                      >
                        <View style={styles.podiumMedalIconRow}>
                          <Award size={18} color="#D97706" />
                        </View>
                        <View
                          style={[
                            styles.podiumAvatarRim,
                            {
                              borderColor: '#D97706',
                              backgroundColor: isDark ? '#261705' : '#FFFBEB',
                            },
                            podiumAthletes[2].isCurrentUser && { borderColor: colors.accent, borderWidth: 2 },
                          ]}
                        >
                          <Text style={[styles.podiumAvatarText, { color: isDark ? '#F59E0B' : '#B45309' }]}>
                            {podiumAthletes[2].displayName.charAt(0).toUpperCase()}
                          </Text>
                        </View>
                        <View style={[styles.podiumRankTag, { backgroundColor: '#D97706' }]}>
                          <Text style={[styles.podiumRankTagText, { color: '#FFFFFF' }]}>#3</Text>
                        </View>
                        <Text style={[styles.podiumAthleteName, { color: colors.textPrimary }]} numberOfLines={1}>
                          {podiumAthletes[2].displayName}
                        </Text>
                        <DivisionBadge division={podiumAthletes[2].division} tier={podiumAthletes[2].tier} size="sm" />
                        <Text style={[styles.podiumPrVal, { color: isDark ? '#FBBF24' : '#B45309' }]}>
                          {podiumAthletes[2].pr.toLocaleString()} PR
                        </Text>
                      </TouchableOpacity>

                      {/* Physical Bronze Pedestal Block */}
                      <View
                        style={[
                          styles.pedestalBlock,
                          styles.pedestalBronze,
                          {
                            backgroundColor: isDark ? 'rgba(217, 119, 6, 0.09)' : 'rgba(254, 243, 199, 0.45)',
                            borderColor: isDark ? 'rgba(217, 119, 6, 0.25)' : 'rgba(217, 119, 6, 0.45)',
                          },
                          podiumAthletes[2].isCurrentUser && {
                            borderColor: colors.accent,
                            backgroundColor: isDark ? 'rgba(204, 255, 0, 0.10)' : 'rgba(0, 82, 255, 0.10)',
                          },
                        ]}
                      >
                        <View style={[styles.pedestalTopCap, { backgroundColor: '#D97706' }]} />
                        <Text style={[styles.pedestalWatermark, { color: isDark ? 'rgba(217, 119, 6, 0.12)' : 'rgba(217, 119, 6, 0.20)' }]}>
                          3
                        </Text>
                        <Text style={[styles.pedestalPlaceLabel, { color: '#D97706' }]}>3RD</Text>
                      </View>
                    </View>
                  ) : (
                    <View style={styles.podiumColumnPlaceholder} />
                  )}
                </View>

                {/* Ground Horizon Bar */}
                <View style={[styles.podiumStageFloor, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.10)' : 'rgba(0, 0, 0, 0.08)' }]} />
              </View>
            )}

            {/* Field of Contenders (Rank 4+) Stream */}
            <View style={styles.leaderboardStream}>
              <View style={styles.fieldHeaderRow}>
                <Text style={[styles.streamCategoryLabel, { color: colors.textMuted }]}>
                  CONTENDERS & RIVALS
                </Text>
                <Text style={[styles.fieldCountText, { color: colors.textMuted }]}>
                  {clusterAthletes.length} ATHLETES
                </Text>
              </View>

              {clusterAthletes.map((item) => (
                <TouchableOpacity
                  key={item.rank}
                  activeOpacity={0.7}
                  onPress={() => handleOpenAthleteProfile(item)}
                  style={[
                    styles.leaderRow,
                    { borderBottomColor: colors.divider },
                    item.isCurrentUser && [
                      styles.currentUserRow,
                      {
                        backgroundColor: isDark ? 'rgba(204, 255, 0, 0.06)' : 'rgba(0, 82, 255, 0.06)',
                        borderLeftColor: colors.accent,
                      },
                    ],
                  ]}
                >
                  <View style={[styles.rankChip, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.07)' : 'rgba(0, 0, 0, 0.05)' }]}>
                    <Text
                      style={[
                        styles.rankNumberText,
                        { color: item.isCurrentUser ? colors.accent : colors.textMuted },
                        item.isCurrentUser && { fontWeight: '900' },
                      ]}
                    >
                      #{item.rank}
                    </Text>
                  </View>
                  {/* Player Name Column */}
                  <View style={styles.leaderNameCol}>
                    <Text
                      style={[
                        styles.leaderName,
                        { color: item.isCurrentUser ? colors.accent : colors.textPrimary },
                        item.isCurrentUser && { fontWeight: '800' },
                      ]}
                      numberOfLines={1}
                    >
                      {item.displayName}
                    </Text>
                  </View>

                  {/* Fixed-Width Division Badge Column (EXACT VERTICAL ALIGNMENT) */}
                  <View style={styles.leaderBadgeCol}>
                    <DivisionBadge division={item.division} tier={item.tier} size="sm" />
                  </View>

                  {/* Right-Aligned PR Column */}
                  <View style={styles.leaderPrCol}>
                    <Text
                      style={[
                        styles.leaderPr,
                        { color: item.isCurrentUser ? colors.accent : colors.textSecondary },
                        item.isCurrentUser && { fontWeight: '800' },
                      ]}
                    >
                      {item.pr.toLocaleString()} PR
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}

              {cloudLeaderboard.length === 0 && (
                <View style={[styles.kickoffBanner, { borderColor: colors.surfaceBorder }]}>
                  <Flame size={20} color={colors.accent} style={{ marginBottom: 6 }} />
                  <Text style={[styles.kickoffTitle, { color: colors.textPrimary }]}>
                    {season.name} Leaderboard Open
                  </Text>
                  <Text style={[styles.kickoffDesc, { color: colors.textSecondary }]}>
                    Log outdoor verified GPS runs to climb from Bronze to Zenith 100. Standings sync across all global athletes.
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}

        {activeTab === 'CLANS' && (
          <View style={styles.tabFlow}>
            {/* Sub-segmented Control for Clans */}
            <View style={styles.subSegmentRow}>
              <SegmentedControl<'MY_CLAN' | 'LEADERBOARD' | 'HONORS'>
                options={[
                  { id: 'MY_CLAN', label: userClan ? 'Clan Hub' : 'Discovery' },
                  { id: 'LEADERBOARD', label: 'Clan Leaderboard' },
                  { id: 'HONORS', label: 'Honors & Titles' },
                ]}
                selectedId={clanSubTab}
                onSelect={(id) => setClanSubTab(id)}
              />
            </View>

            {clanSubTab === 'MY_CLAN' && (
              userClan ? (
                /* 1. CLAN HUB (SEAMLESS OBSIDIAN DESIGN) */
                <View>
                  {/* Clan Identity Banner Card */}
                  <View
                    style={[
                      styles.clanHubCard,
                      {
                        backgroundColor: isDark ? '#0D0D12' : '#FFFFFF',
                        borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
                      },
                    ]}
                  >
                    {userClan.equippedTitle && (
                      <View style={styles.equippedTitleRow}>
                        <View style={[styles.equippedTitlePill, { borderColor: isDark ? 'rgba(234, 179, 8, 0.3)' : 'rgba(217, 119, 6, 0.3)', backgroundColor: isDark ? 'rgba(234, 179, 8, 0.08)' : 'rgba(217, 119, 6, 0.08)' }]}>
                          <Crown size={10} color={colors.gold} />
                          <Text style={[styles.equippedTitleText, { color: colors.gold }]}>
                            {userClan.equippedTitle.toUpperCase()}
                          </Text>
                        </View>
                      </View>
                    )}

                    <View style={styles.clanHubHeader}>
                      <View
                        style={[
                          styles.clanHubBadge,
                          {
                            backgroundColor: isDark ? '#141A22' : '#F1F5F9',
                            borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
                          },
                        ]}
                      >
                        <Shield size={20} color={colors.accent} />
                      </View>
                      <View style={{ flex: 1, marginLeft: 12 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <Text style={[styles.clanHubName, { color: colors.textPrimary }]}>
                            {userClan.name}
                          </Text>
                          <Text style={[styles.clanHubTag, { color: colors.accent }]}>
                            [{userClan.tag}]
                          </Text>
                        </View>
                        <Text style={[styles.clanHubDesc, { color: colors.textMuted }]} numberOfLines={2}>
                          {userClan.description}
                        </Text>
                      </View>
                    </View>

                    {/* 3-Col Stats Strip */}
                    <View style={[styles.clanHubStats, { borderColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)' }]}>
                      <View style={styles.clanHubStatCol}>
                        <Text style={[styles.clanHubStatNum, { color: colors.accent }]}>
                          #{userClan.globalRank || 1}
                        </Text>
                        <Text style={[styles.clanHubStatLabel, { color: colors.textMuted }]}>LEAGUE RANK</Text>
                      </View>
                      <View style={[styles.hubStatDivider, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)' }]} />
                      <View style={styles.clanHubStatCol}>
                        <Text style={[styles.clanHubStatNum, { color: colors.textPrimary }]}>
                          {userClan.seasonPr.toLocaleString()}
                        </Text>
                        <Text style={[styles.clanHubStatLabel, { color: colors.textMuted }]}>SEASON PR</Text>
                      </View>
                      <View style={[styles.hubStatDivider, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)' }]} />
                      <View style={styles.clanHubStatCol}>
                        <Text style={[styles.clanHubStatNum, { color: colors.textPrimary }]}>
                          {userClan.memberCount}
                        </Text>
                        <Text style={[styles.clanHubStatLabel, { color: colors.textMuted }]}>ATHLETES</Text>
                      </View>
                    </View>

                    {/* Invite Code Row */}
                    <View
                      style={[
                        styles.inviteCodeBox,
                        {
                          backgroundColor: isDark ? 'rgba(255, 255, 255, 0.02)' : '#F8FAFC',
                          borderColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)',
                        },
                      ]}
                    >
                      <View>
                        <Text style={[styles.inviteCodeLabel, { color: colors.textMuted }]}>INVITE CODE</Text>
                        <Text style={[styles.inviteCodeVal, { color: colors.textPrimary }]}>
                          {userClan.inviteCode}
                        </Text>
                      </View>
                      <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() => handleShareInvite(userClan)}
                        style={[styles.shareInviteBtn, { backgroundColor: colors.accent }]}
                      >
                        <Share2 size={12} color="#000000" />
                        <Text style={styles.shareInviteBtnText}>Share</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Clan Roster Leaderboard (Seamless Hairline Rows) */}
                  <View style={styles.rosterSection}>
                    <Text style={[styles.rosterSectionTitle, { color: colors.textMuted }]}>
                      CLAN ROSTER & CONTRIBUTIONS
                    </Text>

                    {(userClan.members && userClan.members.length > 0
                      ? userClan.members
                      : [
                          {
                            userId: user?.id || 'usr_me',
                            displayName: user?.displayName || 'You',
                            username: user?.username || 'athlete',
                            division: user?.currentDivision || 'BRONZE',
                            tier: user?.currentTier || 5,
                            role: 'LEADER' as const,
                            contributionPr: user?.currentPr || 0,
                            joinedAt: Date.now(),
                          },
                        ]
                    ).map((m, idx) => (
                      <View
                        key={m.userId}
                        style={[
                          styles.memberRow,
                          {
                            borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)',
                          },
                        ]}
                      >
                        <Text style={[styles.memberRankNum, { color: colors.textMuted }]}>#{idx + 1}</Text>
                        <View style={[styles.memberAvatar, { backgroundColor: isDark ? '#1C2333' : '#E2E8F0' }]}>
                          <Text style={[styles.memberAvatarText, { color: colors.textPrimary }]}>
                            {m.displayName.charAt(0).toUpperCase()}
                          </Text>
                        </View>
                        <View style={{ flex: 1, marginLeft: 10 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <Text style={[styles.memberName, { color: colors.textPrimary }]}>
                              {m.displayName}
                            </Text>
                            {m.role === 'LEADER' && (
                              <View style={[styles.leaderBadge, { backgroundColor: isDark ? 'rgba(204, 255, 0, 0.15)' : 'rgba(0, 82, 255, 0.12)' }]}>
                                <Text style={[styles.leaderBadgeText, { color: colors.accent }]}>LEADER</Text>
                              </View>
                            )}
                          </View>
                          <Text style={[styles.memberMeta, { color: colors.textMuted }]}>
                            @{m.username} • {m.division} T{m.tier}
                          </Text>
                        </View>

                        <View style={{ alignItems: 'flex-end' }}>
                          <Text style={[styles.memberPrVal, { color: colors.accent }]}>
                            +{m.contributionPr} PR
                          </Text>
                        </View>
                      </View>
                    ))}
                  </View>

                  {/* Leave Clan Action */}
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={handleLeaveClan}
                    style={styles.leaveClanBtn}
                  >
                    <LogOut size={13} color={colors.danger} />
                    <Text style={[styles.leaveClanText, { color: colors.danger }]}>Leave Clan</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                /* 2. CLAN RECRUITMENT & DIRECTORY (USER NOT IN A CLAN) */
                <View>
                  {/* Action Buttons Row */}
                  <View style={styles.clanActionsRow}>
                    <TouchableOpacity
                      activeOpacity={0.85}
                      onPress={() => setShowCreateClanModal(true)}
                      style={[styles.foundClanHeroBtn, { backgroundColor: colors.accent }]}
                    >
                      <Plus size={15} color="#000000" strokeWidth={2.8} />
                      <Text style={styles.foundClanHeroText}>FOUND A CLAN</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={() => setShowJoinClanModal(true)}
                      style={[
                        styles.joinCodeBtn,
                        {
                          backgroundColor: isDark ? '#141A22' : '#F1F5F9',
                          borderColor: colors.surfaceBorder,
                        },
                      ]}
                    >
                      <Users size={14} color={colors.textPrimary} />
                      <Text style={[styles.joinCodeBtnText, { color: colors.textPrimary }]}>
                        JOIN WITH CODE
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {/* Season League Banner */}
                  <View
                    style={[
                      styles.clanKickoffBox,
                      {
                        backgroundColor: isDark ? '#0D0D12' : '#FFFFFF',
                        borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
                      },
                    ]}
                  >
                    <Shield size={24} color={colors.accent} style={{ marginBottom: 8 }} />
                    <Text style={[styles.clanKickoffTitle, { color: colors.textPrimary }]}>
                      {season.name} Clan Circuit
                    </Text>
                    <Text style={[styles.clanKickoffDesc, { color: colors.textMuted }]}>
                      Team up with fellow athletes to pool Season PR. Founding or joining a clan unlocks Clan Rival ghost challenges and collective seasonal achievements.
                    </Text>
                  </View>

                  {/* Featured Clans Directory */}
                  <Text style={[styles.rosterSectionTitle, { color: colors.textMuted, marginTop: 16 }]}>
                    TOP CLANS THIS SEASON
                  </Text>

                  {allClans.map((clan, idx) => (
                    <View
                      key={clan.id}
                      style={[
                        styles.clanRowCard,
                        {
                          backgroundColor: isDark ? '#0D0D12' : '#FFFFFF',
                          borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
                        },
                      ]}
                    >
                      <View style={styles.clanHeader}>
                        <View
                          style={[
                            styles.clanBadgeIcon,
                            {
                              backgroundColor: isDark ? '#141A22' : '#F1F5F9',
                              borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
                            },
                          ]}
                        >
                          <Shield size={16} color={colors.accent} />
                        </View>
                        <View style={{ flex: 1, marginLeft: 10 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <Text style={[styles.clanName, { color: colors.textPrimary }]}>
                              {clan.name}
                            </Text>
                            <Text style={[styles.clanTagBadge, { color: colors.accent }]}>
                              [{clan.tag}]
                            </Text>
                          </View>
                          <Text style={[styles.clanTagline, { color: colors.textMuted }]} numberOfLines={1}>
                            {clan.description}
                          </Text>
                        </View>
                      </View>

                      <View style={[styles.clanStatsRow, { borderColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)' }]}>
                        <View style={styles.clanStatCol}>
                          <Text style={[styles.clanStatVal, { color: colors.textPrimary }]}>
                            #{clan.globalRank || idx + 1}
                          </Text>
                          <Text style={[styles.clanStatLabel, { color: colors.textMuted }]}>RANK</Text>
                        </View>
                        <View style={styles.clanStatCol}>
                          <Text style={[styles.clanStatVal, { color: colors.textPrimary }]}>
                            {clan.memberCount}
                          </Text>
                          <Text style={[styles.clanStatLabel, { color: colors.textMuted }]}>MEMBERS</Text>
                        </View>
                        <View style={styles.clanStatCol}>
                          <Text style={[styles.clanStatVal, { color: colors.accent }]}>
                            {clan.seasonPr.toLocaleString()}
                          </Text>
                          <Text style={[styles.clanStatLabel, { color: colors.textMuted }]}>PR</Text>
                        </View>

                        <TouchableOpacity
                          activeOpacity={0.8}
                          onPress={async () => {
                            if (!user) return;
                            const res = await ClanService.getInstance().joinClan(clan.inviteCode, user);
                            if (res.success && res.clan) {
                              setUserClan(res.clan);
                              loadClanData();
                              Alert.alert('Welcome!', `You joined [${res.clan.tag}] ${res.clan.name}!`);
                            }
                          }}
                          style={[
                            styles.cardJoinBtn,
                            {
                              backgroundColor: isDark ? 'rgba(204, 255, 0, 0.12)' : 'rgba(0, 82, 255, 0.10)',
                              borderColor: colors.accent,
                            },
                          ]}
                        >
                          <Text style={[styles.cardJoinBtnText, { color: colors.accent }]}>Join</Text>
                          <ArrowRight size={11} color={colors.accent} />
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </View>
              )
            )}

            {clanSubTab === 'LEADERBOARD' && (
              /* CLAN LEADERBOARD STANDINGS */
              <View style={styles.leaderboardStream}>
                <Text style={[styles.streamCategoryLabel, { color: colors.textMuted }]}>
                  SEASON 0 CLAN CIRCUIT STANDINGS
                </Text>

                {sortedClanLeaderboard.map((clan, idx) => {
                  const isUserClan = userClan?.id === clan.id;
                  const rank = clan.globalRank || idx + 1;
                  return (
                    <View
                      key={clan.id}
                      style={[
                        styles.leaderRow,
                        { borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)' },
                        isUserClan && [
                          styles.currentUserRow,
                          {
                            backgroundColor: isDark ? 'rgba(204, 255, 0, 0.04)' : '#EDF2F7',
                            borderLeftColor: colors.accent,
                          },
                        ],
                      ]}
                    >
                      <Text
                        style={[
                          styles.rankNumber,
                          rank === 1 && { color: colors.gold },
                          rank === 2 && { color: colors.silver },
                          rank === 3 && { color: colors.bronze },
                          isUserClan && { color: colors.accent, fontWeight: '900' },
                        ]}
                      >
                        #{rank}
                      </Text>
                      <View style={styles.clanLeaderInfo}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                          <Text
                            style={[
                              styles.leaderName,
                              { color: isUserClan ? colors.accent : colors.textPrimary },
                              isUserClan && { fontWeight: '700' },
                            ]}
                            numberOfLines={1}
                          >
                            {clan.name}
                          </Text>
                          <Text style={[styles.clanTagBadge, { color: colors.accent }]}>
                            [{clan.tag}]
                          </Text>
                          {isUserClan && (
                            <View style={[styles.yourClanPill, { backgroundColor: isDark ? 'rgba(204, 255, 0, 0.12)' : 'rgba(0, 82, 255, 0.12)', borderColor: colors.accent }]}>
                              <Text style={[styles.yourClanText, { color: colors.accent }]}>YOUR CLAN</Text>
                            </View>
                          )}
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 }}>
                          <Award size={10} color={colors.accent} />
                          <Text style={{ fontSize: 11, fontWeight: '700', color: colors.accent }} numberOfLines={1}>
                            {clan.equippedTitle || 'Centurion Syndicate'}
                          </Text>
                          <Text style={[styles.clanMetaSub, { color: colors.textMuted, marginTop: 0 }]}>
                            • {clan.memberCount} athletes
                          </Text>
                        </View>
                      </View>
                      <View style={{ alignItems: 'flex-end', marginLeft: 10, flexShrink: 0 }}>
                        <Text
                          style={[
                            styles.leaderPr,
                            { color: isUserClan ? colors.accent : colors.textSecondary },
                            isUserClan && { fontWeight: '700' },
                          ]}
                        >
                          {clan.seasonPr.toLocaleString()} PR
                        </Text>
                        {!userClan && (
                          <TouchableOpacity
                            activeOpacity={0.8}
                            onPress={async () => {
                              if (!user) return;
                              const res = await ClanService.getInstance().joinClan(clan.inviteCode, user);
                              if (res.success && res.clan) {
                                setUserClan(res.clan);
                                loadClanData();
                                Alert.alert('Welcome!', `You joined [${res.clan.tag}] ${res.clan.name}!`);
                              }
                            }}
                            style={[styles.quickJoinPill, { borderColor: colors.accent }]}
                          >
                            <Text style={[styles.quickJoinPillText, { color: colors.accent }]}>Join</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  );
                })}
              </View>
            )}

            {clanSubTab === 'HONORS' && (
              /* CLAN TITLES & ACHIEVEMENTS (CLEAN SEAMLESS ROWS) */
              <View>
                {/* 1. Clan Titles Section */}
                <View style={styles.honorsSection}>
                  <View style={styles.honorsHeaderRow}>
                    <Crown size={14} color={colors.gold} />
                    <Text style={[styles.streamCategoryLabel, { color: colors.gold, marginLeft: 6 }]}>
                      CLAN TITLES
                    </Text>
                  </View>
                  <Text style={[styles.honorsExplainer, { color: colors.textMuted }]}>
                    Prestige titles unlocked through syndicate milestones in Season 0.
                  </Text>

                  {(userClan?.titles || DEFAULT_CLAN_TITLES).map((title) => {
                    return (
                      <View
                        key={title.id}
                        style={[
                          styles.titleRow,
                          {
                            borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
                          },
                        ]}
                      >
                        <View style={{ flex: 1, paddingRight: 10 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <Text style={[styles.titleCardName, { color: colors.textPrimary }]}>
                              {title.title}
                            </Text>
                            {title.isEquipped ? (
                              <View style={[styles.equippedPill, { backgroundColor: isDark ? 'rgba(204, 255, 0, 0.12)' : 'rgba(0, 82, 255, 0.12)', borderColor: colors.accent }]}>
                                <Check size={9} color={colors.accent} />
                                <Text style={[styles.equippedPillText, { color: colors.accent }]}>EQUIPPED</Text>
                              </View>
                            ) : title.isUnlocked ? (
                              <View style={[styles.unlockedPill, { backgroundColor: 'rgba(52, 199, 89, 0.12)', borderColor: '#34C759' }]}>
                                <Text style={[styles.unlockedPillText, { color: '#34C759' }]}>UNLOCKED</Text>
                              </View>
                            ) : (
                              <View style={[styles.lockedPill, { borderColor: colors.surfaceBorder }]}>
                                <Lock size={9} color={colors.textMuted} />
                                <Text style={[styles.lockedPillText, { color: colors.textMuted }]}>LOCKED</Text>
                              </View>
                            )}
                          </View>
                          <Text style={[styles.titleCardDesc, { color: colors.textMuted }]}>
                            {title.description}
                          </Text>
                        </View>

                        {userClan && title.isUnlocked && !title.isEquipped && (
                          isUserClanLeader ? (
                            <TouchableOpacity
                              activeOpacity={0.8}
                              onPress={() => handleEquipTitle(title.id)}
                              style={[styles.equipBtn, { backgroundColor: colors.accent }]}
                            >
                              <Text style={styles.equipBtnText}>EQUIP</Text>
                            </TouchableOpacity>
                          ) : (
                            <View style={[styles.leaderOnlyBadge, { borderColor: colors.surfaceBorder }]}>
                              <Text style={[styles.leaderOnlyBadgeText, { color: colors.textMuted }]}>LEADER ONLY</Text>
                            </View>
                          )
                        )}
                      </View>
                    );
                  })}
                </View>

                {/* 2. Clan Achievements Section */}
                <View style={[styles.honorsSection, { marginTop: 16 }]}>
                  <View style={styles.honorsHeaderRow}>
                    <Trophy size={14} color={colors.accent} />
                    <Text style={[styles.streamCategoryLabel, { color: colors.accent, marginLeft: 6 }]}>
                      CLAN ACHIEVEMENTS
                    </Text>
                  </View>
                  <Text style={[styles.honorsExplainer, { color: colors.textMuted }]}>
                    Complete squad milestones to award bonus Season PR to the clan.
                  </Text>

                  {(userClan?.achievements || DEFAULT_CLAN_ACHIEVEMENTS).map((ach) => {
                    const percent = Math.min(100, Math.round((ach.progress / ach.target) * 100));
                    return (
                      <View
                        key={ach.id}
                        style={[
                          styles.achRow,
                          {
                            borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
                          },
                        ]}
                      >
                        <View style={styles.achHeaderRow}>
                          <View
                            style={[
                              styles.achIconBox,
                              {
                                backgroundColor: isDark ? '#141A22' : '#F1F5F9',
                                borderColor: ach.unlocked ? colors.accent : colors.surfaceBorder,
                              },
                            ]}
                          >
                            {ach.iconName === 'Crown' ? (
                              <Crown size={15} color={ach.unlocked ? colors.gold : colors.textMuted} />
                            ) : ach.iconName === 'Zap' ? (
                              <Zap size={15} color={ach.unlocked ? colors.accent : colors.textMuted} />
                            ) : ach.iconName === 'Shield' ? (
                              <Shield size={15} color={ach.unlocked ? colors.accent : colors.textMuted} />
                            ) : (
                              <Flame size={15} color={ach.unlocked ? colors.accent : colors.textMuted} />
                            )}
                          </View>
                          <View style={{ flex: 1, marginLeft: 10 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                              <Text style={[styles.achTitle, { color: colors.textPrimary }]}>{ach.title}</Text>
                              <Text style={[styles.achPointsBadge, { color: colors.accent }]}>
                                +{ach.points} PR
                              </Text>
                            </View>
                            <Text style={[styles.achDesc, { color: colors.textMuted }]}>{ach.description}</Text>

                            {/* Minimal Progress Bar */}
                            <View style={styles.achProgressTrack}>
                              <View
                                style={[
                                  styles.achProgressBar,
                                  {
                                    width: `${percent}%`,
                                    backgroundColor: ach.unlocked ? colors.accent : colors.gold,
                                  },
                                ]}
                              />
                            </View>
                            <View style={styles.achProgressMetaRow}>
                              <Text style={[styles.achProgressText, { color: colors.textMuted }]}>
                                {ach.progress.toLocaleString()} / {ach.target.toLocaleString()} {ach.category === 'MILEAGE' ? 'km' : ''}
                              </Text>
                              <Text style={[styles.achPercentText, { color: ach.unlocked ? colors.accent : colors.textSecondary }]}>
                                {ach.unlocked ? 'COMPLETED' : `${percent}%`}
                              </Text>
                            </View>
                          </View>
                        </View>
                      </View>
                    );
                  })}
                </View>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* Clan Modals */}
      <CreateClanModal
        visible={showCreateClanModal}
        onClose={() => setShowCreateClanModal(false)}
        onClanCreated={(newClan) => {
          setUserClan(newClan);
          loadClanData();
        }}
      />

      <JoinClanModal
        visible={showJoinClanModal}
        onClose={() => setShowJoinClanModal(false)}
        onClanJoined={(joinedClan) => {
          setUserClan(joinedClan);
          loadClanData();
        }}
      />

      {/* Zenith 100 Rules & Qualification Modal */}
      <InfoModal
        visible={showZenithInfo}
        onClose={() => setShowZenithInfo(false)}
        title="Zenith 100 Championship"
        subtitle="The Pinnacle of Athletic Excellence"
        badge="TIER 0 • TOP 100"
        accentColor={colors.gold}
        sections={[
          {
            title: 'What is Zenith 100?',
            content: 'Zenith 100 is the highest competitive tier in Performa, reserved exclusively for the top 100 verified athletes worldwide in each sport category.',
            bulletPoints: [
              'Exceeds Diamond tier rating requirements',
              'Dynamic live leaderboard ranking based on verified telemetry',
              'Worldwide recognition across the Performa network',
            ],
          },
          {
            title: 'Weekly UTC Rollover',
            content: 'Every Sunday at 23:59:59 UTC, standings are locked and evaluated. Athletes holding a top 100 position earn weekly crest honors and season qualification points.',
            bulletPoints: [
              `Next Evaluation: ${season.weeklyRolloverUtc.formattedCountdown}`,
              'Continuous anti-cheat audit on cadence, elevation, and speed anomalies',
            ],
          },
          {
            title: 'Season Rewards & Permanence',
            content: `Finishing in the Zenith 100 at the conclusion of ${season.name}: ${season.theme} permanently locks the Zenith Genesis Halo, exclusive Profile Frame, and title on your athlete record.`,
          },
        ]}
      />

      {/* Division Progression & PR Rules Modal */}
      <InfoModal
        visible={showDivisionInfo}
        onClose={() => setShowDivisionInfo(false)}
        title="Competitive Division Rules"
        subtitle="Season Progression, Ratings & Fair Play"
        badge="PR RATING PROTOCOL"
        accentColor={colors.accent}
        sections={[
          {
            title: 'Performance Rating (PR)',
            content: 'Your PR reflects true physiological fitness. It increases based on distance covered, moving pace standards, and verified GPS consistency.',
            bulletPoints: [
              'Tier 5 to Tier 1 within each Division',
              'Divisions: Bronze → Silver → Gold → Platinum → Diamond → Zenith',
              'Higher PR unlocks exclusive cosmetic frames and badges',
            ],
          },
          {
            title: 'Fair Play Verification',
            content: 'All sessions are verified against GPS spoofing, unnatural split accelerations, and sensor mismatches to maintain integrity across global divisions.',
          },
        ]}
      />

      {/* Athlete Profile Inspection Modal */}
      <AthleteProfileModal
        visible={!!selectedAthlete}
        onClose={() => setSelectedAthlete(null)}
        athlete={selectedAthlete}
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
  kickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerKicker: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  cloudBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  cloudText: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  seasonHeader: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.6,
    marginTop: 2,
  },
  seasonSub: {
    fontSize: 12,
    marginTop: 1,
  },
  zenithPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    gap: 6,
  },
  zenithText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  segmentedContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  tabFlow: {
    paddingTop: 8,
  },
  flowSection: {
    marginBottom: 8,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  progressComponent: {
    marginBottom: 12,
  },
  explainerText: {
    fontSize: 12,
    lineHeight: 18,
  },
  sectionDivider: {
    height: 1,
    marginVertical: 20,
  },
  infoQuestionBtn: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoQuestionText: {
    fontSize: 12,
    fontWeight: '900',
    lineHeight: 14,
  },
  zenithCompactCard: {
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: 'rgba(234, 179, 8, 0.35)',
    padding: 12,
    backgroundColor: 'rgba(234, 179, 8, 0.05)',
  },
  zenithSubtleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: RADIUS.md,
    borderWidth: 1,
  },
  zenithSubtleTitle: {
    fontSize: 10.5,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  zenithSubtleCountdown: {
    fontSize: 10,
    fontWeight: '700',
  },
  zenithSubtleSub: {
    fontSize: 11,
    lineHeight: 15,
    marginTop: 2,
    fontWeight: '500',
  },
  seasonRewardsCard: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: RADIUS.md,
    borderWidth: 1,
  },
  seasonRewardsTitle: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  seasonRewardsBody: {
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '500',
  },
  rulesMinimalBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  rulesMinimalText: {
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  seasonTierTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    borderWidth: 1,
  },
  seasonTierTagText: {
    fontSize: 9.5,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  // Podium Showcase Styles
  podiumStageSection: {
    marginBottom: 20,
    marginTop: 6,
  },
  podiumKickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    marginBottom: 14,
  },
  podiumKickerText: {
    fontSize: 10.5,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  podiumSubText: {
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  podiumStage: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 4,
  },
  podiumColumn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  podiumColumnElevated: {
    flex: 1.15,
    zIndex: 2,
  },
  podiumColumnPlaceholder: {
    flex: 1,
  },
  podiumAthleteCard: {
    alignItems: 'center',
    marginBottom: 8,
    width: '100%',
  },
  podiumMedalIconRow: {
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 2,
  },
  podiumAvatarRim: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  podiumAvatarGold: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2.5,
  },
  podiumAvatarText: {
    fontSize: 15,
    fontWeight: '900',
  },
  podiumRankTag: {
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: RADIUS.full,
    marginTop: -8,
    marginBottom: 4,
  },
  podiumRankTagText: {
    fontSize: 8.5,
    fontWeight: '900',
    color: '#000000',
    letterSpacing: 0.4,
  },
  podiumAthleteName: {
    fontSize: 11,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 3,
    paddingHorizontal: 2,
  },
  podiumPrVal: {
    fontSize: 11,
    fontWeight: '800',
    marginTop: 3,
    letterSpacing: -0.2,
  },
  pedestalBlock: {
    width: '100%',
    borderRadius: RADIUS.md,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    borderWidth: 1,
    borderBottomWidth: 0,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  pedestalSilver: {
    height: 96,
  },
  pedestalGold: {
    height: 126,
  },
  pedestalBronze: {
    height: 76,
  },
  pedestalTopCap: {
    width: '60%',
    height: 3,
    borderRadius: RADIUS.full,
    opacity: 0.8,
  },
  pedestalWatermark: {
    position: 'absolute',
    top: '18%',
    fontSize: 54,
    fontWeight: '900',
    lineHeight: 56,
  },
  pedestalPlaceLabel: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.0,
    zIndex: 1,
  },
  podiumStageFloor: {
    width: '100%',
    height: 2,
    borderRadius: RADIUS.full,
  },
  fieldHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
    marginBottom: 4,
  },
  fieldCountText: {
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  rankChip: {
    width: 32,
    height: 24,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  rankNumberText: {
    fontSize: 11,
    fontWeight: '800',
  },
  subSegmentRow: {
    marginBottom: 12,
  },
  leaderboardStream: {
    marginTop: 4,
  },
  streamCategoryLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    paddingVertical: 6,
  },
  leaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  currentUserRow: {
    paddingHorizontal: 10,
    borderRadius: RADIUS.sm,
    borderLeftWidth: 2,
  },
  rankNumber: {
    width: 38,
    fontSize: 13,
    fontWeight: '700',
  },
  leaderNameCol: {
    flex: 1,
    justifyContent: 'center',
    paddingRight: 8,
  },
  leaderName: {
    fontSize: 13,
    fontWeight: '700',
  },
  leaderBadgeCol: {
    width: 104,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  leaderPrCol: {
    minWidth: 68,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  leaderPr: {
    fontSize: 12.5,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  kickoffBanner: {
    alignItems: 'center',
    padding: 20,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    marginTop: 16,
  },
  kickoffTitle: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 4,
  },
  kickoffDesc: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
  clanRowCard: {
    borderRadius: RADIUS.md,
    borderWidth: 1,
    padding: 14,
    marginBottom: 12,
  },
  clanHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  clanBadgeIcon: {
    width: 38,
    height: 38,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clanName: {
    fontSize: 16,
    fontWeight: '700',
  },
  clanTagline: {
    fontSize: 12,
    marginTop: 2,
  },
  clanStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderTopWidth: 1,
  },
  clanStatCol: {
    flex: 1,
    alignItems: 'center',
  },
  clanStatVal: {
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  clanStatLabel: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1.0,
    marginTop: 2,
  },
  clanTagBadge: {
    fontSize: 11,
    fontWeight: '800',
  },
  clanKickoffBox: {
    alignItems: 'center',
    padding: 24,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    marginTop: 12,
  },
  clanKickoffTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 6,
  },
  clanKickoffDesc: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 8,
  },
  clanHubCard: {
    borderWidth: 1.5,
    borderRadius: RADIUS.lg,
    padding: 16,
    marginBottom: 16,
  },
  clanHubHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  clanHubBadge: {
    width: 46,
    height: 46,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clanHubName: {
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: -0.2,
  },
  clanHubTag: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  clanHubDesc: {
    fontSize: 11,
    fontStyle: 'italic',
    marginTop: 2,
  },
  clanHubStats: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    paddingVertical: 12,
    marginBottom: 14,
  },
  clanHubStatCol: {
    alignItems: 'center',
  },
  clanHubStatNum: {
    fontSize: 16,
    fontWeight: '900',
  },
  clanHubStatLabel: {
    fontSize: 8.5,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  hubStatDivider: {
    width: 1,
    height: 24,
  },
  inviteCodeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: RADIUS.md,
    borderWidth: 1,
  },
  inviteCodeLabel: {
    fontSize: 8.5,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  inviteCodeVal: {
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 1.5,
    marginTop: 2,
  },
  shareInviteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: RADIUS.md,
  },
  shareInviteBtnText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#000000',
  },
  rosterSection: {
    marginBottom: 16,
  },
  rosterSectionTitle: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 10,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  memberRankNum: {
    fontSize: 12,
    fontWeight: '800',
    width: 26,
  },
  memberAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberAvatarText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#000000',
  },
  memberName: {
    fontSize: 12,
    fontWeight: '800',
  },
  leaderBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: RADIUS.full,
  },
  leaderBadgeText: {
    fontSize: 8,
    fontWeight: '900',
    color: '#000000',
  },
  memberMeta: {
    fontSize: 10,
    marginTop: 2,
  },
  memberPrVal: {
    fontSize: 12,
    fontWeight: '800',
  },
  memberPrSub: {
    fontSize: 8.5,
    marginTop: 1,
  },
  leaveClanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    marginBottom: 20,
  },
  leaveClanText: {
    fontSize: 12,
    fontWeight: '800',
  },
  clanActionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  foundClanHeroBtn: {
    flex: 1.2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: RADIUS.md,
  },
  foundClanHeroText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#000000',
    letterSpacing: 0.5,
  },
  joinCodeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: RADIUS.md,
    borderWidth: 1,
  },
  joinCodeBtnText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  cardJoinBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.md,
    borderWidth: 1,
  },
  cardJoinBtnText: {
    fontSize: 11,
    fontWeight: '800',
  },
  equippedTitleRow: {
    marginBottom: 10,
  },
  equippedTitlePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 3.5,
    borderRadius: RADIUS.full,
    alignSelf: 'flex-start',
    borderWidth: 1,
  },
  equippedTitleText: {
    fontSize: 9.5,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  clanLeaderInfo: {
    flex: 1,
    marginLeft: 6,
  },
  clanMetaSub: {
    fontSize: 11,
    marginTop: 2,
  },
  yourClanPill: {
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: RADIUS.full,
    borderWidth: 1,
  },
  yourClanText: {
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  quickJoinPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    marginTop: 3,
  },
  quickJoinPillText: {
    fontSize: 10,
    fontWeight: '800',
  },
  honorsSection: {
    marginBottom: 12,
  },
  honorsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  honorsExplainer: {
    fontSize: 11.5,
    lineHeight: 16,
    marginBottom: 12,
  },
  titleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    marginBottom: 8,
  },
  titleCardName: {
    fontSize: 13,
    fontWeight: '800',
  },
  titleCardDesc: {
    fontSize: 11,
    marginTop: 2,
    lineHeight: 15,
  },
  equippedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: RADIUS.full,
    borderWidth: 1,
  },
  equippedPillText: {
    fontSize: 8.5,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  unlockedPill: {
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: RADIUS.full,
    borderWidth: 1,
  },
  unlockedPillText: {
    fontSize: 8.5,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  lockedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: RADIUS.full,
    borderWidth: 1,
  },
  lockedPillText: {
    fontSize: 8.5,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  equipBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.sm,
  },
  equipBtnText: {
    fontSize: 10.5,
    fontWeight: '900',
    color: '#000000',
  },
  achCard: {
    padding: 12,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    marginBottom: 10,
  },
  achRow: {
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  achHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  achIconBox: {
    width: 34,
    height: 34,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  achTitle: {
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 4,
  },
  achPointsBadge: {
    fontSize: 11,
    fontWeight: '800',
  },
  achDesc: {
    fontSize: 11,
    marginTop: 2,
    marginBottom: 10,
    lineHeight: 16,
  },
  achProgressTrack: {
    height: 5,
    borderRadius: 2.5,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
    marginBottom: 8,
  },
  achProgressBar: {
    height: '100%',
    borderRadius: 2.5,
  },
  achProgressMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  achProgressText: {
    fontSize: 10.5,
  },
  achPercentText: {
    fontSize: 10.5,
    fontWeight: '800',
  },
  leaderOnlyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
  },
  leaderOnlyBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  matrixCard: {
    borderRadius: RADIUS.md,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 4,
    marginBottom: 16,
  },
  matrixRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  matrixIconBox: {
    width: 28,
    height: 28,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  matrixRowTitle: {
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 3,
  },
  matrixRowDesc: {
    fontSize: 11,
    lineHeight: 15,
  },
});
