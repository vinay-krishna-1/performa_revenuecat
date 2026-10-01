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
import { X, Check, Lock, Sparkles } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { RADIUS, SPACING } from '../../constants/theme';
import { ProfileFrame } from '../../features/achievements/AchievementTypes';
import { ALL_FRAMES } from '../../features/achievements/FrameDefinitions';
import { AchievementService } from '../../features/achievements/AchievementService';
import { PerformaButton } from '../common';

interface FrameSelectModalProps {
  visible: boolean;
  onClose: () => void;
  activeFrameId: string;
  userLevel: number;
  userInitials: string;
  onFrameSelected: (frameId: string) => void;
}

export function FrameSelectModal({
  visible,
  onClose,
  activeFrameId,
  userLevel,
  userInitials,
  onFrameSelected,
}: FrameSelectModalProps) {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const [frames, setFrames] = useState<ProfileFrame[]>(() =>
    AchievementService.getInstance().getAllFrames()
  );
  const [selectedId, setSelectedId] = useState(activeFrameId);

  React.useEffect(() => {
    if (visible) {
      const liveFrames = AchievementService.getInstance().getAllFrames();
      setFrames(liveFrames);
      setSelectedId(activeFrameId);
    }
  }, [visible, activeFrameId]);

  const selectedFrame = frames.find((f) => f.id === selectedId) || frames[0];
  const isSelectedLocked = !selectedFrame.unlocked;
  const isSelectedEquipped = selectedId === activeFrameId;

  const handleEquip = async () => {
    if (isSelectedLocked) return;
    const ok = await AchievementService.getInstance().setActiveFrame(selectedId);
    if (ok) {
      onFrameSelected(selectedId);
      onClose();
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={[styles.overlay, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 }]}>
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
              <Text style={[styles.kicker, { color: colors.accent }]}>ATHLETE CUSTOMIZATION</Text>
              <Text style={[styles.title, { color: colors.textPrimary }]}>Equip Profile Frame</Text>
            </View>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={onClose}
              style={[styles.closeBtn, { borderColor: colors.surfaceBorder, backgroundColor: isDark ? '#141A22' : '#F1F5F9' }]}
            >
              <X size={16} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Frame Live Preview Spotlight */}
          <View
            style={[
              styles.previewBox,
              {
                backgroundColor: isDark ? '#12161E' : '#F8FAFC',
                borderColor: selectedFrame.borderColor,
                shadowColor: selectedFrame.borderColor,
                shadowOpacity: 0.4,
                shadowRadius: 12,
              },
            ]}
          >
            <View style={styles.previewAvatarContainer}>
              {/* Inner Avatar Initials Circle */}
              <View
                style={[
                  styles.previewAvatarInner,
                  {
                    backgroundColor: isDark ? '#1C2333' : '#E2E8F0',
                  },
                ]}
              >
                <Text style={[styles.previewInitials, { color: colors.textPrimary }]}>
                  {userInitials}
                </Text>
              </View>

              {/* Transparent PNG Frame Overlay */}
              {selectedFrame.image ? (
                <Image
                  source={selectedFrame.image}
                  style={styles.previewFrameImageOverlay}
                  resizeMode="contain"
                />
              ) : (
                <View
                  style={[
                    styles.previewFrameOuterFallback,
                    {
                      borderColor: selectedFrame.borderColor,
                    },
                  ]}
                />
              )}

              {/* Level Badge Docked to Bottom of Frame */}
              <View
                style={[
                  styles.previewLevelBadge,
                  {
                    backgroundColor: selectedFrame.borderColor,
                    borderColor: isDark ? '#0D0D12' : '#FFFFFF',
                  },
                ]}
              >
                <Text style={styles.previewLevelText}>LVL {userLevel}</Text>
              </View>
            </View>

            <View style={styles.previewMeta}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={[styles.previewFrameName, { color: colors.textPrimary }]}>
                  {selectedFrame.name}
                </Text>
                {isSelectedLocked && (
                  <View style={[styles.lockedTag, { borderColor: colors.surfaceBorder }]}>
                    <Lock size={10} color={colors.textMuted} />
                    <Text style={[styles.lockedTagText, { color: colors.textMuted }]}>LOCKED</Text>
                  </View>
                )}
              </View>
              <View style={[styles.rarityPill, { borderColor: selectedFrame.borderColor, backgroundColor: `${selectedFrame.borderColor}15` }]}>
                <Text style={[styles.rarityText, { color: selectedFrame.borderColor }]}>
                  {selectedFrame.rarity}
                </Text>
              </View>
              <Text style={[styles.previewUnlockDesc, { color: isSelectedLocked ? colors.gold : colors.textMuted }]}>
                {isSelectedLocked
                  ? `Requirements: ${selectedFrame.unlockRequirement || 'Unlock via milestone'}`
                  : (selectedFrame.unlockRequirement || 'Unlocked and ready to equip')}
              </Text>
            </View>
          </View>

          {/* Frames Grid */}
          <ScrollView style={styles.framesList} showsVerticalScrollIndicator={false}>
            <View style={styles.framesGrid}>
              {frames.map((frame) => {
                const isSelected = frame.id === selectedId;
                const isEquipped = frame.id === activeFrameId;
                const isLocked = !frame.unlocked;

                return (
                  <TouchableOpacity
                    key={frame.id}
                    activeOpacity={0.8}
                    onPress={() => setSelectedId(frame.id)}
                    style={[
                      styles.frameCard,
                      {
                        backgroundColor: isDark ? '#12161E' : '#F8FAFC',
                        borderColor: isSelected
                          ? colors.accent
                          : isDark
                          ? 'rgba(255, 255, 255, 0.08)'
                          : 'rgba(0, 0, 0, 0.06)',
                        opacity: isLocked ? 0.7 : 1,
                      },
                      isSelected && styles.frameCardSelected,
                    ]}
                  >
                    {/* Frame Miniature with Transparent Ring Overlay */}
                    <View style={styles.miniFrameCircle}>
                      <View style={[styles.miniAvatarCore, { backgroundColor: isDark ? '#1C2333' : '#E2E8F0' }]}>
                        {isLocked ? (
                          <Lock size={12} color={colors.textMuted} />
                        ) : (
                          <Text style={[styles.miniInitials, { color: colors.textPrimary }]}>
                            {userInitials}
                          </Text>
                        )}
                      </View>

                      {frame.image ? (
                        <Image
                          source={frame.image}
                          style={styles.miniFrameImageOverlay}
                          resizeMode="contain"
                        />
                      ) : (
                        <View
                          style={[
                            StyleSheet.absoluteFill,
                            {
                              borderRadius: 25,
                              borderWidth: 2,
                              borderColor: frame.borderColor,
                            },
                          ]}
                        />
                      )}
                    </View>

                    <Text style={[styles.miniFrameName, { color: colors.textPrimary }]} numberOfLines={1}>
                      {frame.name}
                    </Text>

                    <View style={styles.cardStatusRow}>
                      {isEquipped ? (
                        <View style={[styles.equippedBadge, { backgroundColor: colors.accent }]}>
                          <Text style={styles.equippedBadgeText}>EQUIPPED</Text>
                        </View>
                      ) : isLocked ? (
                        <View style={styles.lockedPillMini}>
                          <Lock size={9} color={colors.textMuted} />
                          <Text style={[styles.lockedPillMiniText, { color: colors.textMuted }]}>
                            LOCKED
                          </Text>
                        </View>
                      ) : (
                        <Text style={[styles.miniRarity, { color: frame.borderColor }]}>
                          {frame.rarity}
                        </Text>
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>

          {/* Footer Action */}
          <View style={[styles.footer, { borderTopColor: colors.surfaceBorder }]}>
            <PerformaButton
              title={
                isSelectedLocked
                  ? `LOCKED (${selectedFrame.unlockRequirement || 'UNLOCK VIA ACHIEVEMENTS'})`
                  : isSelectedEquipped
                  ? 'CURRENTLY EQUIPPED'
                  : 'EQUIP FRAME'
              }
              disabled={isSelectedLocked || isSelectedEquipped}
              onPress={handleEquip}
              variant={isSelectedLocked ? 'secondary' : 'accent'}
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
    maxHeight: '90%',
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
    paddingVertical: 18,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginBottom: 12,
  },
  previewAvatarContainer: {
    position: 'relative',
    width: 90,
    height: 90,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  previewAvatarInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewInitials: {
    fontSize: 24,
    fontWeight: '900',
  },
  previewFrameImageOverlay: {
    position: 'absolute',
    width: 90,
    height: 90,
  },
  previewFrameOuterFallback: {
    position: 'absolute',
    width: 82,
    height: 82,
    borderRadius: 41,
    borderWidth: 3.5,
  },
  previewLevelBadge: {
    position: 'absolute',
    bottom: -4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
    borderWidth: 2,
    elevation: 4,
    zIndex: 5,
  },
  previewLevelText: {
    color: '#000000',
    fontSize: 9.5,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  previewMeta: {
    alignItems: 'center',
    gap: 4,
  },
  previewFrameName: {
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 0.2,
  },
  rarityPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
    borderWidth: 1,
  },
  rarityText: {
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  previewUnlockDesc: {
    fontSize: 10.5,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 2,
  },
  framesList: {
    paddingHorizontal: 20,
    maxHeight: 260,
  },
  framesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    paddingBottom: 10,
  },
  frameCard: {
    width: '31%',
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    paddingVertical: 12,
    paddingHorizontal: 6,
    alignItems: 'center',
  },
  frameCardSelected: {
    elevation: 3,
  },
  miniFrameCircle: {
    position: 'relative',
    width: 50,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  miniAvatarCore: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniFrameImageOverlay: {
    position: 'absolute',
    width: 50,
    height: 50,
  },
  miniInitials: {
    fontSize: 13,
    fontWeight: '900',
  },
  miniFrameName: {
    fontSize: 10.5,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 4,
  },
  cardStatusRow: {
    minHeight: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniRarity: {
    fontSize: 8.5,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  equippedBadge: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: RADIUS.full,
  },
  equippedBadgeText: {
    color: '#000000',
    fontSize: 7.5,
    fontWeight: '900',
  },
  lockedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    borderWidth: 1,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: RADIUS.full,
  },
  lockedTagText: {
    fontSize: 8,
    fontWeight: '800',
  },
  lockedPillMini: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  lockedPillMiniText: {
    fontSize: 8,
    fontWeight: '800',
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: 1,
  },
});
