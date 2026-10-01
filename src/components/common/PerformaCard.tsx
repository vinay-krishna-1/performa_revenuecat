import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp, TouchableOpacity } from 'react-native';
import { RADIUS, SPACING } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';

interface PerformaCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  elevated?: boolean;
  accentBorder?: boolean;
  seamless?: boolean;
  onPress?: () => void;
  padding?: keyof typeof SPACING | 'none';
}

export const PerformaCard: React.FC<PerformaCardProps> = ({
  children,
  style,
  elevated = false,
  accentBorder = false,
  seamless = false,
  onPress,
  padding = 'md',
}) => {
  const { colors, isDark } = useTheme();

  if (seamless) {
    if (onPress) {
      return (
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={onPress}
          style={[{ padding: padding === 'none' ? 0 : SPACING[padding] }, style]}
        >
          {children}
        </TouchableOpacity>
      );
    }
    return (
      <View style={[{ padding: padding === 'none' ? 0 : SPACING[padding] }, style]}>
        {children}
      </View>
    );
  }

  const containerStyle = [
    styles.card,
    {
      backgroundColor: elevated ? colors.surfaceElevated : colors.surface,
      borderColor: accentBorder ? colors.accent : colors.surfaceBorder,
    },
    { padding: padding === 'none' ? 0 : SPACING[padding] },
    style,
  ];

  if (onPress) {
    return (
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={onPress}
        style={containerStyle}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={containerStyle}>{children}</View>;
};

const styles = StyleSheet.create({
  card: {
    borderRadius: RADIUS.md,
    borderWidth: 1,
  },
});
