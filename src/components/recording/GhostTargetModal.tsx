import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  LayoutAnimation,
  Alert,
  Image,
} from 'react-native';
import { COSMETIC_IMAGES } from '../../constants/Cosmetics';
import {
  Zap,
  Award,
  User,
  Users,
  X,
  ChevronRight,
  Shield,
  Ban,
  MapPin,
  Lock,
} from 'lucide-react-native';
import { RADIUS } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';
import { RouteItem, GhostData } from '../../types';
import { RouteService, DEFAULT_ROUTES } from '../../features/routes/RouteService';
import { GhostEngine } from '../../features/ghost/GhostEngine';
import { useAuth } from '../../features/auth/AuthContext';
import { SyncService } from '../../services/SyncService';

interface GhostTargetModalProps {
  visible: boolean;
  onClose: () => void;
  activeRoute: RouteItem | null;
  currentGhost?: GhostData | null;
  onSelectGhost: (ghost: GhostData) => void;
  onDisableGhost?: () => void;
}

export function GhostTargetModal({
  visible,
  onClose,
  activeRoute,
  currentGhost,
  onSelectGhost,
  onDisableGhost,
}: GhostTargetModalProps) {
  const { colors, isDark } = useTheme();
  const { user } = useAuth();
  const [userActivityCount, setUserActivityCount] = useState<number>(user?.lifetimeActivitiesCount || 0);
  const route = activeRoute || DEFAULT_ROUTES[0];

  useEffect(() => {
    if (visible) {
      SyncService.getInstance()
        .getAllActivities(user?.id)
        .then((acts) => {
          setUserActivityCount(Math.max(acts.length, user?.lifetimeActivitiesCount || 0));
        })
        .catch(() => {});
    }
  }, [visible, user?.id, user?.lifetimeActivitiesCount]);

  const formatDuration = (totalSec: number) => {
    const m = Math.floor(totalSec / 60);
    const s = Math.round(totalSec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleSelectCourseRecord = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    const ghost = RouteService.getInstance().createGhostFromRoute(route);
    onSelectGhost(ghost);
    onClose();
  };

  const handleSelectPersonalBest = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    const pbSeconds = Math.max(
      60,
      Math.round(route.recordTimeSeconds * 1.08)
    );
    const ghost = GhostEngine.createTargetPaceGhost(
      route,
      Math.round(pbSeconds / (route.distanceMeters / 1000)),
      `${user?.displayName || 'My'} Personal Best`
    );
    onSelectGhost(ghost);
    onClose();
  };

  const handleSelectClanRival = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    const ghost = GhostEngine.createTargetPaceGhost(
      route,
      Math.round((route.recordTimeSeconds * 1.04) / (route.distanceMeters / 1000)),
      user?.clanName ? `[${user.clanName}] Clan Rival` : 'Apex Clan Pacer'
    );
    onSelectGhost(ghost);
    onClose();
  };

  const handleDisable = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    onDisableGhost?.();
    onClose();
  };

  return (
    <>
      <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
        <View style={styles.overlay}>
          <View
            style={[
              styles.container,
              {
                backgroundColor: isDark ? '#0D0D12' : '#FFFFFF',
                borderColor: colors.surfaceBorder,
              },
            ]}
          >
            <View style={StyleSheet.absoluteFill}>
              <Image
                source={COSMETIC_IMAGES.backgrounds.cyberLines}
                style={StyleSheet.absoluteFill}
                resizeMode="cover"
              />
              <View
                style={[
                  StyleSheet.absoluteFill,
                  { backgroundColor: isDark ? 'rgba(13, 13, 18, 0.88)' : 'rgba(255, 255, 255, 0.90)' },
                ]}
              />
            </View>

            {/* Header */}
            <View style={[styles.header, { borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.07)' : 'rgba(0, 0, 0, 0.08)' }]}>
              <View style={{ flex: 1 }}>
                <View style={styles.kickerRow}>
                  <Zap size={11} color="#A855F7" />
                  <Text style={[styles.kicker, { color: '#A855F7' }]}>ASYNCHRONOUS GHOST RACING</Text>
                </View>
                <Text style={[styles.title, { color: colors.textPrimary }]}>Choose Ghost Opponent</Text>
                <Text style={[styles.subtitle, { color: colors.textMuted }]}>
                  {activeRoute ? `${activeRoute.title} • ${(activeRoute.distanceMeters / 1000).toFixed(1)} km` : 'Real-time GPS Pacing Competitor'}
                </Text>
              </View>

              <TouchableOpacity
                activeOpacity={0.7}
                onPress={onClose}
                style={[
                  styles.closeBtn,
                  {
                    borderColor: colors.surfaceBorder,
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)',
                  },
                ]}
              >
                <X size={15} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
              {/* Active Ghost Status Banner if ghost enabled */}
              {currentGhost && (
                <View
                  style={[
                    styles.activeGhostBanner,
                    {
                      backgroundColor: isDark ? 'rgba(168, 85, 247, 0.08)' : '#F3E8FF',
                      borderColor: '#A855F7',
                    },
                  ]}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
                    <Zap size={16} color="#A855F7" />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.activeGhostTitle, { color: colors.textPrimary }]}>
                        ACTIVE: {currentGhost.athleteName}
                      </Text>
                      <Text style={[styles.activeGhostSub, { color: colors.textMuted }]}>
                        Target finish {formatDuration(currentGhost.totalDurationSeconds)}
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={handleDisable}
                    style={styles.turnOffInlineBtn}
                  >
                    <Text style={styles.turnOffInlineBtnText}>TURN OFF</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* 1. Course Record Ghost (ONLY if activeRoute is loaded) */}
              {activeRoute ? (
                <TouchableOpacity
                  activeOpacity={0.75}
                  onPress={handleSelectCourseRecord}
                  style={[
                    styles.optionRow,
                    {
                      borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)',
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.iconBox,
                      { backgroundColor: isDark ? 'rgba(234, 179, 8, 0.12)' : 'rgba(217, 119, 6, 0.1)' },
                    ]}
                  >
                    <Award size={18} color={colors.gold} />
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={[styles.optionTitle, { color: colors.textPrimary }]}>
                        Course Record Ghost
                      </Text>
                      <View style={[styles.tagPill, { backgroundColor: colors.gold }]}>
                        <Text style={styles.tagPillText}>#1 CR</Text>
                      </View>
                    </View>
                    <Text style={[styles.optionDesc, { color: colors.textMuted }]}>
                      Race {route.recordHolderName}'s verified course record ({formatDuration(route.recordTimeSeconds)})
                    </Text>
                  </View>
                  <ChevronRight size={15} color={colors.textMuted} />
                </TouchableOpacity>
              ) : null}

              {/* 2. Personal Best Ghost (Beat the Best You) */}
              {userActivityCount > 0 ? (
                <TouchableOpacity
                  activeOpacity={0.75}
                  onPress={handleSelectPersonalBest}
                  style={[
                    styles.optionRow,
                    {
                      borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)',
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.iconBox,
                      { backgroundColor: isDark ? 'rgba(204, 255, 0, 0.12)' : 'rgba(0, 82, 255, 0.1)' },
                    ]}
                  >
                    <User size={18} color={colors.accent} />
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={[styles.optionTitle, { color: colors.textPrimary }]}>
                        Beat the Best You (Personal Best)
                      </Text>
                      <View style={[styles.tagPill, { backgroundColor: colors.accent }]}>
                        <Text style={[styles.tagPillText, { color: isDark ? '#000000' : '#FFFFFF' }]}>PB</Text>
                      </View>
                    </View>
                    <Text style={[styles.optionDesc, { color: colors.textMuted }]}>
                      Race against your own historical personal best split times
                    </Text>
                  </View>
                  <ChevronRight size={15} color={colors.textMuted} />
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  activeOpacity={0.75}
                  onPress={() =>
                    Alert.alert(
                      'Personal Best Ghost Locked',
                      'Complete your first recorded activity to unlock your Personal Best Ghost. Your pace will become the baseline target to beat!',
                      [{ text: 'Got it' }]
                    )
                  }
                  style={[
                    styles.optionRow,
                    {
                      opacity: 0.75,
                      borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)',
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.iconBox,
                      { backgroundColor: isDark ? '#161B22' : '#F1F5F9' },
                    ]}
                  >
                    <Lock size={16} color={colors.textMuted} />
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={[styles.optionTitle, { color: colors.textSecondary }]}>
                        Beat the Best You (Personal Best)
                      </Text>
                      <View style={[styles.tagPill, { backgroundColor: isDark ? '#2D3748' : '#CBD5E1' }]}>
                        <Text style={[styles.tagPillText, { color: colors.textMuted }]}>1ST RUN REQUIRED</Text>
                      </View>
                    </View>
                    <Text style={[styles.optionDesc, { color: colors.textMuted }]}>
                      Complete your first recorded activity to unlock your Personal Best Ghost
                    </Text>
                  </View>
                  <Lock size={13} color={colors.textMuted} />
                </TouchableOpacity>
              )}

              {/* 3. Clan & Syndicate Rival */}
              <TouchableOpacity
                activeOpacity={0.75}
                onPress={handleSelectClanRival}
                style={[
                  styles.optionRow,
                  {
                    borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)',
                  },
                ]}
              >
                <View
                  style={[
                    styles.iconBox,
                    { backgroundColor: isDark ? 'rgba(168, 85, 247, 0.14)' : 'rgba(147, 51, 234, 0.1)' },
                  ]}
                >
                  <Users size={18} color="#A855F7" />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={[styles.optionTitle, { color: colors.textPrimary }]}>
                    {user?.clanName ? `[${user.clanName}] Clan Rival Ghost` : 'Syndicate Rival Ghost'}
                  </Text>
                  <Text style={[styles.optionDesc, { color: colors.textMuted }]}>
                    {user?.clanName
                      ? `Challenge your clan's median split pace to boost your collective ranking`
                      : `Race against the community division pace to test and sharpen your speed`}
                  </Text>
                </View>
                <ChevronRight size={15} color={colors.textMuted} />
              </TouchableOpacity>

              {/* Bottom course prompt if no route loaded */}
              {!activeRoute && (
                <View style={[styles.routeNoticeCard, { backgroundColor: isDark ? '#141A22' : '#F8FAFC', borderColor: colors.surfaceBorder }]}>
                  <MapPin size={13} color={colors.accent} />
                  <Text style={[styles.routeNoticeText, { color: colors.textMuted }]}>
                    To challenge Course Record Ghosts, select a route from the Routes tab.
                  </Text>
                </View>
              )}

              {/* Turn Off Ghost Option */}
              {onDisableGhost && (
                <TouchableOpacity
                  activeOpacity={0.75}
                  onPress={handleDisable}
                  style={[styles.disableGhostBtn, { borderColor: colors.surfaceBorder }]}
                >
                  <Ban size={14} color={colors.textMuted} />
                  <Text style={[styles.disableGhostBtnText, { color: colors.textMuted }]}>
                    Turn Off Ghost Mode (Free Run)
                  </Text>
                </TouchableOpacity>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  container: {
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    borderWidth: 1,
    maxHeight: '75%',
    paddingBottom: 24,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  kickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 3,
  },
  kicker: {
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  helpIconBtn: {
    padding: 2,
    marginLeft: 2,
  },
  title: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.4,
  },
  subtitle: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  activeGhostBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    marginBottom: 12,
  },
  activeGhostTitle: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  activeGhostSub: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 1,
  },
  turnOffInlineBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: 'rgba(168, 85, 247, 0.2)',
    borderRadius: 6,
  },
  turnOffInlineBtnText: {
    color: '#A855F7',
    fontSize: 9.5,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionTitle: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  optionDesc: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
    lineHeight: 15,
  },
  tagPill: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  tagPillText: {
    color: '#000000',
    fontSize: 8,
    fontWeight: '900',
  },
  disableGhostBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    marginTop: 16,
    marginBottom: 8,
    borderRadius: RADIUS.md,
    borderWidth: 1,
  },
  disableGhostBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  routeNoticeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    marginTop: 14,
  },
  routeNoticeText: {
    fontSize: 11,
    fontWeight: '600',
    flex: 1,
    lineHeight: 15,
  },
});
