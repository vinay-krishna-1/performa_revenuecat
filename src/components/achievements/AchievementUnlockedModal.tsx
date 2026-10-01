import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Award,
  Trophy,
  Sparkles,
  Gift,
  X,
  Check,
} from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { RADIUS, SPACING } from '../../constants/theme';
import {
  AchievementDefinition,
  RARITY_COLORS,
} from '../../features/achievements/AchievementTypes';
import { PerformaButton, ApBadge } from '../common';

interface AchievementUnlockedModalProps {
  visible: boolean;
  onClose: () => void;
  achievement: AchievementDefinition | null;
  onEquipReward?: (assetId: string) => void;
}

export function AchievementUnlockedModal({
  visible,
  onClose,
  achievement,
  onEquipReward,
}: AchievementUnlockedModalProps) {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  if (!achievement) return null;

  const rarityConf = RARITY_COLORS[achievement.rarity];
  const hasReward = achievement.rewards && achievement.rewards.length > 0;
  const primaryReward = hasReward ? achievement.rewards[0] : null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={[styles.overlay, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 }]}>
        <View
          style={[
            styles.card,
            {
              backgroundColor: isDark ? '#0D0D12' : '#FFFFFF',
              borderColor: rarityConf.border,
              shadowColor: rarityConf.text,
            },
          ]}
        >
          {/* Close button */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={onClose}
            style={[styles.closeBtn, { borderColor: colors.surfaceBorder }]}
          >
            <X size={15} color={colors.textSecondary} />
          </TouchableOpacity>

          {/* Glowing Hero Icon */}
          <View
            style={[
              styles.iconBurstOuter,
              {
                borderColor: rarityConf.text,
                backgroundColor: rarityConf.bg,
                shadowColor: rarityConf.text,
              },
            ]}
          >
            <Award size={36} color={rarityConf.text} strokeWidth={2.2} />
          </View>

          {/* Kicker */}
          <View style={styles.kickerRow}>
            <Sparkles size={12} color={colors.accent} />
            <Text style={[styles.kickerText, { color: colors.accent }]}>
              ACHIEVEMENT UNLOCKED
            </Text>
            <Sparkles size={12} color={colors.accent} />
          </View>

          {/* Title & Rarity */}
          <Text style={[styles.title, { color: colors.textPrimary }]}>
            {achievement.name}
          </Text>

          <View style={[styles.rarityPill, { borderColor: rarityConf.border, backgroundColor: rarityConf.bg }]}>
            <Text style={[styles.rarityText, { color: rarityConf.text }]}>
              {achievement.rarity}
            </Text>
          </View>

          {/* Description */}
          <Text style={[styles.description, { color: colors.textSecondary }]}>
            {achievement.description}
          </Text>

          {/* AP Earned Callout */}
          <View
            style={[
              styles.apEarnedBox,
              {
                backgroundColor: isDark ? '#141A22' : '#F8FAFC',
                borderColor: colors.surfaceBorder,
              },
            ]}
          >
            <ApBadge points={achievement.achievementPoints} prefix="+" size="md" />
            <Text style={[styles.apEarnedText, { color: colors.textPrimary }]}>
              Activity Points Awarded
            </Text>
          </View>

          {/* Unlocked Reward Callout (e.g. Frame) */}
          {primaryReward && (
            <View
              style={[
                styles.rewardUnlockedCard,
                {
                  backgroundColor: isDark ? 'rgba(204, 255, 0, 0.08)' : 'rgba(0, 82, 255, 0.08)',
                  borderColor: isDark ? 'rgba(204, 255, 0, 0.35)' : 'rgba(0, 82, 255, 0.30)',
                },
              ]}
            >
              <Gift size={16} color={colors.accent} />
              <View style={{ flex: 1, marginLeft: 8 }}>
                <Text style={[styles.rewardTitle, { color: colors.accent }]}>
                  NEW REWARD UNLOCKED!
                </Text>
                <Text style={[styles.rewardName, { color: colors.textPrimary }]}>
                  {primaryReward.name}
                </Text>
              </View>
            </View>
          )}

          {/* Actions */}
          <View style={styles.actionRow}>
            {primaryReward && primaryReward.type === 'FRAME' && onEquipReward ? (
              <PerformaButton
                title="EQUIP FRAME"
                onPress={() => {
                  onEquipReward(primaryReward.assetId);
                  onClose();
                }}
                variant="accent"
                size="md"
                style={{ flex: 1 }}
              />
            ) : null}

            <PerformaButton
              title="AWESOME"
              onPress={onClose}
              variant={primaryReward && primaryReward.type === 'FRAME' ? 'secondary' : 'accent'}
              size="md"
              style={{ flex: 1 }}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.88)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  card: {
    width: '100%',
    borderRadius: RADIUS.xl,
    borderWidth: 1.5,
    paddingHorizontal: 20,
    paddingTop: 28,
    paddingBottom: 20,
    alignItems: 'center',
    position: 'relative',
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 12,
  },
  closeBtn: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBurstOuter: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    shadowOpacity: 0.7,
    shadowRadius: 12,
    elevation: 6,
  },
  kickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  kickerText: {
    fontSize: 10.5,
    fontWeight: '900',
    letterSpacing: 1.2,
  },
  title: {
    fontSize: 20,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  rarityPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    marginTop: 6,
    marginBottom: 10,
  },
  rarityText: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  description: {
    fontSize: 12.5,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
    paddingHorizontal: 10,
  },
  apEarnedBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    gap: 8,
    width: '100%',
    justifyContent: 'center',
    marginBottom: 12,
  },
  apEarnedText: {
    fontSize: 12,
    fontWeight: '800',
  },
  rewardUnlockedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    width: '100%',
    marginBottom: 16,
  },
  rewardTitle: {
    fontSize: 9.5,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  rewardName: {
    fontSize: 13,
    fontWeight: '800',
    marginTop: 1,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
    marginTop: 4,
  },
});
