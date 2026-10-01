import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Share, TextInput, Modal, TouchableOpacity, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Award,
  Share2,
  Check,
  BookmarkPlus,
  X,
  MapPin,
  Cloud,
  CloudOff,
  RefreshCw,
  Trash2,
  Zap,
  Flame,
  Activity as ActivityIcon,
  TrendingUp,
  Edit3,
} from 'lucide-react-native';
import { RADIUS } from '../../src/constants/theme';
import { useTheme } from '../../src/context/ThemeContext';
import { ActivitySummary, RoutePrivacyMode } from '../../src/types';
import { ActivityMap } from '../../src/components/maps/ActivityMap';
import { RecordingService } from '../../src/features/recording/RecordingService';
import {
  PerformaButton,
  DivisionBadge,
  RouteElevationProfile,
} from '../../src/components/common';
import { RouteService } from '../../src/features/routes/RouteService';
import { SyncService, SyncStatusInfo } from '../../src/services/SyncService';
import { useAuth } from '../../src/features/auth/AuthContext';
import { SessionCardShareModal } from '../../src/components/activity/SessionCardShareModal';
import { FriendService } from '../../src/features/social/FriendService';
import { ActivityPrivacyModal } from '../../src/components/activities/ActivityPrivacyModal';
import { ActivitySplitsBarChart } from '../../src/components/activity/ActivitySplitsBarChart';
import { Shield, EyeOff, Globe } from 'lucide-react-native';

