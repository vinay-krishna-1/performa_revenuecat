import React from 'react';
import { View, Text, StyleSheet, ImageBackground, TouchableOpacity, StyleProp, ViewStyle } from 'react-native';
import { COSMETIC_IMAGES } from '../../constants/Cosmetics';

export interface ApBadgeProps {
  points: number | string;
  prefix?: string; // e.g. '+'
  size?: 'sm' | 'md' | 'lg';
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  disabled?: boolean;
}

const AP_BADGE_CONFIGS = {
  sm: {
    width: 66,
    height: 22,
    fontSize: 8.5,
    letterSpacing: 0.4,
  },
  md: {
    width: 78,
    height: 26,
    fontSize: 10,
    letterSpacing: 0.5,
  },
  lg: {
    width: 96,
    height: 32,
    fontSize: 12,
    letterSpacing: 0.7,
  },
};

export const ApBadge: React.FC<ApBadgeProps> = ({
  points,
  prefix = '',
  size = 'md',
  style,
  onPress,
  disabled = false,
}) => {
  const config = AP_BADGE_CONFIGS[size] || AP_BADGE_CONFIGS.md;
  const formattedPoints = typeof points === 'number' ? points.toLocaleString() : points;
  const label = `${prefix}${formattedPoints} AP`;

  const content = (
    <ImageBackground
      source={COSMETIC_IMAGES.badges.ap}
      resizeMode="contain"
      style={styles.backgroundImage}
    >
      <View style={styles.textContainer}>
        <Text
          numberOfLines={1}
          ellipsizeMode="clip"
          style={[
            styles.text,
            {
              fontSize: config.fontSize,
              letterSpacing: config.letterSpacing,
            },
          ]}
        >
          {label}
        </Text>
      </View>
    </ImageBackground>
  );

  const containerStyle = [
    styles.container,
    {
      width: config.width,
      height: config.height,
    },
    style,
  ];

  if (onPress && !disabled) {
    return (
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={onPress}
        style={containerStyle}
      >
        {content}
      </TouchableOpacity>
    );
  }

  return <View style={containerStyle}>{content}</View>;
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  backgroundImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
  },
  textContainer: {
    flex: 1,
    paddingLeft: '32%',
    paddingRight: '6%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    color: '#FDE68A', // Radiant golden-amber luster matching the emblem star
    fontWeight: '900',
    textTransform: 'uppercase',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.95)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    includeFontPadding: false,
  },
});
