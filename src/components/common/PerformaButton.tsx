import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  View,
} from 'react-native';
import { RADIUS, SPACING } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';

export type ButtonVariant = 'primary' | 'secondary' | 'accent' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface PerformaButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
  fullWidth?: boolean;
}

export const PerformaButton: React.FC<PerformaButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  icon,
  iconRight,
  style,
  textStyle,
  fullWidth = true,
}) => {
  const { colors, isDark } = useTheme();

  const getVariantContainerStyle = (): ViewStyle => {
    switch (variant) {
      case 'accent':
        return { backgroundColor: colors.accent };
      case 'secondary':
        return {
          backgroundColor: colors.surfaceElevated,
          borderWidth: 1,
          borderColor: colors.surfaceBorder,
        };
      case 'ghost':
        return { backgroundColor: 'transparent' };
      case 'danger':
        return { backgroundColor: colors.danger };
      case 'primary':
      default:
        return { backgroundColor: colors.primary };
    }
  };

  const getVariantTextStyle = (): TextStyle => {
    switch (variant) {
      case 'accent':
        return { color: isDark ? '#000000' : '#FFFFFF', fontWeight: '800' };
      case 'secondary':
        return { color: colors.textPrimary, fontWeight: '700' };
      case 'ghost':
        return { color: colors.textSecondary, fontWeight: '600' };
      case 'danger':
        return { color: '#FFFFFF', fontWeight: '800' };
      case 'primary':
      default:
        return { color: isDark ? '#000000' : '#FFFFFF', fontWeight: '800' };
    }
  };

  const getContainerStyle = (): ViewStyle[] => {
    const list: ViewStyle[] = [styles.base];
    if (fullWidth) list.push(styles.fullWidth);

    switch (size) {
      case 'sm':
        list.push(styles.sizeSm);
        break;
      case 'lg':
        list.push(styles.sizeLg);
        break;
      case 'md':
      default:
        list.push(styles.sizeMd);
        break;
    }

    list.push(getVariantContainerStyle());

    if (disabled || loading) {
      list.push(styles.disabled);
    }

    if (style) {
      list.push(style);
    }

    return list;
  };

  const getTextStyle = (): TextStyle[] => {
    const list: TextStyle[] = [styles.textBase];

    switch (size) {
      case 'sm':
        list.push(styles.textSm);
        break;
      case 'lg':
        list.push(styles.textLg);
        break;
      case 'md':
      default:
        list.push(styles.textMd);
        break;
    }

    list.push(getVariantTextStyle());

    if (textStyle) {
      list.push(textStyle);
    }

    return list;
  };

  return (
    <TouchableOpacity
      activeOpacity={0.82}
      onPress={onPress}
      disabled={disabled || loading}
      style={getContainerStyle()}
      accessibilityRole="button"
      accessibilityLabel={title}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={isDark ? '#000000' : '#FFFFFF'}
        />
      ) : (
        <View style={styles.contentRow}>
          {icon && <View style={styles.iconLeft}>{icon}</View>}
          <Text style={getTextStyle()}>{title}</Text>
          {iconRight && <View style={styles.iconRight}>{iconRight}</View>}
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  fullWidth: {
    width: '100%',
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconLeft: {
    marginRight: 6,
  },
  iconRight: {
    marginLeft: 6,
  },
  sizeSm: {
    height: 36,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.sm,
  },
  sizeMd: {
    height: 46,
    paddingHorizontal: SPACING.lg,
  },
  sizeLg: {
    height: 52,
    paddingHorizontal: SPACING.xl,
  },
  disabled: {
    opacity: 0.4,
  },
  textBase: {
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  textSm: {
    fontSize: 12,
  },
  textMd: {
    fontSize: 14,
  },
  textLg: {
    fontSize: 15,
    letterSpacing: 0.8,
  },
});
