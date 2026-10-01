import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { RADIUS, SPACING } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';
import { DivisionBadge } from './DivisionBadge';

interface PRProgressProps {
  currentDivision: string;
  currentTier: number;
  currentPr: number;
  nextTierDivision: string;
  nextTier: number;
  prToPromotion: number;
  progressPercent: number; // 0 to 100
  style?: ViewStyle;
}

export const PRProgress: React.FC<PRProgressProps> = ({
  currentDivision,
  currentTier,
  currentPr,
  nextTierDivision,
  nextTier,
  prToPromotion,
  progressPercent,
  style,
}) => {
  const { colors } = useTheme();
  const clampedProgress = Math.min(Math.max(progressPercent, 0), 100);

  return (
    <View style={[styles.container, style]}>
      {/* Header Row */}
      <View style={styles.headerRow}>
        <DivisionBadge division={currentDivision} tier={currentTier} size="md" />
        <View style={styles.prValueContainer}>
          <Text style={[styles.prValue, { color: colors.textPrimary }]}>{currentPr.toLocaleString()}</Text>
          <Text style={[styles.prLabel, { color: colors.textMuted }]}> PR</Text>
        </View>
      </View>

      {/* High-Precision Progress Track */}
      <View style={[styles.track, { backgroundColor: colors.surfaceBorder }]}>
        <View style={[styles.fill, { width: `${clampedProgress}%`, backgroundColor: colors.accent }]} />
      </View>

      {/* Promotion target */}
      <View style={styles.footerRow}>
        <Text style={[styles.promotionText, { color: colors.textSecondary }]}>
          <Text style={[styles.highlightText, { color: colors.accent }]}>{prToPromotion} PR</Text> to {nextTierDivision} {nextTier > 0 ? `Tier ${nextTier}` : ''}
        </Text>
        <Text style={[styles.percentText, { color: colors.textMuted }]}>{Math.round(clampedProgress)}%</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs + 2,
  },
  prValueContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  prValue: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.6,
  },
  prLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  track: {
    height: 4,
    borderRadius: RADIUS.full,
    overflow: 'hidden',
    marginVertical: SPACING.xs,
  },
  fill: {
    height: '100%',
    borderRadius: RADIUS.full,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
  },
  promotionText: {
    fontSize: 12,
    fontWeight: '500',
  },
  highlightText: {
    fontWeight: '700',
  },
  percentText: {
    fontSize: 11,
    fontWeight: '600',
  },
});
