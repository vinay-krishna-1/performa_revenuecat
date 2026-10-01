import React from 'react';
import {
  Text,
  StyleSheet,
  TouchableOpacity,
  ImageBackground,
  View,
  StyleProp,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { COSMETIC_IMAGES } from '../../constants/Cosmetics';
import { RADIUS } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';

interface LimePlateButtonProps {
  children?: React.ReactNode;
  title?: string;
  icon?: React.ReactNode;
  onPress?: () => void;
  active?: boolean;
  size?: 'sm' | 'md' | 'lg';
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  disabled?: boolean;
}

const BUTTON_SIZES = {
  sm: { height: 28, paddingHorizontal: 12, fontSize: 10.5 },
  md: { height: 36, paddingHorizontal: 16, fontSize: 12 },
  lg: { height: 44, paddingHorizontal: 20, fontSize: 13.5 },
};

export const LimePlateButton: React.FC<LimePlateButtonProps> = ({
  children,
  title,
  icon,
  onPress,
  active = true,
  size = 'md',
  style,
  textStyle,
  disabled = false,
}) => {
  const { colors, isDark } = useTheme();
  const conf = BUTTON_SIZES[size];

  if (active) {
    return (
      <TouchableOpacity
        activeOpacity={0.82}
        onPress={onPress}
        disabled={disabled}
        style={[styles.wrapper, { height: conf.height }, style]}
      >
        <ImageBackground
          source={COSMETIC_IMAGES.buttons.limePlate}
          style={styles.imageBg}
          resizeMode="stretch"
        >
          <View style={[styles.innerRow, { paddingHorizontal: conf.paddingHorizontal }]}>
            {icon ? <View style={styles.iconMargin}>{icon}</View> : null}
            {title ? (
              <Text
                style={[
                  styles.activeText,
                  { fontSize: conf.fontSize },
                  textStyle,
                ]}
                numberOfLines={1}
              >
                {title}
              </Text>
            ) : null}
            {children}
          </View>
        </ImageBackground>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      activeOpacity={0.75}
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.inactiveWrapper,
        {
          height: conf.height,
          paddingHorizontal: conf.paddingHorizontal,
          backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#F1F5F9',
          borderColor: isDark ? 'rgba(255, 255, 255, 0.10)' : colors.surfaceBorder,
        },
        style,
      ]}
    >
      {icon ? <View style={styles.iconMargin}>{icon}</View> : null}
      {title ? (
        <Text
          style={[
            styles.inactiveText,
            { fontSize: conf.fontSize, color: colors.textSecondary },
            textStyle,
          ]}
          numberOfLines={1}
        >
          {title}
        </Text>
      ) : null}
      {children}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: RADIUS.full,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageBg: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  innerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconMargin: {
    marginRight: 6,
  },
  activeText: {
    fontWeight: '900',
    color: '#000000',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  inactiveWrapper: {
    borderRadius: RADIUS.full,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inactiveText: {
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
});
