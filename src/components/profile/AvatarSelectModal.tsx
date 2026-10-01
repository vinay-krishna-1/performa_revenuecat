import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X, Check, Lock, Sparkles, Shield, Compass, Award } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../../context/ThemeContext';
import { RADIUS } from '../../constants/theme';
import { PerformaButton } from '../common';
import { AchievementService } from '../../features/achievements/AchievementService';
import { OFFICIAL_AVATARS, RasterAvatarItem } from '../../constants/Cosmetics';

export interface AvatarPreset {
  id: string;
  name: string;
  category: string;
  image?: any;
  emoji?: string;
  color: string;
  bg: string;
  isLocked?: boolean;
  unlockRequirement?: string;
  achievementId?: string;
}

export const AVATAR_PRESETS: AvatarPreset[] = [
  ...OFFICIAL_AVATARS,
  {
    id: 'initials',
    name: 'Athletic Initials',
    category: 'CLASSIC',
    color: '#CCFF00',
    bg: '#1C2333',
    isLocked: false,
    unlockRequirement: 'Classic athlete initials disc',
  },
];

interface AvatarSelectModalProps {
  visible: boolean;
  onClose: () => void;
  currentAvatarId: string | null;
  userInitials: string;
  onSelectAvatar: (avatarId: string) => void;
}

