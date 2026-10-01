import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { PerformaCard } from './PerformaCard';
import { COLORS, SPACING } from '../../constants/theme';

interface StatCardProps {
  label: string;
  value: string | number;
  unit?: string;
  icon?: React.ReactNode;
  subtitle?: string;
  highlight?: 'accent' | 'primary' | 'warning' | 'default';
  style?: ViewStyle;
  onPress?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  unit,
  icon,
  subtitle,
  highlight = 'default',
  style,
  onPress,
}) => {
  const getValueColor = () => {
    switch (highlight) {
      case 'accent':
        return COLORS.accent;
      case 'primary':
        return COLORS.primaryBright;
      case 'warning':
        return COLORS.warning;
      case 'default':
      default:
        return COLORS.textPrimary;
    }
  };

  return (
    <PerformaCard style={style} onPress={onPress} padding="md">
      <View style={styles.headerRow}>
        <Text style={styles.label}>{label}</Text>
        {icon && <View style={styles.iconContainer}>{icon}</View>}
      </View>
      <View style={styles.valueRow}>
        <Text style={[styles.value, { color: getValueColor() }]}>{value}</Text>
        {unit && <Text style={styles.unit}>{unit}</Text>}
      </View>
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
    </PerformaCard>
  );
};

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.0,
    textTransform: 'uppercase',
    color: COLORS.textMuted,
  },
  iconContainer: {
    opacity: 0.6,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  value: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.6,
  },
  unit: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    marginLeft: 3,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 11,
    fontWeight: '500',
    color: COLORS.textMuted,
    marginTop: 2,
  },
});
