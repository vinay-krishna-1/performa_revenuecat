import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import {
  Trophy,
  Award,
  Check,
  Lock,
  Star,
  Sparkles,
  Gift,
} from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { RADIUS } from '../../constants/theme';
import {
  AchievementCategory,
  AchievementDefinition,
  UserAchievementState,
  RARITY_COLORS,
} from '../../features/achievements/AchievementTypes';
import { AchievementService } from '../../features/achievements/AchievementService';
import { ApBadge } from '../common';

interface AchievementsTabProps {
  onShowcaseChanged?: () => void;
}

const CATEGORIES: { id: 'ALL' | AchievementCategory; label: string }[] = [
  { id: 'ALL', label: 'All' },
  { id: 'ACTIVITY', label: 'Workouts' },
  { id: 'DISTANCE', label: 'Distance' },
  { id: 'PROGRESS', label: 'Progress' },
  { id: 'CONSISTENCY', label: 'Streaks' },
  { id: 'EXPLORATION', label: 'Explore' },
  { id: 'GHOSTS', label: 'Ghosts' },
  { id: 'SOCIAL', label: 'Social' },
  { id: 'COMPETITIVE', label: 'Competitive' },
  { id: 'VARIETY', label: 'Variety' },
];

export function AchievementsTab({ onShowcaseChanged }: AchievementsTabProps) {
  const { colors, isDark } = useTheme();
  const service = AchievementService.getInstance();

  const [selectedCategory, setSelectedCategory] = useState<'ALL' | AchievementCategory>('ALL');
  const [achievements, setAchievements] = useState<
    { definition: AchievementDefinition; state: UserAchievementState }[]
  >([]);
  const [showcasedIds, setShowcasedIds] = useState<string[]>([]);
  const [totalAp, setTotalAp] = useState(0);

  const loadData = useCallback(() => {
    setAchievements(service.getAchievements());
    setShowcasedIds(service.getShowcasedAchievements().map((a) => a.id));
    setTotalAp(service.getTotalPoints());
  }, [service]);

  useEffect(() => {
    loadData();
    const unsub = service.subscribeUnlock(() => {
      loadData();
    });
    return unsub;
  }, [loadData, service]);

  const filteredAchievements = useMemo(() => {
    if (selectedCategory === 'ALL') return achievements;
    return achievements.filter((a) => a.definition.category === selectedCategory);
  }, [achievements, selectedCategory]);

  const unlockedCount = useMemo(() => {
    return achievements.filter((a) => a.state.unlocked).length;
  }, [achievements]);

  const handleToggleShowcase = async (def: AchievementDefinition, isCurrentlyShowcased: boolean) => {
    if (isCurrentlyShowcased) {
      const next = showcasedIds.filter((id) => id !== def.id);
      await service.setShowcasedAchievements(next);
      setShowcasedIds(next);
      onShowcaseChanged?.();
    } else {
      if (showcasedIds.length >= 3) {
        Alert.alert(
          'Showcase Limit',
          'You can showcase up to 3 honors on your athlete banner. Remove one first to equip this badge.'
        );
        return;
      }
      const next = [...showcasedIds, def.id];
      await service.setShowcasedAchievements(next);
      setShowcasedIds(next);
      onShowcaseChanged?.();
    }
  };

  return (
    <View style={styles.container}>
      {/* Seamless Prestige Score Header */}
      <View
        style={[
          styles.prestigeHeader,
          {
            borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
          },
        ]}
      >
        <View style={styles.prestigeTopRow}>
          <View>
            <Text style={[styles.prestigeKicker, { color: colors.textMuted }]}>
              GLOBAL PRESTIGE SCORE
            </Text>
            <View style={styles.scoreRow}>
              <Text style={[styles.scoreValue, { color: colors.textPrimary }]}>
                {totalAp.toLocaleString()}
              </Text>
              <Text style={[styles.scoreUnit, { color: colors.gold }]}>AP</Text>
            </View>
          </View>

          <View style={styles.unlockedBox}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Trophy size={13} color={colors.gold} />
              <Text style={[styles.unlockedText, { color: colors.textPrimary }]}>
                {unlockedCount} / {achievements.length}
              </Text>
            </View>
            <Text style={[styles.unlockedSub, { color: colors.textMuted }]}>
              UNLOCKED
            </Text>
          </View>
        </View>

        {/* Minimal Hairline Progress Bar */}
        <View style={[styles.trackBase, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)' }]}>
          <View
            style={[
              styles.trackFill,
              {
                width: `${Math.round((unlockedCount / (achievements.length || 1)) * 100)}%`,
                backgroundColor: colors.accent,
              },
            ]}
          />
        </View>
      </View>

      {/* Categories Filter Bar */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterScroll}
      >
        {CATEGORIES.map((cat) => {
          const isSelected = selectedCategory === cat.id;
          return (
            <TouchableOpacity
              key={cat.id}
              activeOpacity={0.7}
              onPress={() => setSelectedCategory(cat.id)}
              style={[
                styles.filterPill,
                {
                  backgroundColor: isSelected
                    ? isDark
                      ? 'rgba(204, 255, 0, 0.12)'
                      : 'rgba(0, 82, 255, 0.10)'
                    : 'transparent',
                  borderColor: isSelected
                    ? colors.accent
                    : isDark
                    ? 'rgba(255, 255, 255, 0.10)'
                    : 'rgba(0, 0, 0, 0.08)',
                },
              ]}
            >
              <Text
                style={[
                  styles.filterText,
                  {
                    color: isSelected ? colors.accent : colors.textMuted,
                    fontWeight: isSelected ? '800' : '600',
                  },
                ]}
              >
                {cat.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Seamless Achievement Rows (Zero Boxy Slop) */}
      <View style={styles.listContainer}>
        {filteredAchievements.map(({ definition: def, state }) => {
          const isUnlocked = state.unlocked;
          const isShowcased = showcasedIds.includes(def.id);
          const rarityConf = RARITY_COLORS[def.rarity];
          const progressPercent = Math.min(
            100,
            Math.round((state.progress / (def.target || 1)) * 100)
          );

          return (
            <View
              key={def.id}
              style={[
                styles.achievementRow,
                {
                  borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.05)',
                  opacity: isUnlocked ? 1 : 0.75,
                },
              ]}
            >
              {/* Left Column: Minimal Icon Ring */}
              <View
                style={[
                  styles.iconRing,
                  {
                    borderColor: isUnlocked ? rarityConf.text : (isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.12)'),
                    backgroundColor: isUnlocked ? rarityConf.bg : 'transparent',
                  },
                ]}
              >
                {isUnlocked ? (
                  <Award size={15} color={rarityConf.text} />
                ) : (
                  <Lock size={13} color={colors.textMuted} />
                )}
              </View>

              {/* Center Column: Meta */}
              <View style={styles.metaCol}>
                <View style={styles.titleLine}>
                  <Text style={[styles.achievementName, { color: colors.textPrimary }]} numberOfLines={1}>
                    {def.name}
                  </Text>
                  <View style={[styles.rarityPill, { borderColor: rarityConf.border }]}>
                    <Text style={[styles.rarityText, { color: rarityConf.text }]}>
                      {def.rarity}
                    </Text>
                  </View>
                </View>

                <Text style={[styles.achievementDesc, { color: colors.textSecondary }]}>
                  {def.description}
                </Text>

                {/* Progress Line (If locked) */}
                {!isUnlocked && (
                  <View style={styles.rowProgressWrap}>
                    <View style={[styles.rowProgressBar, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#E2E8F0' }]}>
                      <View
                        style={[
                          styles.rowProgressFill,
                          { width: `${progressPercent}%`, backgroundColor: rarityConf.text },
                        ]}
                      />
                    </View>
                    <Text style={[styles.rowProgressText, { color: colors.textMuted }]}>
                      {state.progress} / {def.target} ({progressPercent}%)
                    </Text>
                  </View>
                )}

                {/* Reward unlock tag if any */}
                {def.rewards && def.rewards.length > 0 && (
                  <View style={styles.rewardInline}>
                    <Gift size={10} color={colors.accent} />
                    <Text style={[styles.rewardInlineText, { color: colors.accent }]}>
                      Unlocks {def.rewards[0].name}
                    </Text>
                  </View>
                )}
              </View>

              {/* Right Column: AP Badge & Showcase Action */}
              <View style={styles.actionCol}>
                <ApBadge points={def.achievementPoints} prefix="+" size="sm" />

                {isUnlocked && (
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => handleToggleShowcase(def, isShowcased)}
                    style={[
                      styles.showcasePill,
                      {
                        backgroundColor: isShowcased
                          ? (isDark ? 'rgba(204, 255, 0, 0.15)' : 'rgba(0, 82, 255, 0.12)')
                          : 'transparent',
                        borderColor: isShowcased ? colors.accent : colors.surfaceBorder,
                      },
                    ]}
                  >
                    <Star
                      size={9}
                      color={isShowcased ? colors.accent : colors.textMuted}
                      fill={isShowcased ? colors.accent : 'none'}
                    />
                    <Text
                      style={[
                        styles.showcasePillText,
                        { color: isShowcased ? colors.accent : colors.textMuted },
                      ]}
                    >
                      {isShowcased ? 'EQUIPPED' : 'ADD'}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: 24,
  },
  prestigeHeader: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    marginBottom: 12,
  },
  prestigeTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  prestigeKicker: {
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
    marginTop: 2,
  },
  scoreValue: {
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  scoreUnit: {
    fontSize: 12,
    fontWeight: '900',
  },
  unlockedBox: {
    alignItems: 'flex-end',
  },
  unlockedText: {
    fontSize: 12,
    fontWeight: '800',
  },
  unlockedSub: {
    fontSize: 8.5,
    fontWeight: '800',
    letterSpacing: 0.6,
    marginTop: 2,
  },
  trackBase: {
    height: 3,
    borderRadius: 1.5,
    overflow: 'hidden',
  },
  trackFill: {
    height: '100%',
    borderRadius: 1.5,
  },
  filterScroll: {
    gap: 6,
    paddingBottom: 12,
  },
  filterPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    borderWidth: 1,
  },
  filterText: {
    fontSize: 10.5,
    letterSpacing: 0.3,
  },
  listContainer: {
    marginTop: 4,
  },
  achievementRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  iconRing: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  metaCol: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  titleLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 3,
  },
  achievementName: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  rarityPill: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 3,
    borderWidth: 1,
  },
  rarityText: {
    fontSize: 7.5,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  achievementDesc: {
    fontSize: 11,
    fontWeight: '500',
    lineHeight: 15,
  },
  rowProgressWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
  },
  rowProgressBar: {
    flex: 1,
    height: 3,
    borderRadius: 1.5,
    overflow: 'hidden',
  },
  rowProgressFill: {
    height: '100%',
    borderRadius: 1.5,
  },
  rowProgressText: {
    fontSize: 9,
    fontWeight: '700',
  },
  rewardInline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  rewardInlineText: {
    fontSize: 9.5,
    fontWeight: '700',
  },
  actionCol: {
    alignItems: 'flex-end',
    justifyContent: 'flex-start',
  },
  apText: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  showcasePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    marginTop: 8,
  },
  showcasePillText: {
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
});
