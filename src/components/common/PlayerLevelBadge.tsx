import React from 'react';
import { View, Text, StyleSheet, ImageBackground, TouchableOpacity, StyleProp, ViewStyle } from 'react-native';
import { COSMETIC_IMAGES } from '../../constants/Cosmetics';

interface PlayerLevelBadgeProps {
  level: number;
  size?: 'sm' | 'md' | 'lg';
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}

const BADGE_SIZES = {
  sm: { width: 92, height: 30, fontSize: 11, paddingLeft: 26 },
  md: { width: 110, height: 36, fontSize: 13, paddingLeft: 30 },
  lg: { width: 132, height: 44, fontSize: 15, paddingLeft: 36 },
};

export const PlayerLevelBadge: React.FC<PlayerLevelBadgeProps> = ({
  level,
  size = 'md',
  onPress,
  style,
}) => {
  const conf = BADGE_SIZES[size];

  const content = (
    <ImageBackground
      source={COSMETIC_IMAGES.buttons.levelPlate}
      style={[styles.bg, { width: conf.width, height: conf.height }]}
      resizeMode="contain"
    >
      <View style={[styles.textWrap, { paddingLeft: conf.paddingLeft }]}>
        <Text
          numberOfLines={1}
          style={[styles.levelText, { fontSize: conf.fontSize }]}
        >
          LVL {level}
        </Text>
      </View>
    </ImageBackground>
  );

  if (onPress) {
    return (
      <TouchableOpacity activeOpacity={0.8} onPress={onPress} style={style}>
        {content}
      </TouchableOpacity>
    );
  }

  return <View style={style}>{content}</View>;
};

const styles = StyleSheet.create({
  bg: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  textWrap: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingRight: 6,
  },
  levelText: {
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.8,
    textShadowColor: 'rgba(0, 0, 0, 0.9)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
    includeFontPadding: false,
  },
});