export default function ActivityResultScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { user } = useAuth();
  const params = useLocalSearchParams<{ id: string; data?: string }>();

  const [showSaveRouteModal, setShowSaveRouteModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showPerformanceCardModal, setShowPerformanceCardModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [privacyMode, setPrivacyMode] = useState<RoutePrivacyMode>('FULL');
  const [isDeleting, setIsDeleting] = useState(false);

  const [routeName, setRouteName] = useState('');
  const [isSavedAsRoute, setIsSavedAsRoute] = useState(false);
  const [syncInfo, setSyncInfo] = useState<SyncStatusInfo>(() => SyncService.getInstance().getStatusInfo());

  React.useEffect(() => {
    const unsub = SyncService.getInstance().subscribe((info) => {
      setSyncInfo(info);
    });
    return unsub;
  }, []);

  let summary: ActivitySummary | null = null;
  if (params.data) {
    try {
      summary = JSON.parse(params.data);
    } catch (e) {
      console.error('Failed to parse activity data:', e);
    }
  }

  const activity: ActivitySummary = summary || {
    id: params.id || 'act_demo_01',
    userId: user?.id || 'usr_001',
    type: 'RUN',
    startTime: Date.now() - 2142000,
    endTime: Date.now(),
    elapsedSeconds: 2142,
    movingSeconds: 2142,
    distanceMeters: 6840,
    avgPaceSecondsPerKm: 313,
    bestPaceSecondsPerKm: 288,
    avgSpeedMps: 3.19,
    maxSpeedMps: 3.8,
    elevationGainMeters: 42,
    elevationLossMeters: 38,
    xpEarned: 284,
    prEarned: 42,
    routeCoordinates: [
      { latitude: 37.7749, longitude: -122.4194 },
      { latitude: 37.7780, longitude: -122.4170 },
      { latitude: 37.7810, longitude: -122.4140 },
      { latitude: 37.7840, longitude: -122.4110 },
      { latitude: 37.7870, longitude: -122.4080 },
    ],
    splits: [
      { splitNumber: 1, distanceMeters: 1000, elapsedSeconds: 318, paceSecondsPerKm: 318, elevationGainMeters: 6 },
      { splitNumber: 2, distanceMeters: 1000, elapsedSeconds: 312, paceSecondsPerKm: 312, elevationGainMeters: 8 },
      { splitNumber: 3, distanceMeters: 1000, elapsedSeconds: 315, paceSecondsPerKm: 315, elevationGainMeters: 12 },
      { splitNumber: 4, distanceMeters: 1000, elapsedSeconds: 308, paceSecondsPerKm: 308, elevationGainMeters: 4 },
      { splitNumber: 5, distanceMeters: 1000, elapsedSeconds: 310, paceSecondsPerKm: 310, elevationGainMeters: 5 },
      { splitNumber: 6, distanceMeters: 1000, elapsedSeconds: 314, paceSecondsPerKm: 314, elevationGainMeters: 7 },
    ],
    verificationStatus: 'VERIFIED',
    qualityScore: 98,
    isNewPb: true,
    pbLabel: '5K',
  };

  const defaultTitle = activity.title || `${activity.type === 'CYCLE' ? 'Cycling' : activity.type === 'WALK' ? 'Walking' : 'Running'} Session`;
  const [sessionTitle, setSessionTitle] = useState(defaultTitle);
  const [sessionDescription, setSessionDescription] = useState(activity.description || '');
  const [isSavingMetadata, setIsSavingMetadata] = useState(false);
  const [savedFeedback, setSavedFeedback] = useState(false);

  const handleSaveMetadata = async () => {
    setIsSavingMetadata(true);
    try {
      const cleanTitle = sessionTitle.trim() || defaultTitle;
      const cleanDesc = sessionDescription.trim();
      activity.title = cleanTitle;
      activity.description = cleanDesc;
      await SyncService.getInstance().updateActivity(activity.id, {
        title: cleanTitle,
        description: cleanDesc,
      });
      setSavedFeedback(true);
      setTimeout(() => setSavedFeedback(false), 2500);
    } catch (err) {
      console.warn('Failed to update activity metadata:', err);
    } finally {
      setIsSavingMetadata(false);
    }
  };

  const formatPace = (paceSec: number) => {
    const m = Math.floor(paceSec / 60);
    const s = paceSec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const formatTime = (totalSec: number) => {
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Advanced Athletic Analytics & Insights Computation
  const analytics = useMemo(() => {
    const km = activity.distanceMeters / 1000;
    // Estimated calories: running ~68 kcal/km + elevation demand
    const calories = Math.round(km * 68 + activity.elevationGainMeters * 0.4);

    // Splits pacing variance and consistency score
    let consistencyScore = 95;
    let fastestSplit = activity.splits[0];
    let slowestSplit = activity.splits[0];

    if (activity.splits.length > 1) {
      const paces = activity.splits.map((s) => s.paceSecondsPerKm);
      const avg = paces.reduce((a, b) => a + b, 0) / paces.length;
      const variance = paces.reduce((acc, p) => acc + Math.pow(p - avg, 2), 0) / paces.length;
      const stdDev = Math.sqrt(variance);

      // 0-10s stdDev -> 98-90% consistency
      consistencyScore = Math.max(65, Math.min(99, Math.round(100 - (stdDev / avg) * 85)));

      activity.splits.forEach((s) => {
        if (!fastestSplit || s.paceSecondsPerKm < fastestSplit.paceSecondsPerKm) fastestSplit = s;
        if (!slowestSplit || s.paceSecondsPerKm > slowestSplit.paceSecondsPerKm) slowestSplit = s;
      });
    }

    // Aerobic Training Load Estimation (1.0 to 5.0)
    let trainingLoad = '3.4';
    let loadDescription = 'Aerobic Base & Threshold Development';
    if (km < 3) {
      trainingLoad = '2.1';
      loadDescription = 'Active Recovery & Neural Activation';
    } else if (km > 10) {
      trainingLoad = '4.5';
      loadDescription = 'High Endurance Overload & Capillary Expansion';
    }

    return {
      calories,
      consistencyScore,
      fastestSplit,
      slowestSplit,
      trainingLoad,
      loadDescription,
    };
  }, [activity]);

  React.useEffect(() => {
    FriendService.getInstance().getActivityPrivacyMode(activity.id).then(setPrivacyMode);
  }, [activity.id]);

  const handleSavePrivacy = async (mode: RoutePrivacyMode, applyToAll: boolean) => {
    setPrivacyMode(mode);
    await FriendService.getInstance().setActivityPrivacyMode(activity.id, mode);
    if (applyToAll) {
      await FriendService.getInstance().setGlobalRoutePrivacyMode(mode, true, [activity.id]);
    }
  };

  const handleShare = async () => {

    try {
      await Share.share({
        message: `Completed ${(activity.distanceMeters / 1000).toFixed(2)} km ${activity.type} in ${formatTime(activity.movingSeconds)} with PERFORMA. +${activity.xpEarned} XP • +${activity.prEarned} PR`,
      });
    } catch (e) {
      console.error('Share error:', e);
    }
  };

  const handleDeleteActivity = async () => {
    setIsDeleting(true);
    try {
      const ok = await SyncService.getInstance().deleteActivity(activity.id);
      setShowDeleteModal(false);
      if (ok) {
        RecordingService.getInstance().reset();
        router.replace('/(tabs)/me');
      } else {
        Alert.alert('Error', 'Could not delete activity. Please try again.');
      }
    } catch (err) {
      console.error('Delete error:', err);
      Alert.alert('Error', 'Failed to delete activity.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background, paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.celebrationHeader}>
          <View style={styles.headerKickerRow}>
            <Text style={[styles.kicker, { color: colors.textMuted }]}>SESSION TELEMETRY</Text>
            {syncInfo.state === 'SYNCED' && (
              <View style={[styles.syncBadge, { backgroundColor: isDark ? 'rgba(204, 255, 0, 0.1)' : 'rgba(0, 82, 255, 0.1)' }]}>
                <Cloud size={10} color={colors.accent} />
                <Text style={[styles.syncBadgeText, { color: colors.accent }]}>CLOUD BACKED</Text>
              </View>
            )}
            {syncInfo.state === 'SYNCING' && (
              <View style={[styles.syncBadge, { backgroundColor: colors.surfaceBorder }]}>
                <RefreshCw size={10} color={colors.textSecondary} />
                <Text style={[styles.syncBadgeText, { color: colors.textSecondary }]}>SYNCING...</Text>
              </View>
            )}
            {(syncInfo.state === 'OFFLINE' || syncInfo.state === 'ERROR' || syncInfo.state === 'IDLE') && (
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => SyncService.getInstance().retrySync()}
                style={[styles.syncBadge, { backgroundColor: colors.surfaceBorder }]}
              >
                <CloudOff size={10} color={colors.textMuted} />
                <Text style={[styles.syncBadgeText, { color: colors.textMuted }]}>LOCAL • RETRY</Text>
              </TouchableOpacity>
            )}
          </View>
          <Text style={[styles.title, { color: colors.textPrimary }]}>Activity Complete</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Verified & recorded to Season 0: Genesis Horizon</Text>
        </View>

        {/* New PB Callout */}
        {activity.isNewPb && (
          <View
            style={[
              styles.pbBanner,
              {
                backgroundColor: isDark ? 'rgba(234, 179, 8, 0.08)' : 'rgba(217, 119, 6, 0.08)',
                borderColor: isDark ? 'rgba(234, 179, 8, 0.25)' : 'rgba(217, 119, 6, 0.25)',
              },
            ]}
          >
            <Award size={15} color={colors.gold} />
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={[styles.pbTitle, { color: colors.gold }]}>NEW PERSONAL BEST • {activity.pbLabel || '5K'}</Text>
              <Text style={[styles.pbTime, { color: colors.textSecondary }]}>Verified season personal best recorded.</Text>
            </View>
          </View>
        )}

        {/* Mode Recognition Banner: Ranked Non-Stop vs Casual */}
        <View
          style={[
            styles.modeBanner,
            {
              backgroundColor:
                activity.recordingMode === 'CASUAL'
                  ? isDark ? 'rgba(255, 255, 255, 0.04)' : '#F1F5F9'
                  : isDark ? 'rgba(204, 255, 0, 0.08)' : 'rgba(0, 82, 255, 0.08)',
              borderColor:
                activity.recordingMode === 'CASUAL'
                  ? colors.surfaceBorder
                  : colors.accent,
            },
          ]}
        >
          {activity.recordingMode === 'CASUAL' ? (
            <>
              <Text style={{ fontSize: 15 }}>☕</Text>
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={[styles.modeBannerTitle, { color: colors.textPrimary }]}>
                  CASUAL MODE • FLEXIBLE EFFORT
                </Text>
                <Text style={[styles.modeBannerDesc, { color: colors.textSecondary }]}>
                  Pauses were permitted during this activity. +{activity.xpEarned} Lifetime XP awarded (0 Division PR).
                </Text>
              </View>
            </>
          ) : (
            <>
              <Zap size={16} color={colors.accent} />
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={[styles.modeBannerTitle, { color: colors.accent }]}>
                  ⚡ RANKED • NON-STOP EFFORT
                </Text>
                <Text style={[styles.modeBannerDesc, { color: colors.textSecondary }]}>
                  Continuous verified effort. No pauses permitted. +{activity.prEarned} Division PR awarded.
                </Text>
              </View>
            </>
          )}
        </View>

        {/* Rewards Flow */}
        <View style={styles.rewardsSection}>
          <View style={[styles.rewardsRow, { borderColor: colors.surfaceBorder }]}>
            <View style={styles.rewardCol}>
              <Text style={[styles.rewardVal, { color: colors.textPrimary }]}>+{activity.xpEarned}</Text>
              <Text style={[styles.rewardLabel, { color: colors.textMuted }]}>LIFETIME XP</Text>
            </View>

            <View style={[styles.rewardVDivider, { backgroundColor: colors.surfaceBorder }]} />

            <View style={styles.rewardCol}>
              <Text
                style={[
                  styles.rewardVal,
                  { color: activity.recordingMode === 'CASUAL' ? colors.textMuted : colors.accent },
                ]}
              >
                +{activity.prEarned}
              </Text>
              <Text style={[styles.rewardLabel, { color: colors.textMuted }]}>
                {activity.recordingMode === 'CASUAL' ? 'CASUAL (0 PR)' : 'SEASON PR'}
              </Text>
            </View>
          </View>

          {/* Division Rank Shift */}
          <View style={styles.rankShiftRow}>
            <DivisionBadge division={user?.currentDivision || 'BRONZE'} tier={user?.currentTier || 5} size="sm" />
            <Text style={[styles.rankChangeText, { color: colors.textSecondary }]}>
              Division: <Text style={{ color: colors.textPrimary, fontWeight: '700' }}>{user?.currentDivision || 'BRONZE'} Tier {user?.currentTier || 5}</Text> •{' '}
              <Text style={{ color: colors.accent, fontWeight: '800' }}>
                {user ? `${user.currentPr} PR` : `+${activity.prEarned} PR`}
              </Text>
            </Text>
          </View>
        </View>

        {/* Session Name & Description Customizer */}
        <View
          style={[
            styles.sessionMetaCard,
            {
              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : '#FFFFFF',
              borderColor: colors.surfaceBorder,
            },
          ]}
        >
          <View style={styles.metaCardHeaderRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Edit3 size={13} color={colors.accent} />
              <Text style={[styles.metaCardKicker, { color: colors.textMuted }]}>
                SESSION IDENTITY & NOTES
              </Text>
            </View>
            {savedFeedback && (
              <View style={[styles.savedPill, { backgroundColor: isDark ? 'rgba(204, 255, 0, 0.12)' : 'rgba(0, 82, 255, 0.1)' }]}>
                <Check size={11} color={colors.accent} strokeWidth={3} />
                <Text style={[styles.savedPillText, { color: colors.accent }]}>SAVED</Text>
              </View>
            )}
          </View>

          <View style={styles.metaInputGroup}>
            <Text style={[styles.metaFieldLabel, { color: colors.textMuted }]}>ACTIVITY TITLE</Text>
            <TextInput
              style={[
                styles.metaTitleInput,
                {
                  color: colors.textPrimary,
                  backgroundColor: isDark ? '#0D0E12' : '#F8FAFC',
                  borderColor: colors.surfaceBorder,
                },
              ]}
              value={sessionTitle}
              onChangeText={setSessionTitle}
              onBlur={handleSaveMetadata}
              placeholder="Name your workout (e.g. Morning 5K Pace Run)"
              placeholderTextColor={colors.textMuted}
              maxLength={60}
            />
          </View>

          <View style={[styles.metaInputGroup, { marginBottom: 10 }]}>
            <Text style={[styles.metaFieldLabel, { color: colors.textMuted }]}>DESCRIPTION & NOTES</Text>
            <TextInput
              style={[
                styles.metaDescInput,
                {
                  color: colors.textPrimary,
                  backgroundColor: isDark ? '#0D0E12' : '#F8FAFC',
                  borderColor: colors.surfaceBorder,
                },
              ]}
              value={sessionDescription}
              onChangeText={setSessionDescription}
              onBlur={handleSaveMetadata}
              placeholder="How did the session feel? Log terrain, weather, heart rate or gear..."
              placeholderTextColor={colors.textMuted}
              multiline
              numberOfLines={3}
              maxLength={300}
              textAlignVertical="top"
            />
          </View>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleSaveMetadata}
            disabled={isSavingMetadata}
            style={[
              styles.metaSaveBtn,
              {
                backgroundColor: isDark ? 'rgba(204, 255, 0, 0.12)' : 'rgba(0, 82, 255, 0.1)',
                borderColor: colors.accent,
              },
            ]}
          >
            <Check size={13} color={colors.accent} strokeWidth={2.5} />
            <Text style={[styles.metaSaveBtnText, { color: colors.accent }]}>
              {savedFeedback ? 'SAVED TO CLOUD & LOG' : 'SAVE SESSION DETAILS'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.sectionDivider, { backgroundColor: colors.divider }]} />

        {/* Core Metrics Row */}
        <View style={styles.metricsStrip}>
          <View style={styles.metricStripItem}>
            <Text style={[styles.metricValText, { color: colors.textPrimary }]}>
              {(activity.distanceMeters / 1000).toFixed(2)}
            </Text>
            <Text style={[styles.metricSubText, { color: colors.textMuted }]}>KM</Text>
          </View>
          <View style={[styles.stripDivider, { backgroundColor: colors.surfaceBorder }]} />
          <View style={styles.metricStripItem}>
            <Text style={[styles.metricValText, { color: colors.textPrimary }]}>
              {formatTime(activity.movingSeconds)}
            </Text>
            <Text style={[styles.metricSubText, { color: colors.textMuted }]}>DURATION</Text>
          </View>
          <View style={[styles.stripDivider, { backgroundColor: colors.surfaceBorder }]} />
          <View style={styles.metricStripItem}>
            <Text style={[styles.metricValText, { color: colors.accent }]}>
              {formatPace(activity.avgPaceSecondsPerKm)}
            </Text>
            <Text style={[styles.metricSubText, { color: colors.textMuted }]}>AVG PACE</Text>
          </View>
          <View style={[styles.stripDivider, { backgroundColor: colors.surfaceBorder }]} />
          <View style={styles.metricStripItem}>
            <Text style={[styles.metricValText, { color: colors.textPrimary }]}>+{activity.elevationGainMeters}m</Text>
            <Text style={[styles.metricSubText, { color: colors.textMuted }]}>ELEV</Text>
          </View>
        </View>

        <View style={[styles.sectionDivider, { backgroundColor: colors.divider }]} />

        {/* Map Header with Interactive Privacy Toggle */}
        <View style={styles.mapHeaderRow}>
          <Text style={[styles.mapHeaderTitle, { color: colors.textMuted }]}>
            ROUTE MAP • {privacyMode === 'FULL' ? 'PUBLIC' : privacyMode === 'SILHOUETTE_ONLY' ? 'SILHOUETTE' : 'HIDDEN'}
          </Text>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setShowPrivacyModal(true)}
            style={[
              styles.privacyEditBtn,
              {
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)',
                borderColor: colors.surfaceBorder,
              },
            ]}
          >
            <Shield size={10} color={colors.accent} />
            <Text style={[styles.privacyEditBtnText, { color: colors.textPrimary }]}>
              {privacyMode === 'FULL' ? 'Public' : privacyMode === 'SILHOUETTE_ONLY' ? 'Silhouette' : 'Hidden'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Map Preview or Stealth Hidden Box */}
        {privacyMode === 'HIDDEN' ? (
          <View style={[styles.hiddenMapBox, { borderColor: colors.surfaceBorder, backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : '#F8FAFC' }]}>
            <EyeOff size={24} color={colors.textMuted} style={{ marginBottom: 6 }} />
            <Text style={[styles.hiddenMapTitle, { color: colors.textPrimary }]}>Map Display Hidden</Text>
            <Text style={[styles.hiddenMapDesc, { color: colors.textMuted }]}>
              GPS coordinates are protected under stealth mode. Pacing metrics and splits remain intact.
            </Text>
          </View>
        ) : (
          <View style={[styles.mapBox, { borderColor: colors.surfaceBorder }]}>
            <ActivityMap
              coordinates={activity.routeCoordinates}
              gpsQuality="EXCELLENT"
              showStartFinishPins={privacyMode !== 'SILHOUETTE_ONLY'}
              followUser={false}
              interactive={true}
              style={{ height: 220 }}
            />
          </View>
        )}


        {/* Course Elevation Profile (Real Elevation & Topography) */}
        <RouteElevationProfile
          distanceMeters={activity.distanceMeters}
          elevationGainMeters={activity.elevationGainMeters}
          coordinates={activity.routeCoordinates}
          showCursor={false}
          style={{ marginBottom: 14 }}
        />

        {/* Advanced Athletic Insights Section */}
        <View style={styles.insightsSection}>
          <View style={styles.insightsHeader}>
            <ActivityIcon size={14} color={colors.accent} />
            <Text style={[styles.insightsTitle, { color: colors.textMuted }]}>PERFORMANCE INSIGHTS</Text>
          </View>

          <View style={[styles.insightsCard, { backgroundColor: isDark ? '#0D0D10' : '#FFFFFF', borderColor: colors.surfaceBorder }]}>
            {/* Row 1: Consistency & Energy */}
            <View style={styles.insightsGrid}>
              <View style={styles.insightCell}>
                <View style={styles.insightCellHeader}>
                  <TrendingUp size={12} color={colors.accent} />
                  <Text style={[styles.insightCellLabel, { color: colors.textMuted }]}>PACE CONSISTENCY</Text>
                </View>
                <Text style={[styles.insightCellVal, { color: colors.textPrimary }]}>
                  {analytics.consistencyScore}%
                </Text>
                <Text style={[styles.insightCellSub, { color: colors.accent }]}>
                  {analytics.consistencyScore >= 90 ? 'Even Split Strategy' : 'Variable Pacing'}
                </Text>
              </View>

              <View style={[styles.cellDivider, { backgroundColor: colors.surfaceBorder }]} />

              <View style={styles.insightCell}>
                <View style={styles.insightCellHeader}>
                  <Flame size={12} color="#F59E0B" />
                  <Text style={[styles.insightCellLabel, { color: colors.textMuted }]}>ENERGY BURNED</Text>
                </View>
                <Text style={[styles.insightCellVal, { color: colors.textPrimary }]}>
                  {analytics.calories}
                </Text>
                <Text style={[styles.insightCellSub, { color: colors.textMuted }]}>Estimated kcal</Text>
              </View>
            </View>

            <View style={[styles.insightRowDivider, { backgroundColor: colors.divider }]} />

            {/* Row 2: Aerobic Load */}
            <View style={styles.insightBannerRow}>
              <View style={styles.loadBadge}>
                <Text style={[styles.loadBadgeNum, { color: colors.accent }]}>{analytics.trainingLoad}</Text>
                <Text style={[styles.loadBadgeLabel, { color: colors.textMuted }]}>AEROBIC LOAD</Text>
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={[styles.loadHeadline, { color: colors.textPrimary }]}>{analytics.loadDescription}</Text>
                <Text style={[styles.loadSub, { color: colors.textMuted }]}>
                  Quality Score: {activity.qualityScore}% (Anti-cheat GPS verified)
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* 1. Dedicated Kilometer Splits Bar Graph with Pacing Strategy */}
        <ActivitySplitsBarChart
          splits={activity.splits}
          avgPaceSecondsPerKm={activity.avgPaceSecondsPerKm}
          totalDistanceMeters={activity.distanceMeters}
          movingSeconds={activity.movingSeconds}
        />


        {/* Action Controls */}
        <View style={styles.actionButtons}>
          <PerformaButton
            title={isSavedAsRoute ? 'Saved to Route Directory' : 'Save as New Route'}
            disabled={isSavedAsRoute}
            onPress={() => {
              setRouteName(
                `${activity.type === 'RUN' ? 'Run' : activity.type} • ${(
                  activity.distanceMeters / 1000
                ).toFixed(1)}K Loop`
              );
              setShowSaveRouteModal(true);
            }}
            variant="secondary"
            size="md"
            icon={<BookmarkPlus size={15} color={isSavedAsRoute ? colors.accent : colors.textPrimary} />}
            style={{ marginBottom: 10 }}
          />

          <PerformaButton
            title="Export Performance Card"
            onPress={() => setShowPerformanceCardModal(true)}
            variant="secondary"
            size="md"
            icon={<Share2 size={15} color={colors.accent} />}
            style={{ marginBottom: 10 }}
          />

          <PerformaButton
            title="Done"
            onPress={() => {
              RecordingService.getInstance().reset();
              router.replace('/(tabs)/home');
            }}
            variant="accent"
            size="lg"
            icon={<Check size={16} color={isDark ? '#000000' : '#FFFFFF'} strokeWidth={2.4} />}
            style={{ marginBottom: 14 }}
          />

          {/* Delete Activity Danger Button */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setShowDeleteModal(true)}
            style={styles.deleteActivityBtn}
          >
            <Trash2 size={14} color={colors.danger} />
            <Text style={[styles.deleteActivityText, { color: colors.danger }]}>Delete Activity</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Delete Confirmation Modal */}
      <Modal visible={showDeleteModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.deleteModalBox,
              {
                backgroundColor: isDark ? '#0D0D10' : '#FFFFFF',
                borderColor: colors.surfaceBorder,
              },
            ]}
          >
            <Trash2 size={24} color={colors.danger} style={{ alignSelf: 'center', marginBottom: 10 }} />
            <Text style={[styles.deleteModalTitle, { color: colors.textPrimary }]}>Delete Activity?</Text>
            <Text style={[styles.deleteModalDesc, { color: colors.textSecondary }]}>
              This will permanently delete this workout from your local storage and cloud records. This cannot be undone.
            </Text>
            <View style={styles.deleteModalActions}>
              <PerformaButton
                title={isDeleting ? 'Deleting...' : 'Permanently Delete'}
                disabled={isDeleting}
                onPress={handleDeleteActivity}
                variant="danger"
                size="md"
                style={{ marginBottom: 8 }}
              />
              <PerformaButton
                title="Cancel"
                disabled={isDeleting}
                onPress={() => setShowDeleteModal(false)}
                variant="ghost"
                size="md"
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Save Route Modal */}
      <Modal visible={showSaveRouteModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.saveRouteBox,
              {
                backgroundColor: isDark ? '#0D0D10' : '#FFFFFF',
                borderColor: colors.surfaceBorder,
              },
            ]}
          >
            <View style={styles.saveRouteHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <MapPin size={18} color={colors.accent} />
                <Text style={[styles.saveRouteTitle, { color: colors.textPrimary }]}>Save as Route</Text>
              </View>
              <TouchableOpacity onPress={() => setShowSaveRouteModal(false)}>
                <X size={16} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.saveRouteDesc, { color: colors.textSecondary }]}>
              Publish this route to your Route Directory so you and friends can race your ghost pace anytime.
            </Text>

            <TextInput
              value={routeName}
              onChangeText={setRouteName}
              placeholder="e.g. Marina 5K Morning Sprint"
              placeholderTextColor={colors.textMuted}
              style={[
                styles.saveRouteInput,
                {
                  backgroundColor: isDark ? '#000000' : '#F8FAFC',
                  borderColor: colors.surfaceBorder,
                  color: colors.textPrimary,
                },
              ]}
              autoFocus
            />

            <View style={styles.saveRouteActions}>
              <PerformaButton
                title="Save & Publish Route"
                onPress={async () => {
                  if (routeName.trim()) {
                    await RouteService.getInstance().saveActivityAsRoute(routeName.trim(), activity);
                    setIsSavedAsRoute(true);
                    setShowSaveRouteModal(false);
                  }
                }}
                variant="accent"
                size="md"
                style={{ marginBottom: 8 }}
              />
              <PerformaButton
                title="Cancel"
                onPress={() => setShowSaveRouteModal(false)}
                variant="ghost"
                size="md"
              />
            </View>
          </View>
        </View>
      </Modal>

      <SessionCardShareModal
        visible={showPerformanceCardModal}
        onClose={() => setShowPerformanceCardModal(false)}
        activity={activity}
      />

      {/* Activity Map Display Privacy Modal */}
      <ActivityPrivacyModal
        visible={showPrivacyModal}
        onClose={() => setShowPrivacyModal(false)}
        activityTitle={`${(activity.distanceMeters / 1000).toFixed(2)} km ${activity.type}`}
        currentMode={privacyMode}
        onSave={handleSavePrivacy}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  mapHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  mapHeaderTitle: {
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 1,
  },
  privacyEditBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    borderWidth: 1,
  },
  privacyEditBtnText: {
    fontSize: 10,
    fontWeight: '700',
  },
  hiddenMapBox: {
    padding: 24,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  hiddenMapTitle: {
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 4,
  },
  hiddenMapDesc: {
    fontSize: 11,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 15,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },
  celebrationHeader: {

    alignItems: 'center',
    marginBottom: 20,
  },
  headerKickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  kicker: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  syncBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
  },
  syncBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.6,
    marginTop: 2,
  },
  subtitle: {
    fontSize: 13,
    marginTop: 3,
  },
  pbBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    marginBottom: 20,
  },
  pbTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  pbTime: {
    fontSize: 12,
    marginTop: 2,
  },
  modeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    marginBottom: 18,
  },
  modeBannerTitle: {
    fontSize: 10.5,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  modeBannerDesc: {
    fontSize: 11.5,
    lineHeight: 16,
    marginTop: 2,
  },
  rewardsSection: {
    paddingVertical: 6,
  },
  rewardsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 14,
    borderTopWidth: 1,
    borderBottomWidth: 1,
  },
  rewardCol: {
    alignItems: 'center',
    flex: 1,
  },
  rewardVal: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -1,
  },
  rewardLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.0,
    marginTop: 3,
  },
  rewardVDivider: {
    width: 1,
    height: 36,
  },
  rankShiftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 12,
    justifyContent: 'center',
  },
  rankChangeText: {
    fontSize: 12,
  },
  sectionDivider: {
    height: 1,
    marginVertical: 18,
  },
  metricsStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  metricStripItem: {
    flex: 1,
    alignItems: 'center',
  },
  metricValText: {
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  metricSubText: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginTop: 2,
  },
  stripDivider: {
    width: 1,
    height: 22,
  },
  mapBox: {
    borderRadius: RADIUS.md,
    overflow: 'hidden',
    borderWidth: 1,
    marginBottom: 20,
  },
  insightsSection: {
    marginBottom: 20,
  },
  insightsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  insightsTitle: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  insightsCard: {
    borderRadius: RADIUS.md,
    borderWidth: 1,
    padding: 14,
  },
  insightsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  insightCell: {
    flex: 1,
    alignItems: 'center',
  },
  insightCellHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  insightCellLabel: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  insightCellVal: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  insightCellSub: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },
  cellDivider: {
    width: 1,
    height: 36,
  },
  insightRowDivider: {
    height: 1,
    marginVertical: 12,
  },
  insightBannerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loadBadge: {
    alignItems: 'center',
    paddingRight: 12,
  },
  loadBadgeNum: {
    fontSize: 20,
    fontWeight: '900',
  },
  loadBadgeLabel: {
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  loadHeadline: {
    fontSize: 12,
    fontWeight: '700',
  },
  loadSub: {
    fontSize: 11,
    marginTop: 2,
  },
  splitsSection: {
    marginBottom: 24,
  },
  splitsTitle: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginBottom: 12,
  },
  splitBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  splitNumCol: {
    width: 65,
    flexDirection: 'column',
    gap: 2,
  },
  splitNum: {
    fontSize: 12,
    fontWeight: '700',
  },
  fastestTag: {
    alignSelf: 'flex-start',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
  },
  fastestTagText: {
    fontSize: 7,
    fontWeight: '900',
    color: '#000000',
  },
  splitBarContainer: {
    flex: 1,
    height: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 5,
    marginHorizontal: 10,
    overflow: 'hidden',
  },
  splitBarFill: {
    height: '100%',
    borderRadius: 5,
  },
  splitPaceCol: {
    width: 70,
    alignItems: 'flex-end',
  },
  splitPace: {
    fontSize: 13,
    fontWeight: '700',
  },
  splitDelta: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 1,
  },
  actionButtons: {
    marginTop: 10,
  },
  deleteActivityBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 6,
  },
  deleteActivityText: {
    fontSize: 13,
    fontWeight: '700',
  },
  deleteModalBox: {
    borderRadius: RADIUS.md,
    borderWidth: 1,
    padding: 22,
  },
  deleteModalTitle: {
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 6,
  },
  deleteModalDesc: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  deleteModalActions: {
    width: '100%',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  saveRouteBox: {
    borderRadius: RADIUS.md,
    borderWidth: 1,
    padding: 20,
  },
  saveRouteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  saveRouteTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  saveRouteDesc: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 16,
  },
  saveRouteInput: {
    borderWidth: 1,
    borderRadius: RADIUS.sm,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    marginBottom: 16,
  },
  saveRouteActions: {
    width: '100%',
  },
  sessionMetaCard: {
    borderRadius: RADIUS.md,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  metaCardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  metaCardKicker: {
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  savedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
  },
  savedPillText: {
    fontSize: 8.5,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  metaInputGroup: {
    marginBottom: 10,
  },
  metaFieldLabel: {
    fontSize: 8.5,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 6,
  },
  metaTitleInput: {
    borderWidth: 1,
    borderRadius: RADIUS.sm,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 14,
    fontWeight: '700',
  },
  metaDescInput: {
    borderWidth: 1,
    borderRadius: RADIUS.sm,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 13,
    minHeight: 64,
  },
  metaSaveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    marginTop: 4,
  },
  metaSaveBtnText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
});
