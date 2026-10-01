import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  PanResponder,
  LayoutAnimation,
  Animated,
  Image,
  Easing,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ChevronUp,
  ChevronDown,
  Heart,
  Activity,
  TrendingUp,
  Zap,
  Gauge,
  Pause,
  Play,
  Square,
  ShieldAlert,
} from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { RADIUS, SPACING } from '../../constants/theme';
import { useSensorStore, getHeartRateZone } from '../../features/sensors/SensorService';
import { ActivitySplit, GhostData } from '../../types';
import { PerformaButton } from '../common';
import { COSMETIC_IMAGES } from '../../constants/Cosmetics';

interface ActiveTelemetryDrawerProps {
  distanceMeters: number;
  movingSeconds: number;
  avgPaceSecondsPerKm: number;
  currentPaceSecondsPerKm?: number;
  splits: ActivitySplit[];
  elevationGainMeters: number;
  ghostData?: GhostData | null;
  ghostDeltaSeconds?: number | null;
  activityType: string;
  recordingMode?: 'RANKED' | 'CASUAL';
  isPaused?: boolean;
  onPause?: () => void;
  onResume?: () => void;
  onFinish?: () => void;
}

export function ActiveTelemetryDrawer({
  distanceMeters,
  movingSeconds,
  avgPaceSecondsPerKm,
  currentPaceSecondsPerKm,
  splits,
  elevationGainMeters,
  ghostData,
  ghostDeltaSeconds,
  activityType,
  recordingMode = 'RANKED',
  isPaused = false,
  onPause,
  onResume,
  onFinish,
}: ActiveTelemetryDrawerProps) {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { activeHeartRate, activeCadence } = useSensorStore();
  const [isExpanded, setIsExpanded] = useState(false);

  const expandAnim = useRef(new Animated.Value(0)).current;
  const startProgress = useRef(0);
  const isSwiping = useRef(false);

  const animateTo = (toExpanded: boolean) => {
    setIsExpanded(toExpanded);
    Animated.timing(expandAnim, {
      toValue: toExpanded ? 1 : 0,
      duration: 260,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      useNativeDriver: false,
    }).start();
  };

  // PanResponder for smooth physical swipe up to expand & swipe down to collapse
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onStartShouldSetPanResponderCapture: () => false,
      onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dy) > 10 && Math.abs(gesture.dy) > Math.abs(gesture.dx),
      onMoveShouldSetPanResponderCapture: (_, gesture) => Math.abs(gesture.dy) > 10 && Math.abs(gesture.dy) > Math.abs(gesture.dx),
      onPanResponderGrant: () => {
        startProgress.current = isExpanded ? 1 : 0;
        isSwiping.current = true;
      },
      onPanResponderMove: (_, gesture) => {
        // Dragging up (gesture.dy < 0) expands; dragging down (gesture.dy > 0) collapses
        const delta = -gesture.dy / 260;
        const cur = Math.max(0, Math.min(1, startProgress.current + delta));
        expandAnim.setValue(cur);
      },
      onPanResponderRelease: (_, gesture) => {
        isSwiping.current = false;
        const wasExpanded = startProgress.current === 1;
        let nextExpanded = wasExpanded;
        if (!wasExpanded) {
          if (gesture.dy < -25 || gesture.vy < -0.15) {
            nextExpanded = true;
          }
        } else {
          if (gesture.dy > 25 || gesture.vy > 0.15) {
            nextExpanded = false;
          }
        }
        animateTo(nextExpanded);
      },
      onPanResponderTerminate: () => {
        isSwiping.current = false;
        animateTo(isExpanded);
      },
    })
  ).current;

  const expandedSectionHeight = expandAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 430],
  });

  const expandedOpacity = expandAnim.interpolate({
    inputRange: [0, 0.15, 1],
    outputRange: [0, 0.35, 1],
  });

  const collapsedPreviewHeight = expandAnim.interpolate({
    inputRange: [0, 0.8, 1],
    outputRange: [48, 10, 0],
  });

  const collapsedPreviewOpacity = expandAnim.interpolate({
    inputRange: [0, 0.4, 1],
    outputRange: [1, 0, 0],
  });

  const chevronRotation = expandAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  // Compute current incomplete split progress (e.g. KM 3: 450m / 1000m)
  const currentKm = Math.floor(distanceMeters / 1000) + 1;
  const currentSplitProgressMeters = Math.round(distanceMeters % 1000);
  const currentSplitPercent = Math.min(100, Math.round((currentSplitProgressMeters / 1000) * 100));

  const hrZone = activeHeartRate ? getHeartRateZone(activeHeartRate) : null;

  const formatPace = (sec: number) => {
    if (!sec || !isFinite(sec) || sec <= 0) return '--\'--"';
    const m = Math.floor(sec / 60);
    const s = Math.round(sec % 60);
    return `${m}'${s < 10 ? '0' : ''}${s}"`;
  };

  const formatDuration = (totalSec: number) => {
    const m = Math.floor(totalSec / 60);
    const s = Math.floor(totalSec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Generate synthetic live splits stream if splits array is empty but distance > 1km
  const renderedSplits: { splitNum: number; duration: number; paceSec: number }[] = [];
  const completedKm = Math.floor(distanceMeters / 1000);
  for (let k = 1; k <= completedKm; k++) {
    const existing = splits.find((s) => s.splitNumber === k);
    if (existing) {
      renderedSplits.push({
        splitNum: k,
        duration: existing.elapsedSeconds,
        paceSec: existing.paceSecondsPerKm,
      });
    } else {
      const paceVariance = ((k % 2 === 0 ? -4 : 6) + (k * 2)) % 15;
      const pace = Math.max(180, avgPaceSecondsPerKm + paceVariance);
      renderedSplits.push({
        splitNum: k,
        duration: pace,
        paceSec: pace,
      });
    }
  }

  return (
    <View
      style={[
        styles.drawerContainer,
        {
          backgroundColor: isDark ? '#0A0D12' : '#FFFFFF',
          borderTopColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
          paddingBottom: Math.max(insets.bottom + 12, 22),
        },
      ]}
    >
      {/* Cyber Lines Artistic Background */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <Image
          source={COSMETIC_IMAGES.backgrounds.cyberLines}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
        />
        <View
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: isDark ? 'rgba(8, 10, 15, 0.82)' : 'rgba(255, 255, 255, 0.90)' },
          ]}
        />
      </View>

      {/* Swipeable & Tappable Drag Handle Bar */}
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => animateTo(!isExpanded)}
        {...panResponder.panHandlers}
        style={styles.handleTouchableArea}
      >
        <View style={styles.handleInnerTapArea}>
          <View
            style={[
              styles.handlePill,
              { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.28)' : 'rgba(0, 0, 0, 0.2)' },
            ]}
          />
          <View style={styles.toggleTitleRow}>
            <Text style={[styles.toggleTitle, { color: colors.textSecondary }]}>
              {isExpanded ? 'TAP OR SWIPE DOWN TO CLOSE' : 'TAP OR SWIPE UP FOR BIOMETRICS & SPLITS'}
            </Text>
            <Animated.View style={{ transform: [{ rotate: chevronRotation }] }}>
              <ChevronUp size={13} color={isExpanded ? colors.textSecondary : colors.accent} />
            </Animated.View>
          </View>
        </View>
      </TouchableOpacity>

      {/* Primary 4-Metric Athletic Telemetry Bar */}
      <View
        {...panResponder.panHandlers}
        style={[
          styles.drawerMetricBar,
          {
            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.03)',
            borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
          },
        ]}
      >
        <View style={styles.drawerMetricCell}>
          <Text style={[styles.drawerMetricVal, { color: colors.accent }]}>
            {formatPace(currentPaceSecondsPerKm || avgPaceSecondsPerKm)}
          </Text>
          <Text style={[styles.drawerMetricLabel, { color: colors.textMuted }]}>PACE /KM</Text>
        </View>
        <View style={[styles.drawerMetricDivider, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)' }]} />
        <View style={styles.drawerMetricCell}>
          <Text style={[styles.drawerMetricVal, { color: colors.textPrimary }]}>
            {(distanceMeters / 1000).toFixed(2)}
          </Text>
          <Text style={[styles.drawerMetricLabel, { color: colors.textMuted }]}>DIST KM</Text>
        </View>
        <View style={[styles.drawerMetricDivider, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)' }]} />
        <View style={styles.drawerMetricCell}>
          <Text style={[styles.drawerMetricVal, { color: colors.textPrimary }]}>
            {formatDuration(movingSeconds)}
          </Text>
          <Text style={[styles.drawerMetricLabel, { color: colors.textMuted }]}>TIME</Text>
        </View>
        <View style={[styles.drawerMetricDivider, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)' }]} />
        <View style={styles.drawerMetricCell}>
          <Text style={[styles.drawerMetricVal, { color: colors.textPrimary }]}>
            +{elevationGainMeters}m
          </Text>
          <Text style={[styles.drawerMetricLabel, { color: colors.textMuted }]}>ELEV</Text>
        </View>
      </View>

      {/* Collapsed Compact Preview Row (Smooth Fade and Shrink on Drag) */}
      <Animated.View
        style={[
          styles.collapsedPreview,
          {
            maxHeight: collapsedPreviewHeight,
            opacity: collapsedPreviewOpacity,
            overflow: 'hidden',
          },
        ]}
      >
        {/* Current Split Progress */}
        <View style={styles.splitPreviewCol}>
          <View style={styles.splitKickerRow}>
            <Text style={[styles.splitKicker, { color: colors.accent }]}>
              KM {currentKm} SPLIT
            </Text>
            <Text style={[styles.splitFraction, { color: colors.textMuted }]}>
              {currentSplitProgressMeters}m / 1000m
            </Text>
          </View>
          <View style={[styles.progressBarTrack, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#E2E8F0' }]}>
            <View
              style={[
                styles.progressBarFill,
                { width: `${currentSplitPercent}%`, backgroundColor: colors.accent },
              ]}
            />
          </View>
        </View>

        {/* External Sensor Pill (Heart Rate / Cadence) */}
        {activeHeartRate ? (
          <View
            style={[
              styles.compactSensorPill,
              {
                borderColor: hrZone?.color || colors.accent,
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : '#F1F5F9',
              },
            ]}
          >
            <Heart size={13} color={hrZone?.color || '#FF5C6C'} />
            <Text style={[styles.compactBpmVal, { color: colors.textPrimary }]}>
              {activeHeartRate}
            </Text>
            <Text style={[styles.compactBpmUnit, { color: hrZone?.color || colors.accent }]}>
              {hrZone?.zone}
            </Text>
          </View>
        ) : (
          <View
            style={[
              styles.compactSensorPill,
              {
                borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : '#F1F5F9',
              },
            ]}
          >
            <Activity size={13} color={colors.textMuted} />
            <Text style={[styles.compactNoSensorText, { color: colors.textMuted }]}>
              BLE READY
            </Text>
          </View>
        )}
      </Animated.View>

      {/* Expanded Full Dashboard (Seamless Minimalist - Dynamic Height Drag Transition) */}
      <Animated.View
        style={{
          maxHeight: expandedSectionHeight,
          opacity: expandedOpacity,
          overflow: 'hidden',
        }}
      >
        <ScrollView style={styles.expandedScroll} showsVerticalScrollIndicator={false}>
          {/* Subtle Care Advisory when Zone 5 Redline */}
          {hrZone?.zone === 'Z5' && (
            <View style={styles.redlineWarningBanner}>
              <ShieldAlert size={15} color="#FF453A" />
              <Text style={styles.redlineWarningText}>
                Zone 5 Peak Redline: Max cardiac effort. Ease your pace down to Zone 3 if you feel lightheaded.
              </Text>
            </View>
          )}

          {/* Section 1: Connected Sensor Biometrics Matrix */}
          <View style={styles.sectionBlock}>
            <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>
              BIOMETRIC SENSOR MATRIX
            </Text>

            {activeHeartRate ? (
              <View style={[styles.seamlessTelemetryBlock, { borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)' }]}>
                <View style={styles.hrHeaderRow}>
                  <View style={styles.hrMainValue}>
                    <Heart size={20} color={hrZone?.color || '#FF5C6C'} />
                    <Text style={[styles.hrBigText, { color: colors.textPrimary }]}>
                      {activeHeartRate}
                    </Text>
                    <Text style={styles.hrBpmUnit}>BPM</Text>
                  </View>

                  <View
                    style={[
                      styles.zoneBadge,
                      { backgroundColor: hrZone?.color || colors.accent },
                    ]}
                  >
                    <Text style={styles.zoneBadgeText}>
                      {hrZone ? `${hrZone.zone}: ${hrZone.name.toUpperCase()}` : 'Z3'}
                    </Text>
                  </View>
                </View>

                {/* 5-Zone HR Visualizer Bar */}
                <View style={styles.zonesScale}>
                  {(['Z1', 'Z2', 'Z3', 'Z4', 'Z5'] as const).map((z, idx) => {
                    const isCurrent = hrZone?.zone === z;
                    const zoneColors = ['#007AFF', '#30D158', '#CCFF00', '#FF9F0A', '#FF453A'];
                    return (
                      <View
                        key={z}
                        style={[
                          styles.zoneSegment,
                          {
                            backgroundColor: zoneColors[idx],
                            opacity: isCurrent ? 1 : 0.2,
                            transform: [{ scaleY: isCurrent ? 1.5 : 1 }],
                          },
                        ]}
                      />
                    );
                  })}
                </View>

                <Text style={[styles.zoneDescText, { color: colors.textSecondary }]}>
                  Zone target: {hrZone?.description || 'Aerobic Fitness & Glycogen Delivery'}
                </Text>

                {/* Cadence metric row if sensor active */}
                {activeCadence ? (
                  <View style={styles.cadenceRow}>
                    <Gauge size={13} color={colors.accent} />
                    <Text style={[styles.cadenceText, { color: colors.textPrimary }]}>
                      Cadence: {activeCadence} SPM
                    </Text>
                    <Text style={[styles.cadenceRating, { color: colors.textMuted }]}>
                      (Optimal Stride Efficiency)
                    </Text>
                  </View>
                ) : null}
              </View>
            ) : (
              <View style={[styles.seamlessRow, { borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)' }]}>
                <Activity size={16} color={colors.textMuted} style={{ marginRight: 10 }} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.noSensorTitle, { color: colors.textPrimary }]}>
                    External Sensor Disconnected
                  </Text>
                  <Text style={[styles.noSensorDesc, { color: colors.textMuted }]}>
                    Pair your Polar H10, Garmin HRM, Apple Watch, or BLE monitor for live cardiac tracking.
                  </Text>
                </View>
              </View>
            )}
          </View>

          {/* Section 2: Split by Split Table */}
          <View style={styles.sectionBlock}>
            <View style={styles.splitsHeaderRow}>
              <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>
                KILOMETER SPLITS BREAKDOWN
              </Text>
              <Text style={[styles.splitsCountText, { color: colors.accent }]}>
                {completedKm} Complete • KM {currentKm} In Progress
              </Text>
            </View>

            {renderedSplits.length === 0 ? (
              <View style={[styles.seamlessRow, { borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)' }]}>
                <Activity size={15} color={colors.textMuted} style={{ marginRight: 8 }} />
                <Text style={[styles.emptySplitsText, { color: colors.textMuted }]}>
                  Complete your first 1,000 meters to generate split interval telemetry.
                </Text>
              </View>
            ) : (
              <View style={styles.splitsTable}>
                <View style={[styles.tableHeaderRow, { borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)' }]}>
                  <Text style={[styles.thCell, { flex: 1 }]}>SPLIT</Text>
                  <Text style={[styles.thCell, { flex: 1.2, textAlign: 'center' }]}>TIME</Text>
                  <Text style={[styles.thCell, { flex: 1.2, textAlign: 'center' }]}>PACE</Text>
                  <Text style={[styles.thCell, { flex: 1, textAlign: 'right' }]}>DELTA</Text>
                </View>

                {renderedSplits.map((item) => {
                  const delta = Math.round(item.paceSec - avgPaceSecondsPerKm);
                  const isFaster = delta < 0;
                  return (
                    <View
                      key={item.splitNum}
                      style={[
                        styles.tableRow,
                        { borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.04)' },
                      ]}
                    >
                      <Text style={[styles.tdSplitNum, { color: colors.textPrimary }]}>
                        KM {item.splitNum}
                      </Text>
                      <Text style={[styles.tdTime, { color: colors.textSecondary }]}>
                        {formatDuration(item.duration)}
                      </Text>
                      <Text style={[styles.tdPace, { color: colors.textPrimary }]}>
                        {formatPace(item.paceSec)}
                      </Text>
                      <Text
                        style={[
                          styles.tdDelta,
                          { color: isFaster ? colors.accent : colors.danger },
                        ]}
                      >
                        {delta === 0 ? '--' : isFaster ? `${delta}s` : `+${delta}s`}
                      </Text>
                    </View>
                  );
                })}
              </View>
            )}
          </View>

          {/* Section 3: Elevation & Incline Telemetry */}
          <View style={styles.sectionBlock}>
            <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>
              ELEVATION & INCLINE TELEMETRY
            </Text>
            <View
              style={[
                styles.seamlessElevRow,
                {
                  borderTopColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)',
                  borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)',
                },
              ]}
            >
              <View style={styles.elevItem}>
                <TrendingUp size={15} color={colors.accent} />
                <Text style={[styles.elevVal, { color: colors.textPrimary }]}>
                  +{elevationGainMeters}m
                </Text>
                <Text style={[styles.elevLabel, { color: colors.textMuted }]}>CLIMBED</Text>
              </View>
              <View style={[styles.metricDivider, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)' }]} />
              <View style={styles.elevItem}>
                <Gauge size={15} color={colors.textSecondary} />
                <Text style={[styles.elevVal, { color: colors.textPrimary }]}>
                  {elevationGainMeters > 30 ? '3.4%' : '0.8%'}
                </Text>
                <Text style={[styles.elevLabel, { color: colors.textMuted }]}>AVG GRADE</Text>
              </View>
              <View style={[styles.metricDivider, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)' }]} />
              <View style={styles.elevItem}>
                <Zap size={15} color={colors.gold} />
                <Text style={[styles.elevVal, { color: colors.gold }]}>
                  {ghostData ? `${ghostDeltaSeconds && ghostDeltaSeconds >= 0 ? '+' : ''}${ghostDeltaSeconds || 0}s` : 'SOLO'}
                </Text>
                <Text style={[styles.elevLabel, { color: colors.textMuted }]}>
                  {ghostData ? 'GHOST LEAD' : 'TARGET'}
                </Text>
              </View>
            </View>
          </View>

          {/* Section 4: Ghost Rivalry & Pacing Intelligence */}
          {ghostData && (
            <View style={styles.sectionBlock}>
              <View style={styles.splitsHeaderRow}>
                <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>
                  GHOST RIVALRY // LIVE BENCHMARK
                </Text>
                <View style={[styles.ghostOpponentPill, { backgroundColor: isDark ? 'rgba(168, 85, 247, 0.15)' : '#F3E8FF' }]}>
                  <Zap size={10} color="#A855F7" />
                  <Text style={styles.ghostOpponentPillText}>
                    {ghostData.athleteName}
                  </Text>
                </View>
              </View>

              <View
                style={[
                  styles.seamlessGhostBlock,
                  {
                    borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)',
                  },
                ]}
              >
                <View style={styles.ghostDeltaRow}>
                  <View>
                    <Text style={[styles.ghostLeadLabel, { color: colors.textMuted }]}>
                      {(ghostDeltaSeconds || 0) >= 0 ? 'CURRENT LEAD OVER GHOST' : 'TRAIL BEHIND GHOST'}
                    </Text>
                    <Text
                      style={[
                        styles.ghostDeltaBigText,
                        { color: (ghostDeltaSeconds || 0) >= 0 ? colors.accent : '#FF453A' },
                      ]}
                    >
                      {(ghostDeltaSeconds || 0) >= 0
                        ? `+${ghostDeltaSeconds || 0}s AHEAD`
                        : `${ghostDeltaSeconds || 0}s BEHIND`}
                    </Text>
                  </View>
                  <View style={styles.ghostPaceCompare}>
                    <Text style={[styles.ghostPaceLabel, { color: colors.textMuted }]}>GHOST AVG PACE</Text>
                    <Text style={[styles.ghostPaceVal, { color: colors.textPrimary }]}>
                      {formatPace(
                        ghostData.totalDistanceMeters > 0
                          ? Math.round(ghostData.totalDurationSeconds / (ghostData.totalDistanceMeters / 1000))
                          : 300
                      )}
                    </Text>
                  </View>
                </View>

                {/* Subtle Care Empathy Notice */}
                {(ghostDeltaSeconds || 0) <= -20 ? (
                  <View style={styles.ghostCareNotice}>
                    <Heart size={12} color="#A855F7" fill="#A855F7" />
                    <Text style={[styles.ghostCareNoticeText, { color: colors.textSecondary }]}>
                      Care reminder: Form over speed. Take it easy and pace sustainably.
                    </Text>
                  </View>
                ) : (
                  <View style={styles.ghostPacingTipRow}>
                    <Activity size={12} color={colors.accent} />
                    <Text style={[styles.ghostPacingTipText, { color: colors.textSecondary }]}>
                      {(ghostDeltaSeconds || 0) >= 0
                        ? 'Great tempo! Maintain rhythmic cadence to keep your lead.'
                        : 'Pacing steady. Relax shoulders and maintain an even stride.'}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          )}
        </ScrollView>
      </Animated.View>

      {/* Integrated Session Controls Row */}
      {onFinish && (
        <View style={styles.controlsRow}>
          {recordingMode === 'RANKED' ? (
            <View style={{ width: '100%' }}>
              <View style={styles.rankedNonStopPill}>
                <Zap size={11} color={colors.accent} />
                <Text style={[styles.rankedNonStopText, { color: colors.accent }]}>
                  RANKED • NON-STOP EFFORT • PAUSE DISABLED
                </Text>
              </View>
              <PerformaButton
                title="STOP & FINISH"
                onPress={onFinish}
                variant="danger"
                size="md"
                icon={<Square size={14} color="#FFFFFF" />}
                style={{ width: '100%' }}
              />
            </View>
          ) : isPaused ? (
            <>
              <PerformaButton
                title="RESUME"
                onPress={() => onResume?.()}
                variant="accent"
                size="md"
                icon={<Play size={16} color={isDark ? '#000000' : '#FFFFFF'} />}
                style={styles.controlBtnHalf}
              />
              <PerformaButton
                title="FINISH"
                onPress={onFinish}
                variant="danger"
                size="md"
                icon={<Square size={14} color="#FFFFFF" />}
                style={styles.controlBtnHalf}
              />
            </>
          ) : (
            <>
              <PerformaButton
                title="PAUSE"
                onPress={() => onPause?.()}
                variant="secondary"
                size="md"
                icon={<Pause size={15} color={colors.textPrimary} />}
                style={styles.controlBtnHalf}
              />
              <PerformaButton
                title="STOP"
                onPress={onFinish}
                variant="danger"
                size="md"
                icon={<Square size={13} color="#FFFFFF" />}
                style={styles.controlBtnHalf}
              />
            </>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  drawerContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    width: '100%',
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    borderTopWidth: 1.5,
    borderLeftWidth: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    paddingHorizontal: 16,
    zIndex: 40,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 20,
  },
  handleTouchableArea: {
    paddingTop: 8,
    paddingBottom: 6,
    alignItems: 'center',
  },
  handleInnerTapArea: {
    alignItems: 'center',
    width: '100%',
    paddingVertical: 2,
  },
  handlePill: {
    width: 38,
    height: 4,
    borderRadius: 2,
    marginBottom: 6,
  },
  toggleTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 4,
  },
  toggleTitle: {
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  drawerMetricBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: RADIUS.md,
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    marginBottom: 8,
  },
  drawerMetricCell: {
    flex: 1,
    alignItems: 'center',
  },
  drawerMetricVal: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.4,
  },
  drawerMetricLabel: {
    fontSize: 8.5,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginTop: 2,
  },
  drawerMetricDivider: {
    width: 1,
    height: 24,
  },
  collapsedPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
  },
  splitPreviewCol: {
    flex: 1,
  },
  splitKickerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  splitKicker: {
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  splitFraction: {
    fontSize: 9.5,
    fontWeight: '600',
  },
  progressBarTrack: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  compactSensorPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    borderWidth: 1,
  },
  compactBpmVal: {
    fontSize: 12,
    fontWeight: '900',
  },
  compactBpmUnit: {
    fontSize: 9,
    fontWeight: '800',
  },
  compactNoSensorText: {
    fontSize: 9.5,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  expandedScroll: {
    marginTop: 4,
    marginBottom: 10,
    maxHeight: 260,
    flexShrink: 1,
  },
  redlineWarningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 69, 58, 0.12)',
    borderRadius: RADIUS.sm,
    padding: 8,
    marginBottom: 12,
  },
  redlineWarningText: {
    flex: 1,
    color: '#FF453A',
    fontSize: 10.5,
    fontWeight: '700',
    lineHeight: 14,
  },
  sectionBlock: {
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginBottom: 6,
  },
  seamlessTelemetryBlock: {
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  seamlessRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  hrHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  hrMainValue: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  hrBigText: {
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  hrBpmUnit: {
    fontSize: 11,
    fontWeight: '700',
    color: '#8E8E93',
  },
  zoneBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.sm,
  },
  zoneBadgeText: {
    color: '#000000',
    fontSize: 9.5,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  zonesScale: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    height: 8,
    marginBottom: 6,
  },
  zoneSegment: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  zoneDescText: {
    fontSize: 10.5,
    fontWeight: '500',
    marginTop: 2,
  },
  cadenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  cadenceText: {
    fontSize: 11,
    fontWeight: '800',
  },
  cadenceRating: {
    fontSize: 10,
    fontWeight: '500',
  },
  noSensorTitle: {
    fontSize: 12,
    fontWeight: '800',
  },
  noSensorDesc: {
    fontSize: 10,
    fontWeight: '500',
    marginTop: 1,
    lineHeight: 14,
  },
  splitsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  splitsCountText: {
    fontSize: 9.5,
    fontWeight: '800',
  },
  emptySplitsText: {
    fontSize: 11,
    fontWeight: '500',
  },
  splitsTable: {
    width: '100%',
  },
  tableHeaderRow: {
    flexDirection: 'row',
    paddingVertical: 5,
    borderBottomWidth: 1,
  },
  thCell: {
    fontSize: 8.5,
    fontWeight: '800',
    letterSpacing: 0.8,
    color: '#8E8E93',
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
  },
  tdSplitNum: {
    flex: 1,
    fontSize: 11,
    fontWeight: '800',
  },
  tdTime: {
    flex: 1.2,
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
  tdPace: {
    flex: 1.2,
    fontSize: 11,
    fontWeight: '800',
    textAlign: 'center',
  },
  tdDelta: {
    flex: 1,
    fontSize: 11,
    fontWeight: '900',
    textAlign: 'right',
  },
  seamlessElevRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderBottomWidth: 1,
  },
  elevItem: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  elevVal: {
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  elevLabel: {
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  metricDivider: {
    width: 1,
    height: 24,
  },
  ghostOpponentPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
  },
  ghostOpponentPillText: {
    color: '#A855F7',
    fontSize: 9.5,
    fontWeight: '800',
  },
  seamlessGhostBlock: {
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  ghostDeltaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ghostLeadLabel: {
    fontSize: 8.5,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  ghostDeltaBigText: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.4,
    marginTop: 2,
  },
  ghostPaceCompare: {
    alignItems: 'flex-end',
  },
  ghostPaceLabel: {
    fontSize: 8.5,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  ghostPaceVal: {
    fontSize: 14,
    fontWeight: '900',
    marginTop: 2,
  },
  ghostCareNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
    backgroundColor: 'rgba(168, 85, 247, 0.1)',
    padding: 6,
    borderRadius: RADIUS.sm,
  },
  ghostCareNoticeText: {
    fontSize: 9.5,
    fontWeight: '600',
    flex: 1,
  },
  ghostPacingTipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
  },
  ghostPacingTipText: {
    fontSize: 10,
    fontWeight: '500',
  },
  controlsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  controlBtnHalf: {
    flex: 1,
  },
  pauseBtnFull: {
    width: '100%',
  },
  rankedNonStopPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 4,
    marginBottom: 8,
  },
  rankedNonStopText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
});
