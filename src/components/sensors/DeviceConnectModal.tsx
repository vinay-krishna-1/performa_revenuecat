import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Image,
} from 'react-native';
import { COSMETIC_IMAGES } from '../../constants/Cosmetics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X, Heart, Bluetooth, Battery, CheckCircle2, RefreshCw, Zap, Watch } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { RADIUS, SPACING } from '../../constants/theme';
import { useSensorStore, getHeartRateZone } from '../../features/sensors/SensorService';

interface DeviceConnectModalProps {
  visible: boolean;
  onClose: () => void;
}

export function DeviceConnectModal({ visible, onClose }: DeviceConnectModalProps) {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();

  const {
    isScanning,
    connectedDevices,
    activeHeartRate,
    startScanning,
    connectDevice,
    disconnectDevice,
    toggleSimulation,
    isSimulatingSensors,
  } = useSensorStore();

  useEffect(() => {
    if (visible && !isScanning) {
      startScanning();
    }
  }, [visible]);

  const hrZone = activeHeartRate ? getHeartRateZone(activeHeartRate) : null;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View
          style={[
            styles.drawerSheet,
            {
              backgroundColor: isDark ? '#0D0D10' : '#FFFFFF',
              borderColor: colors.surfaceBorder,
              paddingBottom: insets.bottom + 20,
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
                { backgroundColor: isDark ? 'rgba(13, 13, 16, 0.88)' : 'rgba(255, 255, 255, 0.90)' },
              ]}
            />
          </View>

          {/* Header */}
          <View style={styles.headerRow}>
            <View style={styles.headerLeft}>
              <View style={[styles.iconCircle, { backgroundColor: 'rgba(255, 92, 108, 0.15)' }]}>
                <Heart size={20} color="#FF5C6C" />
              </View>
              <View>
                <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Device Connectivity</Text>
                <Text style={[styles.headerSubtitle, { color: colors.textMuted }]}>
                  Heart Rate Monitors, Smart Bands & Cadence
                </Text>
              </View>
            </View>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={onClose}
              style={[styles.closeButton, { backgroundColor: isDark ? '#1A1E24' : '#F1F5F9' }]}
            >
              <X size={18} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>

          {/* Active Sensor Live Reading Badge if connected */}
          {activeHeartRate && (
            <View style={[styles.liveTelemetryCard, { borderColor: hrZone?.color || colors.accent }]}>
              <View style={styles.liveLeft}>
                <Heart size={22} color={hrZone?.color || colors.accent} />
                <View style={{ marginLeft: 10 }}>
                  <Text style={[styles.liveBpmText, { color: colors.textPrimary }]}>
                    {activeHeartRate} <Text style={{ fontSize: 13, color: colors.textMuted }}>BPM</Text>
                  </Text>
                  <Text style={[styles.liveZoneText, { color: hrZone?.color || colors.accent }]}>
                    {hrZone?.zone} • {hrZone?.name.toUpperCase()} ({hrZone?.description})
                  </Text>
                </View>
              </View>
              <View style={[styles.activeLivePill, { backgroundColor: isDark ? 'rgba(32, 227, 162, 0.15)' : 'rgba(16, 185, 129, 0.12)' }]}>
                <View style={[styles.pulseDot, { backgroundColor: colors.accent }]} />
                <Text style={[styles.activeLiveText, { color: colors.accent }]}>TRANSMITTING</Text>
              </View>
            </View>
          )}

          {/* Quick Virtual Sensor for Demo Video & Testing */}
          <View
            style={[
              styles.simToggleCard,
              {
                borderColor: isSimulatingSensors ? colors.accent : colors.surfaceBorder,
                backgroundColor: isSimulatingSensors
                  ? isDark
                    ? 'rgba(204, 255, 0, 0.08)'
                    : 'rgba(0, 82, 255, 0.08)'
                  : isDark
                  ? '#12161C'
                  : '#F8FAFC',
              },
            ]}
          >
            <View style={styles.simLeft}>
              <View
                style={[
                  styles.simIconWrap,
                  {
                    backgroundColor: isSimulatingSensors
                      ? colors.accent
                      : isDark
                      ? '#1F242C'
                      : '#E2E8F0',
                  },
                ]}
              >
                <Zap size={16} color={isSimulatingSensors ? '#000000' : colors.textMuted} />
              </View>
              <View style={{ marginLeft: 12, flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={[styles.simTitle, { color: colors.textPrimary }]}>
                    Virtual Polar H10 HRM
                  </Text>
                  <View
                    style={[
                      styles.demoPill,
                      {
                        backgroundColor: isDark ? 'rgba(204, 255, 0, 0.15)' : 'rgba(0, 82, 255, 0.15)',
                        borderColor: colors.accent,
                      },
                    ]}
                  >
                    <Text style={[styles.demoPillText, { color: colors.accent }]}>DEMO READY</Text>
                  </View>
                </View>
                <Text style={[styles.simSubtitle, { color: colors.textMuted }]}>
                  {isSimulatingSensors
                    ? 'Active • Transmitting 144 BPM and 170 SPM cadence'
                    : '1-tap biometric simulation for video recording & telemetry testing'}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={toggleSimulation}
              style={[
                styles.actionConnectButton,
                isSimulatingSensors
                  ? { backgroundColor: 'rgba(255, 92, 108, 0.15)', borderColor: '#FF5C6C' }
                  : { backgroundColor: colors.accent, borderColor: colors.accent },
              ]}
            >
              <Text
                style={[
                  styles.actionConnectText,
                  { color: isSimulatingSensors ? '#FF5C6C' : '#000000' },
                ]}
              >
                {isSimulatingSensors ? 'Disconnect' : 'Connect'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.simNoticeBox, { borderColor: isDark ? 'rgba(255, 255, 255, 0.06)' : colors.surfaceBorder }]}>
            <Text style={[styles.simNoticeText, { color: colors.textMuted }]}>
              Biometric telemetry streams into the live recording HUD, cardiac redline guardrails, and the swipe-up metrics drawer.
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
    justifyContent: 'flex-end',
  },
  drawerSheet: {
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    borderTopWidth: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
    maxHeight: '82%',
    overflow: 'hidden',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  headerSubtitle: {
    fontSize: 11,
    marginTop: 2,
  },
  closeButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  liveTelemetryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1.5,
    borderRadius: RADIUS.lg,
    padding: 14,
    marginBottom: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
  },
  liveLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  liveBpmText: {
    fontSize: 22,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
  },
  liveZoneText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  activeLivePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: RADIUS.full,
    gap: 5,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  activeLiveText: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  scanRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  scanStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  scanText: {
    fontSize: 11,
    fontWeight: '600',
  },
  rescanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
    gap: 4,
  },
  rescanText: {
    fontSize: 11,
    fontWeight: '700',
  },
  deviceList: {
    maxHeight: 250,
  },
  deviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    marginBottom: 8,
  },
  deviceInfo: {
    flex: 1,
  },
  deviceNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  deviceName: {
    fontSize: 14,
    fontWeight: '800',
  },
  deviceMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 6,
  },
  protocolBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  protocolText: {
    color: '#8A99A8',
    fontSize: 9,
    fontWeight: '800',
  },
  batteryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  batteryText: {
    fontSize: 10,
    fontWeight: '600',
  },
  liveDeviceBpm: {
    fontSize: 11,
    fontWeight: '800',
  },
  actionConnectButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: RADIUS.md,
    borderWidth: 1,
  },
  actionConnectText: {
    fontSize: 12,
    fontWeight: '800',
  },
  simToggleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    marginBottom: 14,
  },
  simLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingRight: 10,
  },
  simIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  simTitle: {
    fontSize: 12,
    fontWeight: '800',
  },
  demoPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
  },
  demoPillText: {
    fontSize: 8.5,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  simSubtitle: {
    fontSize: 10,
    marginTop: 2,
  },
  simStateText: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  simNoticeBox: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    marginTop: 4,
    marginBottom: 8,
  },
  simNoticeText: {
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '500',
  },
});
