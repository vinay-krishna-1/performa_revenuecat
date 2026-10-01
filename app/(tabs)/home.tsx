import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Flame, ChevronRight, Activity, Cloud, CloudOff, RefreshCw, Sparkles, Heart } from 'lucide-react-native';
import { RADIUS } from '../../src/constants/theme';
import { useTheme } from '../../src/context/ThemeContext';
import { useAuth } from '../../src/features/auth/AuthContext';
import { PerformaButton, DivisionBadge, ScreenBackground, PlayerLevelBadge } from '../../src/components/common';
import { COSMETIC_IMAGES } from '../../src/constants/Cosmetics';
import { ActivitySummary } from '../../src/types';
import { SyncService, SyncStatusInfo } from '../../src/services/SyncService';
import { SeasonService } from '../../src/features/progression/SeasonService';

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { colors, isDark } = useTheme();

  const [syncInfo, setSyncInfo] = useState<SyncStatusInfo>(() => SyncService.getInstance().getStatusInfo());
  const [activities, setActivities] = useState<ActivitySummary[]>([]);
  const season = React.useMemo(() => SeasonService.getInstance().getCurrentSeason(), []);

  const loadActivities = React.useCallback(async () => {
    try {
      const all = await SyncService.getInstance().getAllActivities(user?.id);
      setActivities(all);
    } catch (e) {
      console.warn('[HomeScreen] Error loading activities:', e);
    }
  }, [user?.id]);

  useEffect(() => {
    loadActivities();
    const unsub = SyncService.getInstance().subscribe((info) => {
      setSyncInfo(info);
      loadActivities();
    });
    return unsub;
  }, [loadActivities]);

  // Compute weekly volume dynamically from activities in the last 7 days
  const weeklyMetrics = React.useMemo(() => {
    const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const recent = activities.filter((a) => a.startTime >= oneWeekAgo);

    const km = recent.reduce((sum, a) => sum + (a.distanceMeters || 0), 0) / 1000;
    const xp = recent.reduce((sum, a) => sum + (a.xpEarned || 0), 0);

    return {
      km: km.toFixed(1),
      sessions: recent.length,
      xp: xp.toLocaleString(),
      rawKm: km,
    };
  }, [activities]);

  const targetKm = 35.0;
  const progressPercent = Math.min(100, Math.round((weeklyMetrics.rawKm / targetKm) * 100));

  const bottomPadding = Math.max(insets.bottom, 16) + 72;

  return (
    <View style={[styles.screen, { backgroundColor: 'transparent', paddingTop: insets.top }]}>
      <ScreenBackground />
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomPadding }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Minimalist Header */}
        <View style={styles.header}>
          <View style={{ flex: 1, paddingRight: 8 }}>
            <View style={styles.kickerRow}>
              <Text style={[styles.kicker, { color: colors.textMuted }]}>PERFORMA</Text>
              {syncInfo.state === 'SYNCED' && (
                <View style={[styles.syncPill, { backgroundColor: isDark ? 'rgba(204, 255, 0, 0.08)' : 'rgba(0, 82, 255, 0.08)' }]}>
                  <Cloud size={9} color={colors.accent} />
                  <Text style={[styles.syncText, { color: colors.accent }]}>CLOUD</Text>
                </View>
              )}
              {syncInfo.state === 'SYNCING' && (
                <View style={[styles.syncPill, { backgroundColor: colors.surfaceBorder }]}>
                  <RefreshCw size={9} color={colors.textSecondary} />
                  <Text style={[styles.syncText, { color: colors.textSecondary }]}>SYNCING</Text>
                </View>
              )}
              {syncInfo.pendingCount > 0 && syncInfo.state !== 'SYNCING' && (
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => SyncService.getInstance().retrySync()}
                  style={[styles.syncPill, { backgroundColor: colors.surfaceBorder }]}
                >
                  <CloudOff size={9} color={colors.textMuted} />
                  <Text style={[styles.syncText, { color: colors.textMuted }]}>
                    {syncInfo.pendingCount} QUEUED
                  </Text>
                </TouchableOpacity>
              )}
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 }}>
              <Text style={[styles.athleteName, { color: colors.textPrimary, flexShrink: 1 }]} numberOfLines={1}>
                {user?.displayName || 'Athlete'}
              </Text>
              <View style={{ marginTop: 4 }}>
                <PlayerLevelBadge
                  level={user?.level || 1}
                  size="sm"
                  onPress={() => router.push('/(tabs)/me')}
                />
              </View>
            </View>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
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
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 6 }}>
                <Text style={{ color: colors.textMuted, fontWeight: '700', fontSize: 10, letterSpacing: 0.8 }}>
                  PRO
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Seamless Hero Telemetry: Direct on canvas (NO BOX) */}
        <View style={styles.heroSection}>
          <View style={styles.heroHeaderRow}>
            <Text style={[styles.sectionKicker, { color: colors.textMuted }]}>
              {season.name.toUpperCase()} • WEEK {season.currentWeek} ({season.daysRemaining}D REMAINING)
            </Text>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => router.push('/(tabs)/compete')}
              style={styles.rankingsLink}
            >
              <Text style={[styles.rankingsLinkText, { color: colors.textSecondary }]}>Rankings</Text>
              <ChevronRight size={13} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Large Hero Metric & Prominent Division Crest */}
          <View style={styles.heroMetricRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.heroPrNumber, { color: colors.textPrimary }]}>
                {(user?.currentPr || 0).toLocaleString()}
                <Text style={[styles.heroPrUnit, { color: colors.accent }]}> PR</Text>
              </Text>
              <Text style={[styles.heroSubKicker, { color: colors.textMuted }]}>
                {user?.rank ? `GLOBAL RANK #${user.rank}` : 'UNRANKED CONTENDER'} • {((user?.currentPr || 0) % 500)}/500 TO PROMO
              </Text>
            </View>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => router.push('/(tabs)/compete')}
              style={styles.heroDivisionContainer}
            >
              <DivisionBadge
                division={user?.currentDivision || 'BRONZE'}
                tier={user?.currentTier || 5}
                size="md"
              />
            </TouchableOpacity>
          </View>

          {/* Precision hairline progress track */}
          <View style={[styles.hairlineTrack, { backgroundColor: colors.surfaceBorder }]}>
            <View
              style={[
                styles.hairlineFill,
                {
                  width: `${Math.min(100, Math.max(5, Math.round(((user?.currentPr || 0) % 500) / 5)))}%`,
                  backgroundColor: colors.accent,
                },
              ]}
            />
          </View>
        </View>

        {/* Primary Action Button - Official Raster Button */}
        <TouchableOpacity
          activeOpacity={0.88}
          onPress={() => router.push('/(tabs)/record')}
          style={styles.rasterStartBtn}
          accessibilityRole="button"
          accessibilityLabel="Start Activity"
        >
          <Image
            source={COSMETIC_IMAGES.buttons.startActivity}
            style={styles.rasterStartBtnImg}
            resizeMode="contain"
          />
        </TouchableOpacity>

        {/* Seamless Weekly Volume Strip (Direct on Canvas, NO BOX) */}
        <View style={[styles.telemetryRow, { borderColor: colors.surfaceBorder }]}>
          <View style={styles.telemetryCol}>
            <Text style={[styles.telemetryNum, { color: colors.textPrimary }]}>{weeklyMetrics.km}</Text>
            <Text style={[styles.telemetrySub, { color: colors.textMuted }]}>KM LOGGED</Text>
          </View>
          <View style={[styles.telemetryVDivider, { backgroundColor: colors.surfaceBorder }]} />
          <View style={styles.telemetryCol}>
            <Text style={[styles.telemetryNum, { color: colors.textPrimary }]}>{weeklyMetrics.sessions}</Text>
            <Text style={[styles.telemetrySub, { color: colors.textMuted }]}>SESSIONS</Text>
          </View>
          <View style={[styles.telemetryVDivider, { backgroundColor: colors.surfaceBorder }]} />
          <View style={styles.telemetryCol}>
            <Text style={[styles.telemetryNum, { color: colors.textPrimary }]}>{weeklyMetrics.xp}</Text>
            <Text style={[styles.telemetrySub, { color: colors.textMuted }]}>XP EARNED</Text>
          </View>
        </View>

        {/* Streak & Consistency Bar: Fine hairline, zero bulk */}
        <View style={styles.streakRow}>
          <View style={styles.streakLeft}>
            <Activity size={14} color={colors.accent} />
            <Text style={[styles.streakText, { color: colors.accent }]}>
              {user?.streakWeeks || 0}-WEEK STREAK • {weeklyMetrics.sessions} SESSIONS
            </Text>
          </View>
          <Text style={[styles.streakHint, { color: colors.textMuted }]}>Recovery protects PR</Text>
        </View>

        {/* Subtle Athletic Care & Restorative Reminder */}
        <View style={styles.carePulseRow}>
          <Heart size={10} color={colors.accent} />
          <Text style={[styles.carePulseText, { color: colors.textMuted }]}>
            {weeklyMetrics.sessions >= 4
              ? 'Strong weekly volume • Rest days build champions just as much as miles.'
              : 'Pace with intention • Healthy consistency protects your long-term cardiac longevity.'}
          </Text>
        </View>

        <View style={[styles.sectionDivider, { backgroundColor: colors.divider }]} />

        {/* Seamless Objectives Stream (NO BOX) */}
        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.streamTitle, { color: colors.textMuted }]}>ACTIVE OBJECTIVES</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/compete')}>
            <Text style={[styles.streamAction, { color: colors.textSecondary }]}>{season.name}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.streamList}>
          <View style={styles.streamItem}>
            <View style={styles.streamItemTop}>
              <Text style={[styles.streamItemTitle, { color: colors.textPrimary }]}>Weekly Distance Threshold</Text>
              <Text style={[styles.streamItemReward, { color: colors.accent }]}>+250 XP</Text>
            </View>
            <Text style={[styles.streamItemSubtitle, { color: colors.textSecondary }]}>
              Log 35.0 km across qualifying sessions
            </Text>
            <View style={[styles.streamItemTrack, { backgroundColor: colors.surfaceBorder }]}>
              <View style={[styles.streamItemFill, { width: `${progressPercent}%`, backgroundColor: colors.accent }]} />
            </View>
            <Text style={[styles.streamItemProgress, { color: colors.textMuted }]}>
              {weeklyMetrics.km} / {targetKm.toFixed(1)} km ({progressPercent}%)
            </Text>
          </View>

          <View style={[styles.rowDivider, { backgroundColor: colors.divider }]} />

          <View style={styles.streamItem}>
            <View style={styles.streamItemTop}>
              <Text style={[styles.streamItemTitle, { color: colors.textPrimary }]}>Ghost Match Sprint</Text>
              <Text style={[styles.streamItemReward, { color: colors.accent }]}>+180 XP</Text>
            </View>
            <Text style={[styles.streamItemSubtitle, { color: colors.textSecondary }]}>
              Defeat 1 community ghost attempt
            </Text>
            <View style={[styles.streamItemTrack, { backgroundColor: colors.surfaceBorder }]}>
              <View style={[styles.streamItemFill, { width: '0%', backgroundColor: colors.accent }]} />
            </View>
            <Text style={[styles.streamItemProgress, { color: colors.textMuted }]}>0 / 1 completed</Text>
          </View>
        </View>

        <View style={[styles.sectionDivider, { backgroundColor: colors.divider }]} />

        {/* Seamless Recent Activity / Season Stream */}
        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.streamTitle, { color: colors.textMuted }]}>
            {activities.length > 0 ? 'LATEST TELEMETRY' : 'SEASON 0: GENESIS HORIZON BRIEFING'}
          </Text>
        </View>

        <View style={styles.streamList}>
          {activities.length > 0 ? (
            <View style={styles.feedRow}>
              <View style={styles.feedContent}>
                <Text style={[styles.feedText, { color: colors.textSecondary }]}>
                  <Text style={{ fontWeight: '700', color: colors.textPrimary }}>You</Text> logged{' '}
                  <Text style={{ fontWeight: '700', color: colors.accent }}>
                    {(activities[0].distanceMeters / 1000).toFixed(2)} km {activities[0].type}
                  </Text>{' '}
                  (+{activities[0].prEarned} PR)
                </Text>
                <Text style={[styles.feedTimestamp, { color: colors.textMuted }]}>
                  {new Date(activities[0].startTime).toLocaleDateString([], { month: 'short', day: 'numeric' })} • Verified GPS session
                </Text>
              </View>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() =>
                  router.push({
                    pathname: '/activity/[id]',
                    params: { id: activities[0].id, data: JSON.stringify(activities[0]) },
                  })
                }
                style={[
                  styles.actionGhostPill,
                  {
                    backgroundColor: isDark ? '#0D0D10' : '#FFFFFF',
                    borderColor: colors.surfaceBorder,
                  },
                ]}
              >
                <Text style={[styles.actionGhostText, { color: colors.textPrimary }]}>VIEW</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.feedRow}>
              <View style={styles.feedContent}>
                <Text style={[styles.feedText, { color: colors.textSecondary }]}>
                  <Text style={{ fontWeight: '700', color: colors.textPrimary }}>Season 0: Genesis Horizon</Text> is active! Complete your first verified run to establish division standing.
                </Text>
                <Text style={[styles.feedTimestamp, { color: colors.textMuted }]}>
                  {season.daysRemaining} days remaining in this season cycle
                </Text>
              </View>
            </View>
          )}
        </View>
      </ScrollView>
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
    paddingBottom: 24,
  },
  kickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  kicker: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  syncPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
  },
  syncText: {
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  athleteName: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginTop: 2,
  },
  profileBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    gap: 6,
  },
  voltDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  profileBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  heroSection: {
    paddingBottom: 8,
  },
  heroHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionKicker: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  rankingsLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  rankingsLinkText: {
    fontSize: 12,
    fontWeight: '600',
  },
  heroMetricRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 10,
    marginBottom: 12,
  },
  heroPrNumber: {
    fontSize: 54,
    fontWeight: '800',
    letterSpacing: -2,
  },
  heroPrUnit: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  heroSubKicker: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginTop: 2,
  },
  heroDivisionContainer: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingLeft: 12,
  },
  hairlineTrack: {
    height: 3,
    borderRadius: 1.5,
    overflow: 'hidden',
    marginBottom: 10,
  },
  hairlineFill: {
    height: '100%',
    borderRadius: 1.5,
  },
  heroMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metaSub: {
    fontSize: 12,
    fontWeight: '500',
  },
  ctaButton: {
    marginBottom: 28,
  },
  rasterStartBtn: {
    width: '100%',
    height: 72,
    marginTop: 8,
    marginBottom: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rasterStartBtnImg: {
    width: '100%',
    height: '100%',
  },
  telemetryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderBottomWidth: 1,
  },
  telemetryCol: {
    flex: 1,
    alignItems: 'center',
  },
  telemetryNum: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.6,
  },
  telemetrySub: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1.0,
    marginTop: 2,
  },
  telemetryVDivider: {
    width: 1,
    height: 24,
  },
  streakRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  streakLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  streakText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  streakHint: {
    fontSize: 11,
  },
  carePulseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: 4,
    paddingBottom: 2,
  },
  carePulseText: {
    fontSize: 11,
    lineHeight: 15,
    flex: 1,
  },
  sectionDivider: {
    height: 1,
    marginVertical: 16,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  streamTitle: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  streamAction: {
    fontSize: 11,
    fontWeight: '600',
  },
  streamList: {},
  streamItem: {
    paddingVertical: 10,
  },
  streamItemTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  streamItemTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  streamItemReward: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  streamItemSubtitle: {
    fontSize: 12,
    marginTop: 2,
    marginBottom: 8,
  },
  streamItemTrack: {
    height: 2,
    borderRadius: 1,
    overflow: 'hidden',
  },
  streamItemFill: {
    height: '100%',
  },
  streamItemProgress: {
    fontSize: 10,
    marginTop: 4,
    fontWeight: '600',
  },
  rowDivider: {
    height: 1,
    marginVertical: 6,
  },
  feedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  feedContent: {
    flex: 1,
    paddingRight: 12,
  },
  feedText: {
    fontSize: 13,
    lineHeight: 18,
  },
  feedTimestamp: {
    fontSize: 11,
    marginTop: 2,
  },
  actionGhostPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.full,
    borderWidth: 1,
  },
  actionGhostText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.0,
  },
});
