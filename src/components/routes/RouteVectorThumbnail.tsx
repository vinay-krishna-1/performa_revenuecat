import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Polyline, Circle, Line, Polygon, G } from 'react-native-svg';
import { useTheme } from '../../context/ThemeContext';

interface RouteVectorThumbnailProps {
  coordinates: { latitude: number; longitude: number }[];
  height?: number;
}

export const RouteVectorThumbnail = React.memo(function RouteVectorThumbnail({
  coordinates,
  height = 110,
}: RouteVectorThumbnailProps) {
  const { colors, isDark } = useTheme();

  const { pointsString, startPoint, endPoint, directionalArrows } = useMemo(() => {
    if (!coordinates || coordinates.length < 2) {
      return { pointsString: '', startPoint: null, endPoint: null, directionalArrows: [] };
    }

    let minLat = Infinity,
      maxLat = -Infinity,
      minLng = Infinity,
      maxLng = -Infinity;

    for (const c of coordinates) {
      if (c.latitude < minLat) minLat = c.latitude;
      if (c.latitude > maxLat) maxLat = c.latitude;
      if (c.longitude < minLng) minLng = c.longitude;
      if (c.longitude > maxLng) maxLng = c.longitude;
    }

    const centerLat = (minLat + maxLat) / 2;
    const cosLat = Math.cos((centerLat * Math.PI) / 180);
    const spanY = Math.max(0.0001, maxLat - minLat);
    const spanX = Math.max(0.0001, (maxLng - minLng) * cosLat);

    const width = 340;
    const svgHeight = height;
    const padding = 16;

    const availWidth = width - padding * 2;
    const availHeight = svgHeight - padding * 2;
    const scale = Math.min(availWidth / spanX, availHeight / spanY);

    const offsetX = padding + (availWidth - spanX * scale) / 2;
    const offsetY = padding + (availHeight - spanY * scale) / 2;

    const points = coordinates.map((c) => {
      const px = ((c.longitude - minLng) * cosLat) * scale;
      const py = (c.latitude - minLat) * scale;
      const x = offsetX + px;
      const y = svgHeight - (offsetY + py);
      return { x, y };
    });

    const directionalArrows: { x: number; y: number; angle: number }[] = [];
    if (points.length >= 2) {
      const step = Math.max(1, Math.floor(points.length / 4));
      for (let i = step; i < points.length; i += step) {
        const p1 = points[i - 1];
        const p2 = points[i];
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const dist = Math.hypot(dx, dy);
        if (dist > 8) {
          const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
          const midX = (p1.x + p2.x) / 2;
          const midY = (p1.y + p2.y) / 2;
          directionalArrows.push({ x: midX, y: midY, angle });
        }
      }
    }

    return {
      pointsString: points.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' '),
      startPoint: points[0],
      endPoint: points[points.length - 1],
      directionalArrows,
    };
  }, [coordinates, height]);

  if (!pointsString) return null;

  return (
    <View
      style={[
        styles.container,
        {
          height,
          backgroundColor: isDark ? '#090D12' : '#F1F5F9',
          borderColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)',
        },
      ]}
    >
      <Svg width="100%" height={height} viewBox={`0 0 340 ${height}`}>
        {/* Subtle background tech grid lines */}
        <Line x1="0" y1={height * 0.33} x2="340" y2={height * 0.33} stroke={isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0,0,0,0.03)'} strokeWidth="1" />
        <Line x1="0" y1={height * 0.66} x2="340" y2={height * 0.66} stroke={isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0,0,0,0.03)'} strokeWidth="1" />
        <Line x1="113" y1="0" x2="113" y2={height} stroke={isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0,0,0,0.03)'} strokeWidth="1" />
        <Line x1="226" y1="0" x2="226" y2={height} stroke={isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0,0,0,0.03)'} strokeWidth="1" />

        {/* Glow underlay */}
        <Polyline
          points={pointsString}
          fill="none"
          stroke={colors.accent}
          strokeWidth="6"
          strokeOpacity="0.25"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Core Vector Route */}
        <Polyline
          points={pointsString}
          fill="none"
          stroke={colors.accent}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Directional Flow Chevron Arrows */}
        {directionalArrows.map((arr, idx) => (
          <G
            key={`arr_${idx}`}
            transform={`translate(${arr.x}, ${arr.y}) rotate(${arr.angle})`}
          >
            <Polygon
              points="-4,-3.5 3,0 -4,3.5"
              fill={isDark ? '#000000' : '#FFFFFF'}
              stroke={colors.accent}
              strokeWidth="1.5"
            />
          </G>
        ))}

        {/* Start Point Pin */}
        {startPoint && (
          <Circle
            cx={startPoint.x}
            cy={startPoint.y}
            r="4.5"
            fill="#10B981"
            stroke="#FFFFFF"
            strokeWidth="1.5"
          />
        )}

        {/* Finish Point Pin */}
        {endPoint && (
          <Circle
            cx={endPoint.x}
            cy={endPoint.y}
            r="4.5"
            fill="#EF4444"
            stroke="#FFFFFF"
            strokeWidth="1.5"
          />
        )}
      </Svg>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    width: '100%',
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 8,
  },
});
