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
import { X, Check, Palette, Sparkles, Shield, Crown, Lock } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../../context/ThemeContext';
import { RADIUS } from '../../constants/theme';
import { PerformaButton } from '../common';
import { OFFICIAL_BANNERS, RasterBannerTheme } from '../../constants/Cosmetics';

export interface BannerTheme extends RasterBannerTheme {}

export const BANNER_THEMES: BannerTheme[] = OFFICIAL_BANNERS;

export const STORAGE_KEY_BANNER_THEME = '@performa_banner_theme_id';

interface BannerThemeModalProps {
  visible: boolean;
  onClose: () => void;
  activeThemeId: string;
  onThemeSelected: (themeId: string) => void;
}

export function BannerThemeModal({
  visible,
  onClose,
  activeThemeId,
  onThemeSelected,
}: BannerThemeModalProps) {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const [selectedId, setSelectedId] = useState<string>(activeThemeId || 'BANNER_EXPLORER');

  React.useEffect(() => {
    if (visible) {
      setSelectedId(activeThemeId || 'BANNER_EXPLORER');
    }
  }, [visible, activeThemeId]);

  const selectedTheme =
    BANNER_THEMES.find((t) => t.id === selectedId) || BANNER_THEMES[0];

  const handleApply = async () => {
    if (selectedTheme.isLocked) return;
    await AsyncStorage.setItem(STORAGE_KEY_BANNER_THEME, selectedId);
    onThemeSelected(selectedId);
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
              <Text style={[styles.kicker, { color: colors.accent }]}>BANNER CUSTOMIZATION</Text>
              <Text style={[styles.title, { color: colors.textPrimary }]}>Choose Profile Banner</Text>
            </View>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={onClose}
              style={[styles.closeBtn, { borderColor: colors.surfaceBorder, backgroundColor: isDark ? '#141A22' : '#F1F5F9' }]}
            >
              <X size={16} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Theme Preview Spotlight */}
          <View
            style={[
              styles.previewBox,
              {
                borderTopColor: isDark ? 'rgba(255, 255, 255, 0.16)' : 'rgba(0, 0, 0, 0.08)',
                borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.04)',
                borderLeftColor: isDark ? 'rgba(255, 255, 255, 0.07)' : 'rgba(0, 0, 0, 0.05)',
                borderRightColor: isDark ? 'rgba(255, 255, 255, 0.07)' : 'rgba(0, 0, 0, 0.05)',
                shadowColor: '#000000',
                shadowOpacity: 0.5,
                shadowRadius: 14,
              },
            ]}
          >
            {/* Banner Background Artwork */}
            {selectedTheme.image ? (
              <Image
                source={selectedTheme.image}
                style={StyleSheet.absoluteFill}
                resizeMode="cover"
              />
            ) : null}

            {/* Dark Tactical Scrim for Text Legibility */}
            <View
              style={[
                StyleSheet.absoluteFill,
                {
                  backgroundColor: isDark
                    ? 'rgba(8, 10, 14, 0.70)'
                    : 'rgba(255, 255, 255, 0.85)',
                },
              ]}
            />

            <View style={styles.previewTopRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Palette size={14} color={selectedTheme.accentColor} />
                <Text style={[styles.previewThemeName, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>
                  {selectedTheme.name}
                </Text>
              </View>
              <View style={[styles.previewBadge, { backgroundColor: selectedTheme.badgeBg, borderColor: 'rgba(255, 255, 255, 0.10)' }]}>
                <Text style={[styles.previewBadgeText, { color: selectedTheme.accentColor }]}>
                  {selectedTheme.tacticalCode || 'TACTICAL BANNER'}
                </Text>
              </View>
            </View>
            <Text style={[styles.previewTagline, { color: isDark ? 'rgba(255, 255, 255, 0.85)' : '#475569' }]}>
              {selectedTheme.isLocked ? `Requirements: ${selectedTheme.unlockRequirement}` : selectedTheme.tagline}
            </Text>
          </View>

          {/* Themes List */}
          <ScrollView style={styles.themesList} showsVerticalScrollIndicator={false}>
            <View style={styles.themesStack}>
              {BANNER_THEMES.map((theme) => {
                const isSelected = theme.id === selectedId;
                const isEquipped = theme.id === (activeThemeId || 'BANNER_EXPLORER');

                return (
                  <TouchableOpacity
                    key={theme.id}
                    activeOpacity={0.8}
                    onPress={() => setSelectedId(theme.id)}
                    style={[
                      styles.themeCard,
                      {
                        backgroundColor: isDark ? (isSelected ? 'rgba(22, 28, 40, 0.90)' : '#12161E') : '#F8FAFC',
                        borderColor: isSelected
                          ? 'rgba(255, 255, 255, 0.22)'
                          : isDark
                          ? 'rgba(255, 255, 255, 0.06)'
                          : 'rgba(0, 0, 0, 0.06)',
                        borderWidth: 1,
                        opacity: theme.isLocked ? 0.7 : 1,
                      },
                    ]}
                  >
                    <View style={styles.themeCardLeft}>
                      {/* 16:9 Thumbnail Image */}
                      <View
                        style={[
                          styles.themeThumbnail,
                          {
                            borderColor: isSelected ? 'rgba(255, 255, 255, 0.35)' : 'rgba(255,255,255,0.10)',
                            backgroundColor: theme.bgDark,
                          },
                        ]}
                      >
                        {theme.image ? (
                          <Image
                            source={theme.image}
                            style={styles.thumbnailImg}
                            resizeMode="cover"
                          />
                        ) : (
                          <View style={[styles.thumbnailFallback, { backgroundColor: theme.bgDark }]}>
                            <Text style={[styles.thumbnailFallbackText, { color: theme.accentColor }]}>OLED</Text>
                          </View>
                        )}
                      </View>

                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <Text style={[styles.themeCardName, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>
                            {theme.name}
                          </Text>
                          {theme.isLocked && (
                            <Lock size={12} color={colors.textMuted} />
                          )}
                        </View>
                        <Text style={[styles.themeCardDesc, { color: isDark ? 'rgba(255, 255, 255, 0.65)' : '#64748B' }]} numberOfLines={2}>
                          {theme.isLocked ? `Requires: ${theme.unlockRequirement}` : theme.tagline}
                        </Text>
                      </View>
                    </View>

                    {isEquipped ? (
                      <View style={[styles.equippedBadge, { backgroundColor: theme.accentColor }]}>
                        <Text style={styles.equippedBadgeText}>ACTIVE</Text>
                      </View>
                    ) : theme.isLocked ? (
                      <View style={[styles.equippedBadge, { backgroundColor: isDark ? '#2A2E39' : '#E2E8F0' }]}>
                        <Text style={[styles.equippedBadgeText, { color: colors.textMuted }]}>LOCKED</Text>
                      </View>
                    ) : isSelected ? (
                      <View style={[styles.checkCircle, { borderColor: theme.accentColor }]}>
                        <Check size={12} color={theme.accentColor} />
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
                selectedTheme.isLocked
                  ? `LOCKED (${selectedTheme.unlockRequirement})`
                  : selectedId === (activeThemeId || 'BANNER_EXPLORER')
                  ? 'CURRENTLY ACTIVE BANNER'
                  : 'EQUIP PROFILE BANNER'
              }
              disabled={selectedId === (activeThemeId || 'BANNER_EXPLORER') || !!selectedTheme.isLocked}
              onPress={handleApply}
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
    paddingVertical: 18,
    paddingHorizontal: 16,
    marginBottom: 14,
    overflow: 'hidden',
    position: 'relative',
    elevation: 4,
  },
  previewTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  previewThemeName: {
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0.2,
  },
  previewBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
    borderWidth: 1,
  },
  previewBadgeText: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.6,
  },
  previewTagline: {
    fontSize: 11.5,
    fontWeight: '600',
    lineHeight: 16,
  },
  themesList: {
    paddingHorizontal: 20,
    maxHeight: 280,
  },
  themesStack: {
    gap: 10,
    paddingBottom: 12,
  },
  themeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: RADIUS.lg,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  themeCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    marginRight: 10,
  },
  themeThumbnail: {
    width: 64,
    height: 36,
    borderRadius: RADIUS.sm,
    borderWidth: 1.5,
    overflow: 'hidden',
  },
  thumbnailImg: {
    width: '100%',
    height: '100%',
  },
  thumbnailFallback: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbnailFallbackText: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  themeCardName: {
    fontSize: 13.5,
    fontWeight: '900',
    marginBottom: 2,
  },
  themeCardDesc: {
    fontSize: 10.5,
    lineHeight: 14,
  },
  equippedBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
  },
  equippedBadgeText: {
    color: '#000000',
    fontSize: 8.5,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  checkCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: 1,
  },
});
