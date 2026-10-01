import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Polyline, Circle } from 'react-native-svg';
import { Footprints, Bike, PersonStanding } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { ActivityType } from '../../constants/config';

interface RouteSvgThumbnailProps {
  coordinates?: { latitude: number; longitude: number }[];
  activityType: ActivityType;
  size?: number;
}

export function RouteSvgThumbnail({
  coordinates = [],
  activityType,
  size = 56,
}: RouteSvgThumbnailProps) {
  const { colors, isDark } = useTheme();

  const svgData = useMemo(() => {
    if (!coordinates || coordinates.length < 2) return null;

    const lats = coordinates.map((c) => c.latitude);
    const lngs = coordinates.map((c) => c.longitude);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);

    const latSpan = maxLat - minLat || 0.0001;
    const lngSpan = maxLng - minLng || 0.0001;

    const pad = 7;
    const drawWidth = size - pad * 2;
    const drawHeight = size - pad * 2;

    const points = coordinates
      .map((c) => {
        const x = pad + ((c.longitude - minLng) / lngSpan) * drawWidth;
        const y = size - pad - ((c.latitude - minLat) / latSpan) * drawHeight;
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');

    const last = coordinates[coordinates.length - 1];
    const lastX = pad + ((last.longitude - minLng) / lngSpan) * drawWidth;
    const lastY = size - pad - ((last.latitude - minLat) / latSpan) * drawHeight;

    const first = coordinates[0];
    const firstX = pad + ((first.longitude - minLng) / lngSpan) * drawWidth;
    const firstY = size - pad - ((first.latitude - minLat) / latSpan) * drawHeight;

    return { points, firstX, firstY, lastX, lastY };
  }, [coordinates, size]);

  const IconComponent =
    activityType === 'CYCLE' ? Bike : activityType === 'WALK' ? PersonStanding : Footprints;

  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          backgroundColor: isDark ? '#141A22' : '#F1F5F9',
          borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#E2E8F0',
        },
      ]}
    >
      {svgData ? (
        <Svg width={size} height={size}>
          <Polyline
            points={svgData.points}
            fill="none"
            stroke={colors.accent}
            strokeWidth={2.4}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Start Point */}
          <Circle cx={svgData.firstX} cy={svgData.firstY} r={2.5} fill="#22C55E" />
          {/* Finish Point */}
          <Circle cx={svgData.lastX} cy={svgData.lastY} r={3} fill={colors.accent} stroke="#FFFFFF" strokeWidth={1} />
        </Svg>
      ) : (
        <IconComponent size={20} color={colors.accent} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
});
