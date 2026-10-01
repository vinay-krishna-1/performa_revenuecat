import React from 'react';
import { View, Image, StyleSheet } from 'react-native';
import { COSMETIC_IMAGES } from '../../constants/Cosmetics';
import { useTheme } from '../../context/ThemeContext';

interface ScreenBackgroundProps {
  opacity?: number;
  variant?: 'wallpaper' | 'cyberLines';
}

export const ScreenBackground: React.FC<ScreenBackgroundProps> = ({
  opacity = 1,
  variant = 'wallpaper',
}) => {
  const { isDark } = useTheme();
  const source =
    variant === 'cyberLines'
      ? COSMETIC_IMAGES.backgrounds.cyberLines
      : COSMETIC_IMAGES.backgrounds.gameWallpaper;

  return (
    <View style={styles.container} pointerEvents="none">
      <Image
        source={source}
        style={[styles.wallpaper, { opacity }]}
        resizeMode="cover"
      />
      {/* Contrast Enhancement Scrim for Crisp HUD Legibility */}
      <View
        style={[
          StyleSheet.absoluteFill,
          {
            backgroundColor: isDark
              ? variant === 'cyberLines'
                ? 'rgba(4, 6, 10, 0.25)'
                : 'rgba(5, 8, 14, 0.35)'
              : 'rgba(255, 255, 255, 0.85)',
          },
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: -1,
  },
  wallpaper: {
    width: '100%',
    height: '100%',
  },
});
