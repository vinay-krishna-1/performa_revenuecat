import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import Svg, { Defs, LinearGradient as SvgGradient, RadialGradient, Stop, Rect } from 'react-native-svg';
import {
  Sparkles,
  Trophy,
  ChevronDown,
  ChevronUp,
  Plus,
  Flame,
  Award,
  Zap,
  TrendingUp,
  Clock,
  Compass,
  Users,
  Camera,
  Palette,
} from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { RADIUS, SPACING } from '../../constants/theme';
import { UserProfile, ActivitySummary } from '../../types';
import { AchievementDefinition } from '../../features/achievements/AchievementTypes';
import { resolveFrame } from '../../features/achievements/FrameDefinitions';
import { DivisionBadge, ApBadge, PlayerLevelBadge } from '../common';
import { BANNER_THEMES } from './BannerThemeModal';
import { AVATAR_PRESETS } from './AvatarSelectModal';

interface PlayerBannerProps {
  user: UserProfile | null;
  activeFrameId: string;
  avatarId?: string;
  bannerThemeId?: string;
  showcasedAchievements: AchievementDefinition[];
  totalAp: number;
  activities: ActivitySummary[];
  onOpenFrameSelect?: () => void;
  onOpenAvatarSelect?: () => void;
  onOpenBannerTheme?: () => void;
  onOpenAchievements?: () => void;
  onOpenCommunity?: () => void;
  pendingCommunityRequests?: number;
  readOnly?: boolean;
}

