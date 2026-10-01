import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { RADIUS, SPACING } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';

interface XPProgressProps {
  level: number;
  currentXp: number;
  nextLevelXp: number;
  style?: ViewStyle;
}

export const XPProgress: React.FC<XPProgressProps> = ({
  level,
  currentXp,
  nextLevelXp,
  style,
}) => {
  const { colors, isDark } = useTheme();
  const progress = nextLevelXp > 0 ? Math.min(Math.max((currentXp / nextLevelXp) * 100, 0), 100) : 0;

  return (
    <View style={[styles.container, style]}>
      <View style={styles.headerRow}>
        <View
          style={[
            styles.levelBadge,
            {
              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 82, 255, 0.08)',
              borderColor: colors.surfaceBorder,
            },
          ]}
        >
          <Text style={[styles.levelText, { color: isDark ? '#FFFFFF' : colors.primary }]}>LVL {level}</Text>
        </View>
        <Text style={styles.xpText}>
          <Text style={[styles.xpCurrent, { color: colors.textPrimary }]}>{currentXp.toLocaleString()}</Text>
          <Text style={[styles.xpTotal, { color: colors.textMuted }]}> / {nextLevelXp.toLocaleString()} XP</Text>
        </Text>
      </View>
      <View style={[styles.track, { backgroundColor: colors.surfaceBorder }]}>
        <View style={[styles.fill, { width: `${progress}%`, backgroundColor: colors.accent }]} />
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
    marginBottom: 6,
  },
  levelBadge: {
    borderWidth: 1,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
  },
  levelText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  xpText: {
    fontSize: 12,
  },
  xpCurrent: {
    fontWeight: '800',
  },
  xpTotal: {
    fontWeight: '500',
  },
  track: {
    height: 4,
    borderRadius: RADIUS.full,
    overflow: 'hidden',
    marginTop: 4,
  },
  fill: {
    height: '100%',
    borderRadius: RADIUS.full,
  },
});
