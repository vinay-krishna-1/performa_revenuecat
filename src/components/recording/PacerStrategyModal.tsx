import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  LayoutAnimation,
  Switch,
  Image,
} from 'react-native';
import { COSMETIC_IMAGES } from '../../constants/Cosmetics';
import {
  Activity,
  Zap,
  TrendingDown,
  TrendingUp,
  Minus,
  Check,
  X,
  HelpCircle,
  Clock,
  Navigation,
  Sparkles,
  Heart,
  Gauge,
  Sliders,
} from 'lucide-react-native';
import { RADIUS } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';
import { PacerSettings, PacerSplitStrategy, PacerSplitTarget, PacerStrategyIntensity } from '../../types';
import { PacerService } from '../../features/pacer/PacerService';
import { PerformaButton } from '../common';
import { InfoModal } from '../common/InfoModal';

interface PacerStrategyModalProps {
  visible: boolean;
  onClose: () => void;
  isMidRun?: boolean;
  currentDistanceMeters?: number;
  pacerSettings: PacerSettings;
  onSaveSettings: (settings: PacerSettings) => void;
  onRelaxPace?: (bufferSec: number) => void;
  onSurgePace?: (surgeSec: number) => void;
  onSwitchStrategy?: (strategy: PacerSplitStrategy) => void;
}

const DISTANCE_PRESETS = [
  { label: '1K', meters: 1000 },
  { label: '3K', meters: 3000 },
  { label: '5K', meters: 5000 },
  { label: '10K', meters: 10000 },
  { label: '21.1K', meters: 21100 },
  { label: '42.2K', meters: 42200 },
];

const CADENCE_OPTIONS = [
  { label: 'OFF', value: undefined },
  { label: '165 SPM', value: 165 },
  { label: '170 SPM', value: 170 },
  { label: '175 SPM', value: 175 },
  { label: '180 SPM', value: 180 },
  { label: '185 SPM', value: 185 },
];

