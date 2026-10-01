import React from 'react';
import { View, Text, StyleSheet, ImageBackground, StyleProp, ViewStyle } from 'react-native';
import { COSMETIC_IMAGES } from '../../constants/Cosmetics';

export type DivisionType = 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM' | 'DIAMOND' | 'ZENITH';

export interface DivisionBadgeProps {
  division: string;
  tier?: number; // 1 (I) to 5 (V)
  isZenith?: boolean;
  zenithRank?: number;
  size?: 'sm' | 'md' | 'lg';
  style?: StyleProp<ViewStyle>;
}

const BADGE_CONFIGS = {
  sm: {
    width: 108,
    height: 24,
    fontSize: 8.5,
    letterSpacing: 0.6,
    paddingLeft: '21%',
  },
  md: {
    width: 138,
    height: 29,
    fontSize: 10.5,
    letterSpacing: 0.9,
    paddingLeft: '21%',
  },
  lg: {
    width: 178,
    height: 38,
    fontSize: 13,
    letterSpacing: 1.2,
    paddingLeft: '21%',
  },
};

const ZENITH_CONFIGS = {
  sm: {
    width: 174,
    height: 51,
    fontSize: 12,
    letterSpacing: 0.9,
    paddingLeft: '18%',
  },
  md: {
    width: 222,
    height: 63,
    fontSize: 14.5,
    letterSpacing: 1.1,
    paddingLeft: '18%',
  },
  lg: {
    width: 282,
    height: 78,
    fontSize: 18,
    letterSpacing: 1.3,
    paddingLeft: '18%',
  },
};

export const DivisionBadge: React.FC<DivisionBadgeProps> = ({
  division,
  tier = 5,
  isZenith = false,
  zenithRank,
  size = 'md',
  style,
}) => {
  const normDivision = (isZenith ? 'ZENITH' : (division || 'BRONZE').toUpperCase()) as DivisionType;
  const isZenithType = normDivision === 'ZENITH';

  const getBadgeImage = () => {
    switch (normDivision) {
      case 'ZENITH':
        return COSMETIC_IMAGES.badges.zenith;
      case 'DIAMOND':
        return COSMETIC_IMAGES.badges.diamond;
      case 'PLATINUM':
        return COSMETIC_IMAGES.badges.platinum;
      case 'GOLD':
        return COSMETIC_IMAGES.badges.gold;
      case 'SILVER':
        return COSMETIC_IMAGES.badges.silver;
      case 'BRONZE':
      default:
        return COSMETIC_IMAGES.badges.bronze;
    }
  };

  const getTextColor = () => {
    switch (normDivision) {
      case 'ZENITH':
        return '#FFE4E6';
      case 'DIAMOND':
        return '#E0F2FE';
      case 'PLATINUM':
        return '#E0F7FF';
      case 'GOLD':
        return '#FEF08A';
      case 'SILVER':
        return '#F8FAFC';
      case 'BRONZE':
      default:
        return '#FED7AA';
    }
  };

  const toRoman = (num?: number): string => {
    switch (num) {
      case 1:
        return 'I';
      case 2:
        return 'II';
      case 3:
        return 'III';
      case 4:
        return 'IV';
      case 5:
        return 'V';
      default:
        return 'V';
    }
  };

  const badgeSource = getBadgeImage();
  const textColor = getTextColor();
  const config = isZenithType
    ? (ZENITH_CONFIGS[size] || ZENITH_CONFIGS.md)
    : (BADGE_CONFIGS[size] || BADGE_CONFIGS.md);

  const displayText = isZenithType
    ? (zenithRank ? `ZENITH (#${zenithRank})` : 'ZENITH')
    : `${normDivision} (${toRoman(tier)})`;

  return (
    <View
      style={[
        styles.outerContainer,
        {
          width: config.width,
          height: config.height,
        },
        style,
      ]}
    >
      <ImageBackground
        source={badgeSource}
        resizeMode="contain"
        style={styles.backgroundImage}
      >
        <View
          style={[
            styles.textContainer,
            { paddingLeft: (config as any).paddingLeft || '21%' },
          ]}
        >
          <Text
            numberOfLines={1}
            ellipsizeMode="clip"
            style={[
              styles.text,
              {
                fontSize: config.fontSize,
                letterSpacing: config.letterSpacing,
                color: textColor,
              },
            ]}
          >
            {displayText}
          </Text>
        </View>
      </ImageBackground>
    </View>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
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
    paddingLeft: '21%',
    paddingRight: '6%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontWeight: '900',
    textTransform: 'uppercase',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.95)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    includeFontPadding: false,
  },
});
