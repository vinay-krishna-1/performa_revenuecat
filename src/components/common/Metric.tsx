import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

interface MetricProps {
  value: string | number;
  label: string;
  unit?: string;
  size?: 'sm' | 'md' | 'lg' | 'hero';
  highlight?: 'accent' | 'primary' | 'warning' | 'default';
  align?: 'left' | 'center' | 'right';
  style?: ViewStyle;
}

export const Metric: React.FC<MetricProps> = ({
  value,
  label,
  unit,
  size = 'md',
  highlight = 'default',
  align = 'left',
  style,
}) => {
  const { colors } = useTheme();

  const getValueColor = () => {
    switch (highlight) {
      case 'accent':
        return colors.accent;
      case 'primary':
        return colors.primaryBright;
      case 'warning':
        return colors.warning;
      case 'default':
      default:
        return colors.textPrimary;
    }
  };

  const getValueSizeStyle = () => {
    switch (size) {
      case 'hero':
        return styles.valHero;
      case 'lg':
        return styles.valLg;
      case 'sm':
        return styles.valSm;
      case 'md':
      default:
        return styles.valMd;
    }
  };

  const alignmentStyle = {
    alignItems: align === 'center' ? 'center' : align === 'right' ? 'flex-end' : 'flex-start',
  } as const;

  return (
    <View style={[styles.container, alignmentStyle, style]}>
      <View style={styles.numberRow}>
        <Text style={[getValueSizeStyle(), { color: getValueColor() }]}>
          {value}
        </Text>
        {unit ? (
          <Text style={[styles.unitText, { color: colors.textMuted }]}>
            {' '}{unit}
          </Text>
        ) : null}
      </View>
      <Text style={[styles.label, { color: colors.textMuted, textAlign: align }]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
  },
  numberRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  valHero: {
    fontSize: 48,
    fontWeight: '900',
    letterSpacing: -1.5,
    lineHeight: 52,
  },
  valLg: {
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -0.8,
    lineHeight: 38,
  },
  valMd: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.4,
    lineHeight: 28,
  },
  valSm: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.2,
    lineHeight: 22,
  },
  unitText: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginLeft: 3,
    letterSpacing: 0.5,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.0,
    textTransform: 'uppercase',
    marginTop: 3,
  },
});