export function PacerStrategyModal({
  visible,
  onClose,
  isMidRun = false,
  currentDistanceMeters = 0,
  pacerSettings,
  onSaveSettings,
  onRelaxPace,
  onSurgePace,
  onSwitchStrategy,
}: PacerStrategyModalProps) {
  const { colors, isDark } = useTheme();
  const [showHelpModal, setShowHelpModal] = useState(false);

  const [pacerEnabled, setPacerEnabled] = useState(pacerSettings.enabled ?? true);
  const [selectedDistance, setSelectedDistance] = useState(
    pacerSettings.targetDistanceMeters || 5000
  );
  const [targetMinutes, setTargetMinutes] = useState(
    String(Math.floor((pacerSettings.targetTimeSeconds || 1500) / 60))
  );
  const [targetSeconds, setTargetSeconds] = useState(
    String((pacerSettings.targetTimeSeconds || 1500) % 60).padStart(2, '0')
  );
  const [selectedStrategy, setSelectedStrategy] = useState<PacerSplitStrategy>(
    pacerSettings.strategy || 'NEGATIVE_SPLIT'
  );
  const [selectedIntensity, setSelectedIntensity] = useState<PacerStrategyIntensity>(
    pacerSettings.intensity || 'MODERATE'
  );
  const [selectedCadence, setSelectedCadence] = useState<number | undefined>(
    pacerSettings.targetCadence
  );

  const totalTargetSec =
    (parseInt(targetMinutes, 10) || 25) * 60 + (parseInt(targetSeconds, 10) || 0);

  const basePaceSec = totalTargetSec / Math.max(0.1, selectedDistance / 1000);

  const formatPace = (sec: number) => {
    if (!sec || sec <= 0) return '--:--';
    const m = Math.floor(sec / 60);
    const s = Math.round(sec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const previewSplits = PacerService.getInstance().generateSplits(
    selectedDistance,
    totalTargetSec,
    selectedStrategy,
    selectedIntensity
  );

  const handleActivate = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    const splits = PacerService.getInstance().generateSplits(
      selectedDistance,
      totalTargetSec,
      selectedStrategy,
      selectedIntensity
    );

    onSaveSettings({
      enabled: pacerEnabled,
      targetDistanceMeters: selectedDistance,
      targetTimeSeconds: totalTargetSec,
      strategy: selectedStrategy,
      intensity: selectedIntensity,
      targetCadence: selectedCadence,
      voiceInterval: '1_KM',
      splits,
    });
    onClose();
  };

  const handleTogglePacer = (val: boolean) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setPacerEnabled(val);
    if (!val) {
      // Directly disable and close without requiring second confirmation
      onSaveSettings({
        ...pacerSettings,
        enabled: false,
      });
      onClose();
    }
  };

  return (
    <>
      <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
        <View style={styles.overlay}>
          <View
            style={[
              styles.container,
              {
                backgroundColor: isDark ? '#0D0D12' : '#FFFFFF',
                borderColor: colors.surfaceBorder,
              },
            ]}
          >
            <View style={StyleSheet.absoluteFill}>
              <Image
                source={COSMETIC_IMAGES.backgrounds.cyberLines}
                style={StyleSheet.absoluteFill}
                resizeMode="cover"
              />
              <View
                style={[
                  StyleSheet.absoluteFill,
                  { backgroundColor: isDark ? 'rgba(13, 13, 18, 0.88)' : 'rgba(255, 255, 255, 0.90)' },
                ]}
              />
            </View>

            {/* Header */}
            <View style={[styles.header, { borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.07)' : 'rgba(0, 0, 0, 0.08)' }]}>
              <View style={{ flex: 1 }}>
                <View style={styles.kickerRow}>
                  <Activity size={12} color={colors.accent} />
                  <Text style={[styles.kicker, { color: colors.accent }]}>
                    {isMidRun ? 'MID-RUN ADAPTIVE PACER' : 'ENDURANCE PACING ENGINE'}
                  </Text>
                </View>
                <Text style={[styles.title, { color: colors.textPrimary }]}>
                  {isMidRun ? 'Adjust Split Pacing' : 'Pacer Strategy & Goal'}
                </Text>
              </View>

              <TouchableOpacity
                activeOpacity={0.7}
                onPress={onClose}
                style={[
                  styles.closeBtn,
                  {
                    borderColor: colors.surfaceBorder,
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)',
                  },
                ]}
              >
                <X size={15} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
              {/* Top Toggle: Pacer Active switch */}
              <View style={[styles.toggleBanner, { borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)' }]}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.toggleTitle, { color: colors.textPrimary }]}>Enable Pacer Guidance</Text>
                  <Text style={[styles.toggleSub, { color: colors.textMuted }]}>
                    {pacerEnabled ? 'Target splits & voice prompts active' : 'Pacer strategy disabled'}
                  </Text>
                </View>
                <Switch
                  value={pacerEnabled}
                  onValueChange={handleTogglePacer}
                  trackColor={{ false: isDark ? '#2D3748' : '#CBD5E1', true: colors.accent }}
                  thumbColor={isDark ? '#000000' : '#FFFFFF'}
                />
              </View>

              {/* If mid-run: Show instant condition adjust buttons */}
              {isMidRun ? (
                <View style={styles.midRunSection}>
                  <Text style={[styles.sectionHeading, { color: colors.textMuted }]}>
                    HOW ARE YOU FEELING RIGHT NOW?
                  </Text>

                  {/* Heavy / Tired -> Recovery Pace */}
                  <TouchableOpacity
                    activeOpacity={0.75}
                    onPress={() => {
                      onRelaxPace?.(25);
                      onClose();
                    }}
                    style={[styles.seamlessRow, { borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)' }]}
                  >
                    <View style={[styles.iconBoxSmall, { backgroundColor: 'rgba(255, 92, 108, 0.12)' }]}>
                      <Heart size={16} color="#FF5C6C" />
                    </View>
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={[styles.rowTitle, { color: colors.textPrimary }]}>
                        Feeling Heavy? Ease Cadence (+25s/km)
                      </Text>
                      <Text style={[styles.rowSub, { color: colors.textMuted }]}>
                        Relieves remaining split targets so you can finish safely.
                      </Text>
                    </View>
                  </TouchableOpacity>

                  {/* Fresh / Fast -> Surge Kick */}
                  <TouchableOpacity
                    activeOpacity={0.75}
                    onPress={() => {
                      onSurgePace?.(15);
                      onClose();
                    }}
                    style={[styles.seamlessRow, { borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)' }]}
                  >
                    <View style={[styles.iconBoxSmall, { backgroundColor: isDark ? 'rgba(204, 255, 0, 0.12)' : 'rgba(0, 82, 255, 0.1)' }]}>
                      <TrendingUp size={16} color={colors.accent} />
                    </View>
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={[styles.rowTitle, { color: colors.textPrimary }]}>
                        Feeling Fresh? Surge Attack (-15s/km)
                      </Text>
                      <Text style={[styles.rowSub, { color: colors.textMuted }]}>
                        Pushes remaining splits faster for a strong negative-split finish.
                      </Text>
                    </View>
                  </TouchableOpacity>

                  {/* Flatten to Even Split */}
                  <TouchableOpacity
                    activeOpacity={0.75}
                    onPress={() => {
                      onSwitchStrategy?.('EVEN');
                      onClose();
                    }}
                    style={[styles.seamlessRow, { borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)' }]}
                  >
                    <View style={[styles.iconBoxSmall, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.05)' }]}>
                      <Minus size={16} color={colors.textPrimary} />
                    </View>
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={[styles.rowTitle, { color: colors.textPrimary }]}>
                        Switch to Flat Rhythm (Even Split)
                      </Text>
                      <Text style={[styles.rowSub, { color: colors.textMuted }]}>
                        Locks a steady, consistent pace across every remaining kilometer.
                      </Text>
                    </View>
                  </TouchableOpacity>
                </View>
              ) : null}

              {/* 1. Distance Selector */}
              <Text style={[styles.sectionHeading, { color: colors.textMuted }]}>TARGET DISTANCE</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillScroll}>
                {DISTANCE_PRESETS.map((d) => {
                  const isSelected = selectedDistance === d.meters;
                  return (
                    <TouchableOpacity
                      key={d.label}
                      activeOpacity={0.8}
                      onPress={() => {
                        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                        setSelectedDistance(d.meters);
                      }}
                      style={[
                        styles.distPill,
                        {
                          backgroundColor: isSelected
                            ? colors.accent
                            : isDark
                            ? 'rgba(255, 255, 255, 0.05)'
                            : 'rgba(0, 0, 0, 0.04)',
                          borderColor: isSelected ? colors.accent : colors.surfaceBorder,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.distPillText,
                          {
                            color: isSelected ? (isDark ? '#000000' : '#FFFFFF') : colors.textPrimary,
                            fontWeight: isSelected ? '900' : '600',
                          },
                        ]}
                      >
                        {d.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {/* 2. Target Time Input & Average Pace */}
              <View style={[styles.timeRow, { borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)' }]}>
                <View>
                  <Text style={[styles.inputLabel, { color: colors.textMuted }]}>TARGET FINISH TIME</Text>
                  <View style={styles.inputsContainer}>
                    <TextInput
                      style={[
                        styles.timeInput,
                        {
                          color: colors.textPrimary,
                          backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)',
                          borderColor: colors.surfaceBorder,
                        },
                      ]}
                      value={targetMinutes}
                      onChangeText={setTargetMinutes}
                      keyboardType="number-pad"
                      maxLength={3}
                    />
                    <Text style={[styles.colonText, { color: colors.textMuted }]}>:</Text>
                    <TextInput
                      style={[
                        styles.timeInput,
                        {
                          color: colors.textPrimary,
                          backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)',
                          borderColor: colors.surfaceBorder,
                        },
                      ]}
                      value={targetSeconds}
                      onChangeText={setTargetSeconds}
                      keyboardType="number-pad"
                      maxLength={2}
                    />
                  </View>
                </View>

                <View style={styles.avgPaceBox}>
                  <Text style={[styles.inputLabel, { color: colors.textMuted }]}>BASE PACE</Text>
                  <Text style={[styles.avgPaceVal, { color: colors.accent }]}>
                    {formatPace(basePaceSec)}
                  </Text>
                  <Text style={[styles.avgPaceUnit, { color: colors.textMuted }]}>/km avg</Text>
                </View>
              </View>

              {/* 3. Split Strategy Choices */}
              <Text style={[styles.sectionHeading, { color: colors.textMuted }]}>
                ENDURANCE SPLIT STRATEGY
              </Text>
              <View style={styles.strategyRow}>
                {/* Negative Split */}
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => {
                    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                    setSelectedStrategy('NEGATIVE_SPLIT');
                  }}
                  style={[
                    styles.strategyPill,
                    selectedStrategy === 'NEGATIVE_SPLIT' && {
                      borderColor: colors.accent,
                      backgroundColor: isDark ? 'rgba(204, 255, 0, 0.08)' : 'rgba(0, 82, 255, 0.08)',
                    },
                    { borderColor: selectedStrategy === 'NEGATIVE_SPLIT' ? colors.accent : colors.surfaceBorder },
                  ]}
                >
                  <TrendingUp size={14} color={selectedStrategy === 'NEGATIVE_SPLIT' ? colors.accent : colors.textMuted} />
                  <Text
                    style={[
                      styles.strategyPillText,
                      { color: selectedStrategy === 'NEGATIVE_SPLIT' ? colors.accent : colors.textPrimary },
                    ]}
                  >
                    Negative Split
                  </Text>
                </TouchableOpacity>

                {/* Even Split */}
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => {
                    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                    setSelectedStrategy('EVEN');
                  }}
                  style={[
                    styles.strategyPill,
                    selectedStrategy === 'EVEN' && {
                      borderColor: colors.accent,
                      backgroundColor: isDark ? 'rgba(204, 255, 0, 0.08)' : 'rgba(0, 82, 255, 0.08)',
                    },
                    { borderColor: selectedStrategy === 'EVEN' ? colors.accent : colors.surfaceBorder },
                  ]}
                >
                  <Minus size={14} color={selectedStrategy === 'EVEN' ? colors.accent : colors.textMuted} />
                  <Text
                    style={[
                      styles.strategyPillText,
                      { color: selectedStrategy === 'EVEN' ? colors.accent : colors.textPrimary },
                    ]}
                  >
                    Even Rhythm
                  </Text>
                </TouchableOpacity>

                {/* Positive Split */}
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => {
                    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                    setSelectedStrategy('POSITIVE_SPLIT');
                  }}
                  style={[
                    styles.strategyPill,
                    selectedStrategy === 'POSITIVE_SPLIT' && {
                      borderColor: colors.accent,
                      backgroundColor: isDark ? 'rgba(204, 255, 0, 0.08)' : 'rgba(0, 82, 255, 0.08)',
                    },
                    { borderColor: selectedStrategy === 'POSITIVE_SPLIT' ? colors.accent : colors.surfaceBorder },
                  ]}
                >
                  <TrendingDown size={14} color={selectedStrategy === 'POSITIVE_SPLIT' ? colors.accent : colors.textMuted} />
                  <Text
                    style={[
                      styles.strategyPillText,
                      { color: selectedStrategy === 'POSITIVE_SPLIT' ? colors.accent : colors.textPrimary },
                    ]}
                  >
                    Positive Split
                  </Text>
                </TouchableOpacity>
              </View>

              {/* 4. Strategy Intensity Levels (if Negative or Positive Split) */}
              {selectedStrategy !== 'EVEN' && (
                <View style={styles.intensitySection}>
                  <Text style={[styles.sectionHeading, { color: colors.textMuted, marginTop: 10 }]}>
                    PROGRESSION CURVE INTENSITY
                  </Text>
                  <View style={styles.intensityRow}>
                    {(
                      [
                        { id: 'MILD', label: 'Mild (±2%)', desc: 'Gentle shift (~6s)' },
                        { id: 'MODERATE', label: 'Moderate (±4%)', desc: 'Standard (~12s)' },
                        { id: 'AGGRESSIVE', label: 'Aggressive (±7%)', desc: 'Deep surge (~20s)' },
                      ] as const
                    ).map((lvl) => {
                      const isSel = selectedIntensity === lvl.id;
                      return (
                        <TouchableOpacity
                          key={lvl.id}
                          activeOpacity={0.8}
                          onPress={() => {
                            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                            setSelectedIntensity(lvl.id);
                          }}
                          style={[
                            styles.intensityBtn,
                            {
                              backgroundColor: isSel
                                ? colors.accent
                                : isDark
                                ? 'rgba(255, 255, 255, 0.05)'
                                : 'rgba(0, 0, 0, 0.04)',
                              borderColor: isSel ? colors.accent : colors.surfaceBorder,
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.intensityLabel,
                              {
                                color: isSel ? (isDark ? '#000000' : '#FFFFFF') : colors.textPrimary,
                                fontWeight: isSel ? '900' : '600',
                              },
                            ]}
                          >
                            {lvl.label}
                          </Text>
                          <Text
                            style={[
                              styles.intensityDesc,
                              {
                                color: isSel ? (isDark ? '#333333' : '#E2E8F0') : colors.textMuted,
                              },
                            ]}
                          >
                            {lvl.desc}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              )}

              {/* 5. Cadence Rhythm Metronome Target */}
              <Text style={[styles.sectionHeading, { color: colors.textMuted, marginTop: 14 }]}>
                CADENCE RHYTHM TARGET
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillScroll}>
                {CADENCE_OPTIONS.map((c) => {
                  const isSelected = selectedCadence === c.value;
                  return (
                    <TouchableOpacity
                      key={c.label}
                      activeOpacity={0.8}
                      onPress={() => {
                        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                        setSelectedCadence(c.value);
                      }}
                      style={[
                        styles.distPill,
                        {
                          backgroundColor: isSelected
                            ? colors.accent
                            : isDark
                            ? 'rgba(255, 255, 255, 0.05)'
                            : 'rgba(0, 0, 0, 0.04)',
                          borderColor: isSelected ? colors.accent : colors.surfaceBorder,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.distPillText,
                          {
                            color: isSelected ? (isDark ? '#000000' : '#FFFFFF') : colors.textPrimary,
                            fontWeight: isSelected ? '900' : '600',
                          },
                        ]}
                      >
                        {c.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {/* 6. Live Split Breakdown Table Preview */}
              <Text style={[styles.sectionHeading, { color: colors.textMuted, marginTop: 14 }]}>
                CALCULATED SPLIT TARGETS
              </Text>
              <View style={[styles.splitTable, { borderColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)' }]}>
                {previewSplits.slice(0, 10).map((s) => (
                  <View
                    key={s.kmNumber}
                    style={[
                      styles.splitTableRow,
                      { borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.04)' },
                    ]}
                  >
                    <Text style={[styles.splitKmCol, { color: colors.textMuted }]}>KM {s.kmNumber}</Text>
                    <Text style={[styles.splitPaceCol, { color: colors.accent }]}>
                      {formatPace(s.targetPaceSeconds)} /km
                    </Text>
                    <Text style={[styles.splitCumulCol, { color: colors.textSecondary }]}>
                      cumul. {Math.floor(s.cumulativeTargetSeconds / 60)}:
                      {String(s.cumulativeTargetSeconds % 60).padStart(2, '0')}
                    </Text>
                  </View>
                ))}
              </View>

              {/* Apply / Save Button */}
              <View style={{ marginTop: 20, marginBottom: 10 }}>
                <PerformaButton
                  title={pacerEnabled ? (isMidRun ? 'APPLY MID-RUN PACING' : 'LOCK PACER STRATEGY') : 'SAVE PREFERENCES (PACER OFF)'}
                  onPress={handleActivate}
                  variant="accent"
                  size="md"
                />
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Info / Question Mark Modal */}
      <InfoModal
        visible={showHelpModal}
        onClose={() => setShowHelpModal(false)}
        title="Adaptive Pacer Engine"
        subtitle="Physiological split curves & cadence control"
        badge="PERFORMA PRO INSTRUMENT"
        sections={[
          {
            title: 'How Pacer Strategy Works',
            content:
              'Unlike Ghost Mode which pits you against an opponent avatar on the map, Pacer Strategy calculates your target split pace per kilometer according to sports science pacing models.',
            icon: Activity,
          },
          {
            title: 'Negative Split (Elite Standard)',
            content:
              'Starts conservatively to save muscle glycogen, then progressively drops seconds every kilometer. The proven method for setting 5K, 10K, and Marathon personal bests.',
            icon: TrendingUp,
          },
          {
            title: 'Progression Intensity Levels',
            content:
              'Choose how aggressively your pace drops: Mild (~6s spread), Moderate (~12s spread), or Aggressive (~20s surge into the final stretch).',
            icon: Sliders,
          },
          {
            title: 'Cadence Rhythm Target',
            content:
              'Locking a cadence (e.g., 175-180 SPM) helps maintain optimal stride turnover efficiency, minimizing ground contact time and joint impact strain.',
            icon: Gauge,
          },
        ]}
      />
    </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  container: {
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    borderWidth: 1,
    maxHeight: '85%',
    paddingBottom: 24,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  kickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 3,
  },
  kicker: {
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  helpIconBtn: {
    padding: 2,
    marginLeft: 2,
  },
  title: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.4,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  toggleBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    marginBottom: 10,
  },
  toggleTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  toggleSub: {
    fontSize: 10.5,
    fontWeight: '500',
    marginTop: 2,
  },
  midRunSection: {
    marginBottom: 12,
  },
  seamlessRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  iconBoxSmall: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  rowSub: {
    fontSize: 10.5,
    fontWeight: '500',
    marginTop: 2,
  },
  sectionHeading: {
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginBottom: 8,
  },
  pillScroll: {
    flexDirection: 'row',
    marginBottom: 14,
  },
  distPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    marginRight: 8,
  },
  distPillText: {
    fontSize: 11.5,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 6,
  },
  inputsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeInput: {
    width: 52,
    height: 40,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '900',
  },
  colonText: {
    fontSize: 20,
    fontWeight: '900',
    marginHorizontal: 6,
  },
  avgPaceBox: {
    alignItems: 'flex-end',
  },
  avgPaceVal: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  avgPaceUnit: {
    fontSize: 10,
    fontWeight: '600',
  },
  strategyRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  strategyPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: RADIUS.md,
    borderWidth: 1,
  },
  strategyPillText: {
    fontSize: 11,
    fontWeight: '800',
  },
  intensitySection: {
    marginBottom: 12,
  },
  intensityRow: {
    flexDirection: 'row',
    gap: 8,
  },
  intensityBtn: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    alignItems: 'center',
  },
  intensityLabel: {
    fontSize: 10.5,
    textAlign: 'center',
  },
  intensityDesc: {
    fontSize: 8.5,
    fontWeight: '600',
    marginTop: 2,
    textAlign: 'center',
  },
  splitTable: {
    borderTopWidth: 1,
    marginBottom: 10,
  },
  splitTableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 7,
    borderBottomWidth: 1,
  },
  splitKmCol: {
    fontSize: 11,
    fontWeight: '800',
    width: '20%',
  },
  splitPaceCol: {
    fontSize: 11,
    fontWeight: '900',
    width: '40%',
    textAlign: 'center',
  },
  splitCumulCol: {
    fontSize: 11,
    fontWeight: '600',
    width: '40%',
    textAlign: 'right',
  },
});
