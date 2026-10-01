import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { Heart, Activity, ShieldCheck, Clock } from 'lucide-react-native';
import { ActivityType } from '../../constants/config';

interface ActivityZonesChartProps {
  movingSeconds: number;
  avgPaceSecondsPerKm: number;
  elevationGainMeters: number;
  distanceMeters: number;
  sport?: ActivityType;
}

interface ZoneInfo {
  zone: number;
  name: string;
  bpmRange: string;
  color: string;
  percent: number;
  seconds: number;
  adaptation: string;
}

export const ActivityZonesChart: React.FC<ActivityZonesChartProps> = ({
  movingSeconds,
  avgPaceSecondsPerKm,
  elevationGainMeters,
  distanceMeters,
  sport = 'RUN',
}) => {
  const { colors, isDark } = useTheme();

  const zones: ZoneInfo[] = useMemo(() => {
    const totalSec = Math.max(movingSeconds, 60);
    const km = distanceMeters / 1000;

    // Physiological intensity estimation based on pace and elevation
    // Fast pace (< 300s/km) or steep climb shifts time to Zone 3 & 4
    let z1 = 15;
    let z2 = 50;
    let z3 = 25;
    let z4 = 8;
    let z5 = 2;

    if (km < 1 || totalSec < 180) {
      z1 = 40;
      z2 = 45;
      z3 = 15;
      z4 = 0;
      z5 = 0;
    } else if (avgPaceSecondsPerKm < 280) {
      // High intensity tempo / race pace
      z1 = 8;
      z2 = 32;
      z3 = 38;
      z4 = 18;
      z5 = 4;
    } else if (elevationGainMeters > 50) {
      // Hilly course
      z1 = 10;
      z2 = 40;
      z3 = 32;
      z4 = 14;
      z5 = 4;
    }

    const zDefs = [
      {
        zone: 1,
        name: 'Active Recovery',
        bpmRange: '< 120 BPM',
        color: '#38BDF8',
        percent: z1,
        seconds: Math.round((totalSec * z1) / 100),
        adaptation: 'Flushes metabolic waste, promotes capillary blood flow',
      },
      {
        zone: 2,
        name: 'Aerobic Base',
        bpmRange: '120 - 145 BPM',
        color: '#34D399',
        percent: z2,
        seconds: Math.round((totalSec * z2) / 100),
        adaptation: 'Maximizes fat oxidation and mitochondrial enzyme density',
      },
      {
        zone: 3,
        name: 'Aerobic Tempo',
        bpmRange: '146 - 160 BPM',
        color: colors.accent,
        percent: z3,
        seconds: Math.round((totalSec * z3) / 100),
        adaptation: 'Improves cardiac stroke volume and steady aerobic speed',
      },
      {
        zone: 4,
        name: 'Lactate Threshold',
        bpmRange: '161 - 175 BPM',
        color: '#FB923C',
        percent: z4,
        seconds: Math.round((totalSec * z4) / 100),
        adaptation: 'Delays lactate accumulation and boosts race pace sustainability',
      },
      {
        zone: 5,
        name: 'Anaerobic Peak',
        bpmRange: '> 175 BPM',
        color: '#F43F5E',
        percent: z5,
        seconds: Math.round((totalSec * z5) / 100),
        adaptation: 'Neuromuscular power and high VO2 max velocity surges',
      },
    ];

    return zDefs;
  }, [movingSeconds, avgPaceSecondsPerKm, elevationGainMeters, distanceMeters, colors.accent]);

  const dominantZone = useMemo(() => {
    return [...zones].sort((a, b) => b.percent - a.percent)[0];
  }, [zones]);

  const formatSecs = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}m ${s < 10 ? '0' : ''}${s}s`;
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: isDark ? '#0D0D10' : '#FFFFFF',
          borderColor: colors.surfaceBorder,
        },
      ]}
    >
      {/* Header */}
      <View style={styles.headerRow}>
        <View style={styles.titleGroup}>
          <Heart size={14} color="#F43F5E" />
          <Text style={[styles.headerTitle, { color: colors.textSecondary }]}>
            EFFORT & HEART RATE TRAINING ZONES
          </Text>
        </View>
        <View style={[styles.dominantTag, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : '#F1F5F9' }]}>
          <Text style={[styles.dominantTagText, { color: dominantZone.color }]}>
            ZONE {dominantZone.zone} DOMINANT
          </Text>
        </View>
      </View>

      {/* Multi-Segment Continuous Distribution Bar */}
      <View style={styles.multiBarContainer}>
        {zones.map((z) => (
          <View
            key={z.zone}
            style={[
              styles.barSegment,
              {
                width: `${z.percent}%`,
                backgroundColor: z.color,
              },
            ]}
          />
        ))}
      </View>

      {/* Zone Percentage Tags Row */}
      <View style={styles.zoneLegendRow}>
        {zones.map((z) => (
          <View key={z.zone} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: z.color }]} />
            <Text style={[styles.legendText, { color: colors.textPrimary }]}>
              Z{z.zone} <Text style={{ color: colors.textMuted, fontWeight: '600' }}>{z.percent}%</Text>
            </Text>
          </View>
        ))}
      </View>

      {/* Detailed Zone Cards */}
      <View style={styles.zoneList}>
        {zones.map((z) => (
          <View
            key={z.zone}
            style={[
              styles.zoneRow,
              {
                borderBottomColor: colors.surfaceBorder,
              },
            ]}
          >
            <View style={styles.zoneInfoLeft}>
              <View style={[styles.zoneBadgePill, { backgroundColor: z.color + '22', borderColor: z.color }]}>
                <Text style={[styles.zoneBadgeText, { color: z.color }]}>Z{z.zone}</Text>
              </View>
              <View style={{ marginLeft: 10 }}>
                <Text style={[styles.zoneName, { color: colors.textPrimary }]}>{z.name}</Text>
                <Text style={[styles.zoneBpm, { color: colors.textMuted }]}>{z.bpmRange}</Text>
              </View>
            </View>

            <View style={styles.zoneInfoRight}>
              <Text style={[styles.zoneTime, { color: colors.textPrimary }]}>
                {formatSecs(z.seconds)}
              </Text>
              <Text style={[styles.zonePercentSub, { color: z.color }]}>{z.percent}%</Text>
            </View>
          </View>
        ))}
      </View>

      {/* Physiological Training Benefit Guidance */}
      <View
        style={[
          styles.guidanceCard,
          {
            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : '#F8FAFC',
            borderColor: colors.surfaceBorder,
          },
        ]}
      >
        <View style={styles.guidanceHeader}>
          <ShieldCheck size={13} color={colors.accent} />
          <Text style={[styles.guidanceTitle, { color: colors.textPrimary }]}>
            Aerobic Conditioning & Recovery Takeaway
          </Text>
        </View>
        <Text style={[styles.guidanceBody, { color: colors.textSecondary }]}>
          🎯 <Text style={{ fontWeight: '800', color: colors.textPrimary }}>Target Adaptation:</Text>{' '}
          {dominantZone.adaptation}. Maintaining high volume in Zones 1–3 builds your aerobic engine
          without exhausting central neural pathways.
        </Text>
        <View style={styles.recoveryRow}>
          <Clock size={11} color={colors.textMuted} />
          <Text style={[styles.recoveryText, { color: colors.textMuted }]}>
            Suggested Recovery Window: <Text style={{ color: colors.accent, fontWeight: '800' }}>18 – 24 hrs</Text>
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 14,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  titleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerTitle: {
    fontSize: 9.5,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  dominantTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  dominantTagText: {
    fontSize: 8.5,
    fontWeight: '900',
    letterSpacing: 0.6,
  },
  multiBarContainer: {
    height: 10,
    borderRadius: 5,
    overflow: 'hidden',
    flexDirection: 'row',
    marginBottom: 10,
  },
  barSegment: {
    height: '100%',
  },
  zoneLegendRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  legendText: {
    fontSize: 9,
    fontWeight: '800',
  },
  zoneList: {
    marginBottom: 12,
  },
  zoneRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  zoneInfoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  zoneBadgePill: {
    width: 28,
    height: 22,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  zoneBadgeText: {
    fontSize: 9,
    fontWeight: '900',
  },
  zoneName: {
    fontSize: 11,
    fontWeight: '800',
  },
  zoneBpm: {
    fontSize: 8.5,
    fontWeight: '700',
    marginTop: 1,
  },
  zoneInfoRight: {
    alignItems: 'flex-end',
  },
  zoneTime: {
    fontSize: 11,
    fontWeight: '800',
  },
  zonePercentSub: {
    fontSize: 8.5,
    fontWeight: '900',
    marginTop: 1,
  },
  guidanceCard: {
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  guidanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  guidanceTitle: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.4,
  },
  guidanceBody: {
    fontSize: 10,
    lineHeight: 14,
  },
  recoveryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
  },
  recoveryText: {
    fontSize: 9,
    fontWeight: '700',
  },
});
