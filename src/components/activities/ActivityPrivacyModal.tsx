import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Switch,
  LayoutAnimation,
} from 'react-native';
import { Shield, Globe, EyeOff, Check, X, Info } from 'lucide-react-native';
import { RADIUS } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';
import { RoutePrivacyMode } from '../../types';
import { PerformaButton } from '../common/PerformaButton';

interface ActivityPrivacyModalProps {
  visible: boolean;
  onClose: () => void;
  activityTitle?: string;
  currentMode: RoutePrivacyMode;
  onSave: (mode: RoutePrivacyMode, applyToAll: boolean) => void;
}

export function ActivityPrivacyModal({
  visible,
  onClose,
  activityTitle,
  currentMode,
  onSave,
}: ActivityPrivacyModalProps) {
  const { colors, isDark } = useTheme();
  const [selectedMode, setSelectedMode] = useState<RoutePrivacyMode>(currentMode);
  const [applyToAll, setApplyToAll] = useState(false);

  React.useEffect(() => {
    setSelectedMode(currentMode);
    setApplyToAll(false);
  }, [currentMode, visible]);

  const handleSelect = (mode: RoutePrivacyMode) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setSelectedMode(mode);
  };

  const handleConfirm = () => {
    onSave(selectedMode, applyToAll);
    onClose();
  };

  const options: {
    mode: RoutePrivacyMode;
    title: string;
    description: string;
    icon: any;
    badge: string;
  }[] = [
    {
      mode: 'FULL',
      title: 'Public (Full GPS Map)',
      description: 'Full GPS path, start/finish pins, and satellite terrain visible to training partners & community.',
      icon: Globe,
      badge: 'DEFAULT',
    },
    {
      mode: 'SILHOUETTE_ONLY',
      title: 'Silhouette Only',
      description: 'Abstract route outline and elevation profile displayed without street names or geographical location.',
      icon: Shield,
      badge: 'PRIVACY GUARD',
    },
    {
      mode: 'HIDDEN',
      title: 'Hidden (Metrics Only)',
      description: 'Map completely removed from activity feed. Distance, pace, splits, and heart rate remain visible.',
      icon: EyeOff,
      badge: 'STEALTH',
    },
  ];

  return (
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
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.07)' : 'rgba(0, 0, 0, 0.08)' }]}>
            <View style={{ flex: 1 }}>
              <View style={styles.kickerRow}>
                <Shield size={11} color={colors.accent} />
                <Text style={[styles.kicker, { color: colors.accent }]}>MAP VISIBILITY & PRIVACY</Text>
              </View>
              <Text style={[styles.title, { color: colors.textPrimary }]}>Activity Map Display</Text>
              {activityTitle ? (
                <Text style={[styles.subtitle, { color: colors.textMuted }]} numberOfLines={1}>
                  Target: {activityTitle}
                </Text>
              ) : null}
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

          {/* Options */}
          <View style={styles.optionsList}>
            {options.map((opt) => {
              const isSelected = selectedMode === opt.mode;
              const Icon = opt.icon;
              return (
                <TouchableOpacity
                  key={opt.mode}
                  activeOpacity={0.8}
                  onPress={() => handleSelect(opt.mode)}
                  style={[
                    styles.optionRow,
                    {
                      borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)',
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.iconCircle,
                      {
                        backgroundColor: isSelected
                          ? isDark
                            ? 'rgba(204, 255, 0, 0.14)'
                            : 'rgba(0, 82, 255, 0.12)'
                          : isDark
                          ? 'rgba(255, 255, 255, 0.05)'
                          : 'rgba(0, 0, 0, 0.04)',
                      },
                    ]}
                  >
                    <Icon size={18} color={isSelected ? colors.accent : colors.textMuted} />
                  </View>

                  <View style={{ flex: 1, marginLeft: 12, marginRight: 8 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text
                        style={[
                          styles.optTitle,
                          {
                            color: isSelected ? colors.textPrimary : colors.textSecondary,
                            fontWeight: isSelected ? '900' : '700',
                          },
                        ]}
                      >
                        {opt.title}
                      </Text>
                      {opt.badge && (
                        <View
                          style={[
                            styles.badgePill,
                            {
                              backgroundColor: isSelected
                                ? isDark
                                  ? 'rgba(204, 255, 0, 0.15)'
                                  : 'rgba(0, 82, 255, 0.15)'
                                : isDark
                                ? 'rgba(255, 255, 255, 0.06)'
                                : 'rgba(0, 0, 0, 0.05)',
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.badgeText,
                              { color: isSelected ? colors.accent : colors.textMuted },
                            ]}
                          >
                            {opt.badge}
                          </Text>
                        </View>
                      )}
                    </View>
                    <Text style={[styles.optDesc, { color: colors.textMuted }]}>
                      {opt.description}
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.radioCircle,
                      {
                        borderColor: isSelected ? colors.accent : colors.surfaceBorder,
                        backgroundColor: isSelected ? colors.accent : 'transparent',
                      },
                    ]}
                  >
                    {isSelected && <Check size={12} color={isDark ? '#000000' : '#FFFFFF'} strokeWidth={3} />}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Apply to All Toggle */}
          <View
            style={[
              styles.applyAllRow,
              {
                borderTopColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)',
              },
            ]}
          >
            <View style={{ flex: 1, marginRight: 12 }}>
              <Text style={[styles.applyAllTitle, { color: colors.textPrimary }]}>
                Apply to All Activities
              </Text>
              <Text style={[styles.applyAllSub, { color: colors.textMuted }]}>
                Sets this as your global default and updates your entire activity history.
              </Text>
            </View>
            <Switch
              value={applyToAll}
              onValueChange={(val) => {
                LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                setApplyToAll(val);
              }}
              trackColor={{ false: isDark ? '#2D3748' : '#CBD5E1', true: colors.accent }}
              thumbColor={isDark ? '#000000' : '#FFFFFF'}
            />
          </View>

          {/* Action Button */}
          <View style={{ marginTop: 14 }}>
            <PerformaButton
              title="SAVE MAP DISPLAY"
              onPress={handleConfirm}
              variant="accent"
              size="md"
            />
          </View>
        </View>
      </View>
    </Modal>
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
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  kickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  kicker: {
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  title: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.4,
  },
  subtitle: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionsList: {
    paddingVertical: 4,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optTitle: {
    fontSize: 13.5,
  },
  badgePill: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  badgeText: {
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  optDesc: {
    fontSize: 10.5,
    fontWeight: '500',
    marginTop: 2,
    lineHeight: 14,
  },
  radioCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyAllRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 14,
    paddingBottom: 4,
    borderTopWidth: 1,
  },
  applyAllTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  applyAllSub: {
    fontSize: 10,
    fontWeight: '500',
    marginTop: 2,
    lineHeight: 14,
  },
});