export function PlayerBanner({
  user,
  activeFrameId,
  avatarId,
  bannerThemeId,
  showcasedAchievements,
  totalAp,
  activities,
  onOpenFrameSelect,
  onOpenAvatarSelect,
  onOpenBannerTheme,
  onOpenAchievements,
  onOpenCommunity,
  pendingCommunityRequests = 0,
  readOnly = false,
}: PlayerBannerProps) {
  const { colors, isDark } = useTheme();
  const [isLifetimeExpanded, setIsLifetimeExpanded] = useState(false);

  const activeTheme = useMemo(() => {
    return BANNER_THEMES.find((t) => t.id === bannerThemeId) || BANNER_THEMES[0];
  }, [bannerThemeId]);

  const activeAvatar = useMemo(() => {
    return AVATAR_PRESETS.find((p) => p.id === avatarId) || AVATAR_PRESETS[0];
  }, [avatarId]);

  const activeFrame = useMemo(() => {
    return resolveFrame(activeFrameId);
  }, [activeFrameId]);

  // Compute lifetime metrics from activities
  const lifetimeStats = useMemo(() => {
    let totalMeters = 0;
    let totalSeconds = 0;
    let totalElev = 0;
    let maxDistMeters = 0;

    for (const a of activities) {
      totalMeters += a.distanceMeters || 0;
      totalSeconds += a.movingSeconds || 0;
      totalElev += a.elevationGainMeters || 0;
      if (a.distanceMeters > maxDistMeters) maxDistMeters = a.distanceMeters;
    }

    const totalKm = (totalMeters / 1000).toFixed(1);
    const maxKm = (maxDistMeters / 1000).toFixed(1);
    const totalHours = (totalSeconds / 3600).toFixed(1);
    const avgPace =
      totalMeters > 0
        ? Math.round(totalSeconds / (totalMeters / 1000))
        : 0;

    const formatPace = (sec: number) => {
      if (!sec) return "--'--\"";
      const m = Math.floor(sec / 60);
      const s = Math.round(sec % 60);
      return `${m}'${s < 10 ? '0' : ''}${s}"`;
    };

    return {
      totalKm,
      maxKm,
      totalHours,
      totalElev,
      avgPace: formatPace(avgPace),
      sessionCount: activities.length,
    };
  }, [activities]);

  const initials = (user?.displayName || user?.username || 'A').slice(0, 2).toUpperCase();

  return (
    <View
      style={[
        styles.bannerCard,
        {
          backgroundColor: isDark ? activeTheme.bgDark : activeTheme.bgLight,
          borderTopColor: isDark ? 'rgba(255, 255, 255, 0.16)' : 'rgba(0, 0, 0, 0.08)',
          borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.04)',
          borderLeftColor: isDark ? 'rgba(255, 255, 255, 0.07)' : 'rgba(0, 0, 0, 0.05)',
          borderRightColor: isDark ? 'rgba(255, 255, 255, 0.07)' : 'rgba(0, 0, 0, 0.05)',
          shadowColor: '#000000',
          shadowOpacity: isDark ? 0.65 : 0.12,
        },
      ]}
    >
      {/* 16:9 Master Raster Banner Backdrop - Full High Visibility */}
      {activeTheme.image && (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          <Image
            source={activeTheme.image}
            style={StyleSheet.absoluteFill}
            resizeMode="cover"
          />
          {/* Subtle Bottom Scrim for Telemetry Legibility + Cinematic Light Vignette */}
          <Svg height="100%" width="100%" style={StyleSheet.absoluteFill}>
            <Defs>
              {/* Bottom Scrim for Telemetry Contrast */}
              <SvgGradient id="bannerCardGrad" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0%" stopColor={isDark ? '#08080C' : '#FFFFFF'} stopOpacity={isDark ? 0.05 : 0.08} />
                <Stop offset="50%" stopColor={isDark ? '#08080C' : '#FFFFFF'} stopOpacity={isDark ? 0.25 : 0.30} />
                <Stop offset="80%" stopColor={isDark ? '#08080C' : '#FFFFFF'} stopOpacity={isDark ? 0.70 : 0.75} />
                <Stop offset="100%" stopColor={isDark ? '#08080C' : '#FFFFFF'} stopOpacity={isDark ? 0.90 : 0.94} />
              </SvgGradient>

              {/* Standard Radial Perimeter Vignette */}
              <RadialGradient id="bannerVignette" cx="50%" cy="45%" r="75%">
                <Stop offset="0%" stopColor="#000000" stopOpacity="0" />
                <Stop offset="55%" stopColor="#000000" stopOpacity="0.12" />
                <Stop offset="85%" stopColor="#000000" stopOpacity="0.38" />
                <Stop offset="100%" stopColor="#000000" stopOpacity="0.65" />
              </RadialGradient>

              {/* Top Edge Vignette */}
              <SvgGradient id="topEdgeVignette" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0%" stopColor="#000000" stopOpacity="0.45" />
                <Stop offset="30%" stopColor="#000000" stopOpacity="0.10" />
                <Stop offset="100%" stopColor="#000000" stopOpacity="0" />
              </SvgGradient>

              {/* Side Edge Vignette */}
              <SvgGradient id="sideEdgeVignette" x1="0" y1="0" x2="1" y2="0">
                <Stop offset="0%" stopColor="#000000" stopOpacity="0.40" />
                <Stop offset="15%" stopColor="#000000" stopOpacity="0" />
                <Stop offset="85%" stopColor="#000000" stopOpacity="0" />
                <Stop offset="100%" stopColor="#000000" stopOpacity="0.40" />
              </SvgGradient>
            </Defs>
            <Rect width="100%" height="100%" fill="url(#bannerCardGrad)" />
            <Rect width="100%" height="100%" fill="url(#bannerVignette)" />
            <Rect width="100%" height="100%" fill="url(#topEdgeVignette)" />
            <Rect width="100%" height="100%" fill="url(#sideEdgeVignette)" />
          </Svg>
        </View>
      )}

      {/* Floating Theme Button (Borderless minimalist glass circle, top-right) */}
      {!readOnly && onOpenBannerTheme && (
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={onOpenBannerTheme}
          style={[
            styles.bannerThemeFloatingBtn,
            {
              backgroundColor: isDark ? 'rgba(8, 12, 18, 0.65)' : 'rgba(255, 255, 255, 0.82)',
              borderColor: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.10)',
            },
          ]}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Palette size={15} color={activeTheme.accentColor} />
        </TouchableOpacity>
      )}

      {/* Top Identity Row */}
      <View style={styles.identityRow}>
        {/* Avatar with Customizable Cosmetic Frame, Preset Picture & Level Number */}
        <View style={styles.avatarFrameWrapper}>
          <TouchableOpacity
            activeOpacity={readOnly ? 1 : 0.8}
            disabled={readOnly || !onOpenFrameSelect}
            onPress={onOpenFrameSelect}
            style={styles.avatarTouchArea}
          >
            {/* Core Circular Avatar Disc */}
            <View
              style={[
                styles.avatarCore,
                {
                  backgroundColor: activeAvatar?.bg || (isDark ? '#161B22' : '#F1F5F9'),
                },
              ]}
            >
              {activeAvatar?.image ? (
                <Image
                  source={activeAvatar.image}
                  style={styles.avatarDiscImg}
                  resizeMode="cover"
                />
              ) : (activeAvatar as any)?.emoji ? (
                <Text style={{ fontSize: 26 }}>{(activeAvatar as any).emoji}</Text>
              ) : (
                <Text style={[styles.avatarInitials, { color: activeAvatar?.color || colors.textPrimary }]}>
                  {initials}
                </Text>
              )}
            </View>

            {/* Transparent PNG Frame Overlay Ring */}
            {activeFrame?.image ? (
              <Image
                source={activeFrame.image}
                style={styles.avatarFrameOverlay}
                resizeMode="contain"
              />
            ) : (
              <View
                style={[
                  styles.avatarFrameFallback,
                  {
                    borderColor: activeFrame.borderColor,
                    shadowColor: activeFrame.borderColor,
                  },
                ]}
              />
            )}
          </TouchableOpacity>

          {/* Profile Picture Camera Picker Badge */}
          {!readOnly && onOpenAvatarSelect && (
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={onOpenAvatarSelect}
              style={[
                styles.avatarCameraBadge,
                {
                  backgroundColor: colors.accent,
                  borderColor: isDark ? '#08080C' : '#FFFFFF',
                },
              ]}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Camera size={10} color="#000000" strokeWidth={2.5} />
            </TouchableOpacity>
          )}
        </View>

        {/* Identity Details */}
        <View style={styles.identityDetails}>
          <View style={styles.nameRow}>
            <Text style={[styles.displayName, { color: colors.textPrimary }]} numberOfLines={1}>
              {user?.displayName || 'Performa Athlete'}
            </Text>
            {user?.isPro && (
              <View style={[styles.proBadge, { backgroundColor: isDark ? 'rgba(204, 255, 0, 0.15)' : 'rgba(0, 82, 255, 0.12)' }]}>
                <Sparkles size={10} color={colors.accent} />
                <Text style={[styles.proBadgeText, { color: colors.accent }]}>PRO</Text>
              </View>
            )}

          </View>

          {user?.username ? (
            <Text style={[styles.usernameText, { color: isDark ? 'rgba(255,255,255,0.7)' : colors.textMuted }]}>
              @{user.username}
            </Text>
          ) : null}

          {(user?.equippedCosmetics?.title || (user as any)?.equippedTitle) ? (
            <View style={styles.equippedTitleRow}>
              <Award size={10} color={colors.accent} />
              <Text style={[styles.equippedTitleText, { color: colors.accent }]} numberOfLines={1}>
                {user?.equippedCosmetics?.title || (user as any)?.equippedTitle}
              </Text>
            </View>
          ) : null}

          {user?.bio ? (
            <Text style={[styles.bannerBioText, { color: isDark ? '#CBD5E1' : '#475569' }]} numberOfLines={2}>
              "{user.bio}"
            </Text>
          ) : null}

          <View style={styles.statusPillsRow}>
            {/* Division Rank Badge Row */}
            <View style={styles.divisionRow}>
              <DivisionBadge
                division={user?.currentDivision || 'BRONZE'}
                tier={user?.currentTier || 5}
                size="sm"
              />
            </View>

            {/* Official Raster Player Level Badge & Activity Points (AP) Badge Inline */}
            <View style={styles.progressionRow}>
              <PlayerLevelBadge
                level={user?.level || 1}
                size="sm"
              />
              <ApBadge
                points={totalAp || 0}
                size="sm"
                onPress={onOpenAchievements}
                disabled={readOnly || !onOpenAchievements}
              />
            </View>
          </View>
        </View>
      </View>

      {/* 3 Showcased Achievements Flex (Frosted HUD Slots) */}
      {(!readOnly || showcasedAchievements.length > 0) && (
        <View style={[styles.showcaseSection, { borderTopColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)' }]}>
          <View style={styles.showcaseHeaderRow}>
            <Text style={[styles.showcaseKicker, { color: isDark ? 'rgba(255,255,255,0.65)' : colors.textMuted }]}>
              ACHIEVEMENT SHOWCASE
            </Text>
            {!readOnly && onOpenAchievements && (
              <TouchableOpacity activeOpacity={0.7} onPress={onOpenAchievements}>
                <Text style={[styles.manageShowcaseText, { color: activeTheme.accentColor }]}>
                  {showcasedAchievements.length > 0 ? 'Edit' : '+ Add'}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.showcaseSlotGrid}>
            {(readOnly ? showcasedAchievements : [0, 1, 2]).map((item, slotIdx) => {
              const achievement = readOnly ? (item as AchievementDefinition) : showcasedAchievements[slotIdx];
              if (achievement) {
                return (
                  <TouchableOpacity
                    key={achievement.id}
                    activeOpacity={readOnly ? 1 : 0.8}
                    disabled={readOnly}
                    onPress={onOpenAchievements}
                    style={[
                      styles.showcaseSlotCard,
                      {
                        backgroundColor: isDark ? 'rgba(16, 20, 28, 0.70)' : 'rgba(255, 255, 255, 0.90)',
                        borderTopColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
                        borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.04)',
                        borderLeftColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)',
                        borderRightColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)',
                      },
                    ]}
                  >
                    <View style={styles.showcaseIconCore}>
                      <Award
                        size={17}
                        color={
                          achievement.rarity === 'ZENITH'
                            ? colors.accent
                            : achievement.rarity === 'LEGENDARY'
                            ? colors.gold
                            : '#A855F7'
                        }
                      />
                    </View>
                    <Text style={[styles.showcaseItemName, { color: colors.textPrimary }]} numberOfLines={1}>
                      {achievement.name}
                    </Text>
                    <ApBadge
                      points={achievement.achievementPoints}
                      prefix="+"
                      size="sm"
                      style={{ marginTop: 3 }}
                    />
                  </TouchableOpacity>
                );
              }

              if (readOnly) return null;

              return (
                <TouchableOpacity
                  key={`empty_${slotIdx}`}
                  activeOpacity={0.75}
                  onPress={onOpenAchievements}
                  style={[
                    styles.showcaseSlotEmpty,
                    {
                      borderColor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#E2E8F0',
                      backgroundColor: isDark ? 'rgba(10, 14, 20, 0.35)' : '#F8FAFC',
                      borderStyle: 'solid',
                    },
                  ]}
                >
                  <Plus size={13} color={isDark ? colors.textMuted : colors.textSecondary} />
                  <Text style={[styles.showcaseEmptyText, { color: isDark ? colors.textMuted : colors.textSecondary }]}>
                    Add
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      )}

      {/* Integrated / Collapsible Lifetime Telemetry (Frosted Cockpit Console Backplate) */}
      <View
        style={[
          styles.lifetimeSection,
          {
            backgroundColor: isDark ? '#090D14' : '#FFFFFF',
            borderTopColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
          },
        ]}
      >
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => setIsLifetimeExpanded(!isLifetimeExpanded)}
          style={styles.lifetimeToggleRow}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <TrendingUp size={12} color={activeTheme.accentColor} />
            <Text style={[styles.lifetimeKicker, { color: isDark ? 'rgba(255,255,255,0.85)' : colors.textSecondary }]}>
              LIFETIME TELEMETRY
            </Text>
          </View>
          {isLifetimeExpanded ? (
            <ChevronUp size={14} color={isDark ? '#CBD5E1' : colors.textMuted} />
          ) : (
            <ChevronDown size={14} color={isDark ? '#CBD5E1' : colors.textMuted} />
          )}
        </TouchableOpacity>

        {/* Compact 3-Metric Lifetime Frosted Strip */}
        <View
          style={[
            styles.lifetimeGrid,
            {
              backgroundColor: isDark ? '#111722' : '#F1F5F9',
              borderColor: isDark ? 'rgba(255, 255, 255, 0.10)' : 'rgba(0, 0, 0, 0.06)',
            },
          ]}
        >
          <View style={styles.lifetimeCell}>
            <Text style={[styles.lifetimeVal, { color: colors.textPrimary }]}>
              {lifetimeStats.totalKm}
            </Text>
            <Text style={[styles.lifetimeLabel, { color: isDark ? '#94A3B8' : colors.textMuted }]}>KM</Text>
          </View>
          <View style={[styles.lifetimeDivider, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)' }]} />
          <View style={styles.lifetimeCell}>
            <Text style={[styles.lifetimeVal, { color: colors.textPrimary }]}>
              {lifetimeStats.sessionCount}
            </Text>
            <Text style={[styles.lifetimeLabel, { color: isDark ? '#94A3B8' : colors.textMuted }]}>SESSIONS</Text>
          </View>
          <View style={[styles.lifetimeDivider, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)' }]} />
          <View style={styles.lifetimeCell}>
            <Text style={[styles.lifetimeVal, { color: activeTheme.accentColor }]}>
              {user?.currentPr || 0}
            </Text>
            <Text style={[styles.lifetimeLabel, { color: isDark ? '#94A3B8' : colors.textMuted }]}>PR</Text>
          </View>
        </View>

        {/* Expandable Additional Lifetime Telemetry Tray */}
        {isLifetimeExpanded && (
          <View
            style={[
              styles.expandedLifetimeRow,
              {
                backgroundColor: isDark ? '#111722' : '#F1F5F9',
                borderColor: isDark ? 'rgba(255, 255, 255, 0.10)' : 'rgba(0, 0, 0, 0.06)',
              },
            ]}
          >
            <View style={styles.expandedCell}>
              <Text style={[styles.expandedVal, { color: colors.textPrimary }]}>
                {lifetimeStats.totalHours} hrs
              </Text>
              <Text style={[styles.expandedLabel, { color: isDark ? '#94A3B8' : '#64748B' }]}>TIME IN MOTION</Text>
            </View>
            <View style={[styles.lifetimeDivider, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)' }]} />
            <View style={styles.expandedCell}>
              <Text style={[styles.expandedVal, { color: colors.textPrimary }]}>
                {lifetimeStats.maxKm} km
              </Text>
              <Text style={[styles.expandedLabel, { color: isDark ? '#94A3B8' : '#64748B' }]}>LONGEST DIST</Text>
            </View>
            <View style={[styles.lifetimeDivider, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)' }]} />
            <View style={styles.expandedCell}>
              <Text style={[styles.expandedVal, { color: colors.textPrimary }]}>
                {lifetimeStats.avgPace}
              </Text>
              <Text style={[styles.expandedLabel, { color: isDark ? '#94A3B8' : '#64748B' }]}>LIFETIME PACE</Text>
            </View>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bannerCard: {
    borderRadius: 14,
    borderTopLeftRadius: 22,
    borderBottomRightRadius: 22,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 14,
    elevation: 8,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 16,
    position: 'relative',
  },
  identityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 14,
    gap: 15,
  },
  avatarFrameWrapper: {
    position: 'relative',
    width: 78,
    height: 78,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarTouchArea: {
    width: 78,
    height: 78,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarCore: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarDiscImg: {
    width: '100%',
    height: '100%',
  },
  avatarFrameOverlay: {
    position: 'absolute',
    width: 78,
    height: 78,
  },
  avatarFrameFallback: {
    position: 'absolute',
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 3,
  },
  avatarInitials: {
    fontSize: 22,
    fontWeight: '900',
  },
  levelBadge: {
    position: 'absolute',
    bottom: -4,
    paddingHorizontal: 7,
    paddingVertical: 1.5,
    borderRadius: RADIUS.full,
    borderWidth: 1.5,
    elevation: 4,
    zIndex: 10,
  },
  levelBadgeText: {
    color: '#000000',
    fontSize: 8.5,
    fontWeight: '900',
    letterSpacing: 0.4,
  },
  avatarCameraBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    zIndex: 10,
  },
  identityDetails: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  displayName: {
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: -0.2,
  },
  proBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
    gap: 3,
  },
  proBadgeText: {
    fontSize: 8.5,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  usernameText: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 1,
  },
  equippedTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  equippedTitleText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  bannerBioText: {
    fontSize: 10.5,
    fontStyle: 'italic',
    marginTop: 2,
    lineHeight: 14,
  },
  statusPillsRow: {
    marginTop: 6,
    gap: 6,
  },
  divisionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  apPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    gap: 4,
  },
  apPillText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.4,
  },
  bannerThemeFloatingBtn: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 25,
    elevation: 6,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
  },
  showcaseSection: {
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderTopWidth: 1,
  },
  showcaseHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  showcaseKicker: {
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  manageShowcaseText: {
    fontSize: 11,
    fontWeight: '800',
  },
  showcaseSlotGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  showcaseSlotCard: {
    flex: 1,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  showcaseIconCore: {
    marginBottom: 4,
  },
  showcaseItemName: {
    fontSize: 10,
    fontWeight: '800',
    textAlign: 'center',
  },
  showcaseItemAp: {
    fontSize: 8.5,
    fontWeight: '700',
    marginTop: 2,
  },
  showcaseSlotEmpty: {
    flex: 1,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderStyle: 'solid',
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  showcaseEmptyText: {
    fontSize: 9.5,
    fontWeight: '700',
  },
  lifetimeSection: {
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 16,
    borderTopWidth: 1,
  },
  lifetimeToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  lifetimeKicker: {
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  lifetimeGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: RADIUS.md,
    borderWidth: 1,
  },
  lifetimeCell: {
    flex: 1,
    alignItems: 'center',
  },
  lifetimeDivider: {
    width: 1,
    height: 18,
  },
  lifetimeVal: {
    fontSize: 13.5,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
  },
  lifetimeLabel: {
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.6,
    marginTop: 1,
  },
  expandedLifetimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: RADIUS.md,
    borderWidth: 1,
  },
  expandedCell: {
    flex: 1,
    alignItems: 'center',
  },
  expandedVal: {
    fontSize: 12.5,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
  },
  expandedLabel: {
    fontSize: 7.5,
    fontWeight: '800',
    letterSpacing: 0.6,
    marginTop: 2,
  },
});
