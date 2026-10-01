import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Image,
} from 'react-native';
import { COSMETIC_IMAGES } from '../../constants/Cosmetics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Svg, { Polyline as SvgPolyline } from 'react-native-svg';
import {
  X,
  Zap,
  Flame,
  Shield,
  Award,
  Lock,
  EyeOff,
  Play,
  Ghost,
  ChevronLeft,
  Users,
} from 'lucide-react-native';
import { RADIUS } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';
import { AthleteProfileDetails, FriendService } from '../../features/social/FriendService';
import { DivisionBadge, PerformaButton } from '../common';
import { ActivityMap } from '../maps/ActivityMap';
import { useRecordingStore } from '../../features/recording/RecordingStore';
import { PlayerBanner } from '../profile/PlayerBanner';
import { ALL_ACHIEVEMENTS } from '../../features/achievements/AchievementDefinitions';
import { UserProfile } from '../../types';

interface AthleteProfileModalProps {
  visible: boolean;
  onClose: () => void;
  athlete: AthleteProfileDetails | null;
}

export function AthleteProfileModal({ visible, onClose, athlete }: AthleteProfileModalProps) {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const setGhostOpponent = useRecordingStore((s) => s.setGhostOpponent);
  const setMode = useRecordingStore((s) => s.setMode);

  const mappedUserProfile: UserProfile | null = useMemo(() => {
    if (!athlete) return null;
    return {
      id: athlete.id,
      username: athlete.username,
      displayName: athlete.displayName,
      avatarUrl: athlete.avatarUrl,
      bio: athlete.bio,
      units: 'METRIC',
      preferredActivity: 'RUN',
      level: athlete.level,
      lifetimeXp: athlete.level * 1000,
      currentXp: 500,
      xpForNextLevel: 1000,
      currentSeasonId: 'S00_GENESIS',
      currentDivision: athlete.division,
      currentTier: athlete.tier,
      currentPr: athlete.currentPr,
      peakPr: athlete.currentPr + 120,
      isZenith100: athlete.division === 'ZENITH',
      zenithBadges: [],
      streakWeeks: athlete.streakWeeks,
      lastActiveWeek: '2026-W39',
      qualifyingActivitiesThisWeek: 3,
      lifetimeDistanceMeters: athlete.recentActivities.reduce((acc, a) => acc + (a.distanceMeters || 0), 0),
      lifetimeDurationSeconds: athlete.recentActivities.reduce((acc, a) => acc + (a.movingSeconds || 0), 0),
      lifetimeActivitiesCount: athlete.recentActivities.length,
      personalBests: [],
      isPro: false,
      clanId: athlete.clanTag,
      clanName: athlete.clanTag ? `Clan ${athlete.clanTag}` : undefined,
      equippedCosmetics: {
        avatarFrame: athlete.avatarFrameId,
        title: athlete.equippedTitle,
        theme: athlete.bannerThemeId,
      },
    };
  }, [athlete]);

  const athleteShowcaseAchievements = useMemo(() => {
    if (!athlete) return [];
    return ALL_ACHIEVEMENTS.filter(
      (a) =>
        a.id === 'act_first_step' ||
        (athlete.level >= 5 ? a.id === 'dist_road_runner' : a.id === 'act_getting_started')
    ).slice(0, 2);
  }, [athlete?.level]);

  const athleteAp = useMemo(() => {
    if (!athlete) return 0;
    return athlete.level * 140 + 250;
  }, [athlete?.level]);

  if (!athlete) return null;

  const handleRaceAsGhost = (act: any) => {
    const ghostData = FriendService.getInstance().createGhostFromActivity(act, athlete.displayName);
    setGhostOpponent(ghostData);
    setMode('GHOST');
    onClose();
    router.push('/(tabs)/record');
  };

  const formatPace = (paceSec: number) => {
    if (!paceSec) return '--:--';
    const m = Math.floor(paceSec / 60);
    const s = Math.round(paceSec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const formatDuration = (totalSec: number) => {
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <View style={[styles.overlay, { backgroundColor: isDark ? '#08080B' : '#F8FAFC' }]}>
        <View style={StyleSheet.absoluteFill}>
          <Image
            source={COSMETIC_IMAGES.backgrounds.cyberLines}
            style={StyleSheet.absoluteFill}
            resizeMode="cover"
          />
          <View
            style={[
              StyleSheet.absoluteFill,
              { backgroundColor: isDark ? 'rgba(8, 8, 11, 0.88)' : 'rgba(248, 250, 252, 0.90)' },
            ]}
          />
        </View>
        <View
          style={[
            styles.container,
            {
              backgroundColor: 'transparent',
            },
          ]}
        >
          {/* Header */}
          <View style={[styles.header, { paddingTop: insets.top + 8, borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.08)' : colors.surfaceBorder }]}>
            <TouchableOpacity onPress={onClose} style={[styles.backBtn, { borderColor: colors.surfaceBorder }]} activeOpacity={0.7}>
              <ChevronLeft size={18} color={colors.textPrimary} />
            </TouchableOpacity>
            <View style={{ flex: 1, marginLeft: 10 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={[styles.kicker, { color: colors.accent }]}>ATHLETE DOSSIER</Text>
                {athlete.clanTag ? (
                  <View
                    style={[
                      styles.clanTagPill,
                      {
                        backgroundColor: isDark ? 'rgba(204, 255, 0, 0.12)' : 'rgba(0, 82, 255, 0.12)',
                        borderColor: colors.accent,
                      },
                    ]}
                  >
                    <Text style={[styles.clanTagText, { color: colors.accent }]}>
                      [{athlete.clanTag}]
                    </Text>
                  </View>
                ) : null}
              </View>
              <Text style={[styles.headerName, { color: colors.textPrimary }]} numberOfLines={1}>
                {athlete.displayName}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={[styles.closeBtn, { borderColor: colors.surfaceBorder }]}>
              <X size={15} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.scrollBody, { paddingBottom: insets.bottom + 24 }]}>
            {/* Athlete Profile Banner (Seamless & Minimalist Component Re-use) */}
            <View style={{ marginBottom: 20 }}>
              <PlayerBanner
                user={mappedUserProfile}
                activeFrameId={athlete.avatarFrameId || 'frame_default_slate'}
                avatarId={athlete.avatarId}
                bannerThemeId={athlete.bannerThemeId || 'THEME_OBSIDIAN'}
                showcasedAchievements={athleteShowcaseAchievements}
                totalAp={athleteAp}
                activities={athlete.recentActivities}
                readOnly={true}
              />
            </View>

            {/* Recent Workouts with 3-Way Route Privacy Enforced */}
            <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>
              RECENT ACTIVITIES & GHOST CHALLENGES
            </Text>

            {athlete.recentActivities.map((act) => {
              const km = (act.distanceMeters / 1000).toFixed(2);
              const dateStr = new Date(act.startTime).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
              });

              return (
                <View
                  key={act.id}
                  style={[
                    styles.activityCard,
                    {
                      borderBottomColor: colors.divider,
                    },
                  ]}
                >
                  <View style={styles.actTopRow}>
                    <View>
                      <Text style={[styles.actTitle, { color: colors.textPrimary }]}>
                        {act.type} • {km} km
                      </Text>
                      <Text style={[styles.actDate, { color: colors.textMuted }]}>
                        {dateStr} • {formatDuration(act.movingSeconds)} • {formatPace(act.avgPaceSecondsPerKm)}/km
                      </Text>
                    </View>

                    {/* Challenge Ghost Button */}
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={() => handleRaceAsGhost(act)}
                      style={[
                        styles.raceGhostBtn,
                        {
                          backgroundColor: isDark ? 'rgba(168, 85, 247, 0.16)' : 'rgba(168, 85, 247, 0.12)',
                          borderColor: '#A855F7',
                        },
                      ]}
                    >
                      <Ghost size={12} color="#A855F7" />
                      <Text style={styles.raceGhostBtnText}>Challenge Ghost</Text>
                    </TouchableOpacity>
                  </View>

                  {/* 3-WAY ROUTE PRIVACY DISPLAY */}
                  {athlete.routePrivacyMode === 'FULL' && act.routeCoordinates.length > 0 && (
                    <View style={[styles.mapContainer, { borderColor: colors.surfaceBorder }]}>
                      <ActivityMap
                        coordinates={act.routeCoordinates}
                        gpsQuality="EXCELLENT"
                        showStartFinishPins={true}
                        followUser={false}
                        interactive={false}
                        style={{ height: 140 }}
                      />
                    </View>
                  )}

                  {athlete.routePrivacyMode === 'SILHOUETTE_ONLY' && act.routeCoordinates.length > 0 && (
                    <View
                      style={[
                        styles.silhouetteBox,
                        {
                          backgroundColor: isDark ? '#08080A' : '#1E293B',
                          borderColor: colors.surfaceBorder,
                        },
                      ]}
                    >
                      <View style={styles.silhouetteBadge}>
                        <Shield size={10} color={colors.accent} />
                        <Text style={[styles.silhouetteBadgeText, { color: colors.accent }]}>
                          SILHOUETTE VECTOR • STREETS OMITTED
                        </Text>
                      </View>
                      <Svg width="260" height="90" viewBox="0 0 260 90">
                        <SvgPolyline
                          points="20,70 60,35 110,55 160,25 210,45 240,20"
                          fill="none"
                          stroke={colors.accent}
                          strokeWidth="3.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </Svg>
                    </View>
                  )}

                  {athlete.routePrivacyMode === 'HIDDEN' && (
                    <View
                      style={[
                        styles.privacyHiddenBox,
                        {
                          backgroundColor: isDark ? '#0D0D12' : '#F1F5F9',
                          borderColor: colors.surfaceBorder,
                        },
                      ]}
                    >
                      <Lock size={15} color={colors.textMuted} />
                      <Text style={[styles.privacyHiddenText, { color: colors.textMuted }]}>
                        Route map hidden by athlete privacy settings
                      </Text>
                    </View>
                  )}

                  {/* Splits mini summary */}
                  <View style={styles.telemetryRow}>
                    <View style={styles.telemetryCol}>
                      <Text style={[styles.telemetryVal, { color: colors.textPrimary }]}>{km} KM</Text>
                      <Text style={[styles.telemetryLabel, { color: colors.textMuted }]}>DIST</Text>
                    </View>
                    <View style={styles.telemetryCol}>
                      <Text style={[styles.telemetryVal, { color: colors.textPrimary }]}>
                        {formatPace(act.avgPaceSecondsPerKm)}
                      </Text>
                      <Text style={[styles.telemetryLabel, { color: colors.textMuted }]}>AVG PACE</Text>
                    </View>
                    <View style={styles.telemetryCol}>
                      <Text style={[styles.telemetryVal, { color: colors.textPrimary }]}>
                        +{act.elevationGainMeters}m
                      </Text>
                      <Text style={[styles.telemetryLabel, { color: colors.textMuted }]}>ELEV</Text>
                    </View>
                    <View style={styles.telemetryCol}>
                      <Text style={[styles.telemetryVal, { color: colors.accent }]}>
                        +{act.prEarned} PR
                      </Text>
                      <Text style={[styles.telemetryLabel, { color: colors.textMuted }]}>SCORE</Text>
                    </View>
                  </View>
                </View>
              );
            })}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 34,
    height: 34,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerName: {
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: -0.3,
    marginTop: 1,
  },
  kicker: {
    fontSize: 9.5,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  clanTagPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
  },
  clanTagText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollBody: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
  },
  profileHeaderCard: {
    borderWidth: 1,
    borderRadius: RADIUS.lg,
    padding: 16,
    marginBottom: 20,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: 20,
    fontWeight: '900',
    color: '#000000',
  },
  displayName: {
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  username: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  bioText: {
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 12,
    lineHeight: 18,
  },
  statsStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    marginTop: 14,
    paddingTop: 12,
  },
  statCell: {
    alignItems: 'center',
  },
  statVal: {
    fontSize: 15,
    fontWeight: '900',
  },
  statLabel: {
    fontSize: 8.5,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 24,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 12,
  },
  activityCard: {
    borderBottomWidth: 1,
    paddingVertical: 14,
    marginBottom: 6,
  },
  actTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  actTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  actDate: {
    fontSize: 11,
    marginTop: 2,
  },
  raceGhostBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.full,
    borderWidth: 1,
  },
  raceGhostBtnText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#A855F7',
  },
  mapContainer: {
    borderRadius: RADIUS.md,
    overflow: 'hidden',
    borderWidth: 1,
    marginBottom: 10,
  },
  silhouetteBox: {
    borderRadius: RADIUS.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    marginBottom: 10,
  },
  silhouetteBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 6,
  },
  silhouetteBadgeText: {
    fontSize: 8.5,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  privacyHiddenBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    paddingVertical: 18,
    marginBottom: 10,
  },
  privacyHiddenText: {
    fontSize: 11,
    fontWeight: '600',
  },
  telemetryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
  },
  telemetryCol: {
    alignItems: 'center',
  },
  telemetryVal: {
    fontSize: 12,
    fontWeight: '800',
  },
  telemetryLabel: {
    fontSize: 8,
    fontWeight: '700',
    marginTop: 2,
  },
});