export function AvatarSelectModal({
  visible,
  onClose,
  currentAvatarId,
  userInitials,
  onSelectAvatar,
}: AvatarSelectModalProps) {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const [selectedId, setSelectedId] = useState<string>(currentAvatarId || 'avatar_explorer');

  React.useEffect(() => {
    if (visible) {
      setSelectedId(currentAvatarId || 'avatar_explorer');
    }
  }, [visible, currentAvatarId]);

  const presetsWithLockState = React.useMemo(() => {
    const achService = AchievementService.getInstance();
    const allAchs = achService.getAchievements();

    return AVATAR_PRESETS.map((preset) => {
      // Explorer and Initials are always unlocked by default
      if (preset.id === 'avatar_explorer' || preset.id === 'initials') {
        return { ...preset, isLocked: false };
      }
      if (preset.achievementId) {
        const found = allAchs.find((a) => a.definition.id === preset.achievementId);
        // Default unlock route pioneer and sprinter as starter rewards if user has activities
        const isUnlocked = found?.state?.unlocked ?? true;
        return { ...preset, isLocked: !isUnlocked };
      }
      return { ...preset, isLocked: false };
    });
  }, [visible]);

  const selectedPreset =
    presetsWithLockState.find((p) => p.id === selectedId) || presetsWithLockState[0];

  const handleApply = async () => {
    if (selectedPreset.isLocked) return;
    await AsyncStorage.setItem('@performa_avatar_id', selectedId);
    await AchievementService.getInstance().setAvatarUri(selectedId);
    onSelectAvatar(selectedId);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={[styles.overlay, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }]}>
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
          <View style={styles.header}>
            <View>
              <Text style={[styles.kicker, { color: colors.accent }]}>PROFILE IDENTITY</Text>
              <Text style={[styles.title, { color: colors.textPrimary }]}>Choose Avatar Disc</Text>
            </View>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={onClose}
              style={[styles.closeBtn, { borderColor: colors.surfaceBorder, backgroundColor: isDark ? '#141A22' : '#F1F5F9' }]}
            >
              <X size={16} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Large Spotlight Preview */}
          <View
            style={[
              styles.previewBox,
              {
                backgroundColor: isDark ? '#12161E' : '#F8FAFC',
                borderColor: selectedPreset.color,
                shadowColor: selectedPreset.color,
                shadowOpacity: 0.35,
                shadowRadius: 12,
              },
            ]}
          >
            <View
              style={[
                styles.previewAvatarCircle,
                {
                  backgroundColor: selectedPreset.bg,
                  borderColor: selectedPreset.color,
                  shadowColor: selectedPreset.color,
                  shadowOpacity: 0.6,
                  shadowRadius: 10,
                },
              ]}
            >
              {selectedPreset.image ? (
                <Image
                  source={selectedPreset.image}
                  style={styles.previewImage}
                  resizeMode="cover"
                />
              ) : (
                <Text style={[styles.previewInitials, { color: selectedPreset.color }]}>
                  {userInitials}
                </Text>
              )}
            </View>
            <Text style={[styles.previewName, { color: colors.textPrimary }]}>
              {selectedPreset.name}
            </Text>
            <View style={styles.previewMetaRow}>
              <View style={[styles.categoryBadge, { borderColor: selectedPreset.color, backgroundColor: `${selectedPreset.color}15` }]}>
                <Text style={[styles.categoryBadgeText, { color: selectedPreset.color }]}>
                  {selectedPreset.category}
                </Text>
              </View>
              <Text style={[styles.previewUnlockText, { color: selectedPreset.isLocked ? colors.gold : colors.textMuted }]}>
                {selectedPreset.isLocked
                  ? `LOCKED // ${selectedPreset.unlockRequirement}`
                  : selectedPreset.unlockRequirement}
              </Text>
            </View>
          </View>

          {/* Grid of Avatars */}
          <ScrollView style={styles.avatarList} showsVerticalScrollIndicator={false}>
            <View style={styles.avatarGrid}>
              {presetsWithLockState.map((preset) => {
                const isSelected = preset.id === selectedId;
                const isEquipped = preset.id === (currentAvatarId || 'avatar_explorer');

                return (
                  <TouchableOpacity
                    key={preset.id}
                    activeOpacity={0.8}
                    onPress={() => setSelectedId(preset.id)}
                    style={[
                      styles.avatarCard,
                      {
                        backgroundColor: isDark ? '#12161E' : '#F8FAFC',
                        borderColor: isSelected
                          ? colors.accent
                          : isDark
                          ? 'rgba(255, 255, 255, 0.08)'
                          : 'rgba(0, 0, 0, 0.06)',
                        opacity: preset.isLocked ? 0.7 : 1,
                      },
                      isSelected && styles.avatarCardSelected,
                    ]}
                  >
                    <View
                      style={[
                        styles.miniAvatarCircle,
                        {
                          backgroundColor: preset.bg,
                          borderColor: isSelected ? colors.accent : preset.color,
                        },
                      ]}
                    >
                      {preset.image ? (
                        <Image
                          source={preset.image}
                          style={styles.miniImage}
                          resizeMode="cover"
                        />
                      ) : (
                        <Text style={[styles.miniInitials, { color: preset.color }]}>
                          {userInitials}
                        </Text>
                      )}
                      {preset.isLocked && (
                        <View style={styles.lockOverlay}>
                          <Lock size={12} color="#FFFFFF" />
                        </View>
                      )}
                    </View>
                    <Text style={[styles.avatarCardName, { color: colors.textPrimary }]} numberOfLines={1}>
                      {preset.name}
                    </Text>
                    {isEquipped ? (
                      <View style={[styles.equippedBadge, { backgroundColor: colors.accent }]}>
                        <Text style={styles.equippedText}>EQUIPPED</Text>
                      </View>
                    ) : preset.isLocked ? (
                      <View style={[styles.equippedBadge, { backgroundColor: isDark ? '#2A2E39' : '#E2E8F0', flexDirection: 'row', alignItems: 'center', gap: 2, paddingHorizontal: 4 }]}>
                        <Lock size={8} color={colors.textMuted} />
                        <Text style={[styles.equippedText, { color: colors.textMuted, fontSize: 8 }]}>LOCKED</Text>
                      </View>
                    ) : null}
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>

          {/* Footer Action */}
          <View style={[styles.footer, { borderTopColor: colors.surfaceBorder }]}>
            <PerformaButton
              title={
                selectedPreset.isLocked
                  ? `LOCKED // ${selectedPreset.unlockRequirement}`
                  : selectedId === (currentAvatarId || 'avatar_explorer')
                  ? 'CURRENTLY EQUIPPED'
                  : 'EQUIP AVATAR DISC'
              }
              disabled={selectedPreset.isLocked || selectedId === (currentAvatarId || 'avatar_explorer')}
              onPress={handleApply}
              variant={selectedPreset.isLocked ? 'secondary' : 'accent'}
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
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  container: {
    maxHeight: '88%',
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
  },
  kicker: {
    fontSize: 9.5,
    fontWeight: '900',
    letterSpacing: 1.2,
    marginBottom: 2,
  },
  title: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewBox: {
    marginHorizontal: 20,
    borderRadius: RADIUS.lg,
    borderWidth: 1.5,
    paddingVertical: 16,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  previewAvatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2.5,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginBottom: 8,
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  previewInitials: {
    fontSize: 30,
    fontWeight: '900',
  },
  previewName: {
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0.2,
    marginBottom: 4,
  },
  previewMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  categoryBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
  },
  categoryBadgeText: {
    fontSize: 8.5,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  previewUnlockText: {
    fontSize: 10.5,
    fontWeight: '600',
  },
  avatarList: {
    paddingHorizontal: 20,
    maxHeight: 270,
  },
  avatarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    paddingBottom: 10,
  },
  avatarCard: {
    width: '31%',
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    paddingVertical: 12,
    paddingHorizontal: 6,
    alignItems: 'center',
  },
  avatarCardSelected: {
    elevation: 3,
  },
  miniAvatarCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginBottom: 6,
  },
  miniImage: {
    width: '100%',
    height: '100%',
  },
  miniInitials: {
    fontSize: 18,
    fontWeight: '900',
  },
  lockOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarCardName: {
    fontSize: 10.5,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 4,
  },
  equippedBadge: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: RADIUS.full,
  },
  equippedText: {
    color: '#000000',
    fontSize: 7.5,
    fontWeight: '900',
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: 1,
  },
});
