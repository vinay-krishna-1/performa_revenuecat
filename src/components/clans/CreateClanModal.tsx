import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { X, Shield, Flame, Crown, Zap, Award, Check } from 'lucide-react-native';
import { RADIUS } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';
import { ClanService } from '../../features/clans/ClanService';
import { useAuth } from '../../features/auth/AuthContext';
import { PerformaButton } from '../common';
import { ClanItem } from '../../types';

interface CreateClanModalProps {
  visible: boolean;
  onClose: () => void;
  onClanCreated: (clan: ClanItem) => void;
}

const BADGE_ICONS = [
  { id: 'Shield', label: 'Shield', icon: Shield },
  { id: 'Flame', label: 'Flame', icon: Flame },
  { id: 'Crown', label: 'Crown', icon: Crown },
  { id: 'Zap', label: 'Lightning', icon: Zap },
  { id: 'Award', label: 'Trophy', icon: Award },
];

const ACCENT_COLORS = [
  { id: '#CCFF00', name: 'Volt Neon' },
  { id: '#FF3B4B', name: 'Nitro Crimson' },
  { id: '#00F0FF', name: 'Cobalt Blue' },
  { id: '#A855F7', name: 'Apex Purple' },
  { id: '#F59E0B', name: 'Zenith Amber' },
];

export function CreateClanModal({ visible, onClose, onClanCreated }: CreateClanModalProps) {
  const { colors, isDark } = useTheme();
  const { user } = useAuth();

  const [name, setName] = useState('');
  const [tag, setTag] = useState('');
  const [motto, setMotto] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('Shield');
  const [selectedColor, setSelectedColor] = useState('#CCFF00');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) {
      Alert.alert('Missing Name', 'Please enter a name for your clan.');
      return;
    }
    if (!tag.trim() || tag.trim().length < 2 || tag.trim().length > 5) {
      Alert.alert('Invalid Tag', 'Clan Tag must be between 2 and 5 alphanumeric characters.');
      return;
    }
    if (!user) {
      Alert.alert('Authentication Required', 'Please sign in to found a clan.');
      return;
    }

    setIsSubmitting(true);
    try {
      const newClan = await ClanService.getInstance().createClan({
        name: name.trim(),
        tag: tag.trim(),
        description: motto.trim(),
        badgeIcon: selectedIcon,
        accentColor: selectedColor,
        user,
      });

      setIsSubmitting(false);
      onClanCreated(newClan);
      onClose();
    } catch (err) {
      console.warn('[CreateClanModal] Error creating clan:', err);
      setIsSubmitting(false);
      Alert.alert('Creation Failed', 'Could not create clan at this time.');
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
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
          <View style={styles.header}>
            <View>
              <Text style={[styles.kicker, { color: colors.accent }]}>COMMUNITY COLLECTIVE</Text>
              <Text style={[styles.title, { color: colors.textPrimary }]}>Found an Athletic Clan</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={[styles.closeBtn, { borderColor: colors.surfaceBorder }]}>
              <X size={16} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollBody}>
            {/* Clan Name */}
            <Text style={[styles.label, { color: colors.textMuted }]}>CLAN NAME</Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: isDark ? '#141418' : '#F8FAFC',
                  borderColor: colors.surfaceBorder,
                  color: colors.textPrimary,
                },
              ]}
              placeholder="e.g. Pacific Coast Striders"
              placeholderTextColor={colors.textMuted}
              value={name}
              onChangeText={setName}
              maxLength={35}
            />

            {/* Clan Tag */}
            <View style={styles.tagRow}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.label, { color: colors.textMuted }]}>CLAN TAG (2-5 CHARS)</Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: isDark ? '#141418' : '#F8FAFC',
                      borderColor: colors.surfaceBorder,
                      color: colors.textPrimary,
                      textTransform: 'uppercase',
                      fontWeight: '800',
                      letterSpacing: 2,
                    },
                  ]}
                  placeholder="e.g. PCS"
                  placeholderTextColor={colors.textMuted}
                  value={tag}
                  onChangeText={(val) => setTag(val.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                  maxLength={5}
                />
              </View>

              {/* Tag Preview */}
              <View style={styles.tagPreviewBox}>
                <Text style={[styles.label, { color: colors.textMuted }]}>PREVIEW</Text>
                <View
                  style={[
                    styles.tagBadge,
                    {
                      borderColor: selectedColor,
                      backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#F1F5F9',
                    },
                  ]}
                >
                  <Text style={[styles.tagBadgeText, { color: selectedColor }]}>
                    [{tag.trim() ? tag.trim().toUpperCase() : 'TAG'}]
                  </Text>
                </View>
              </View>
            </View>

            {/* Motto / Description */}
            <Text style={[styles.label, { color: colors.textMuted }]}>MOTTO & PHILOSOPHY</Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: isDark ? '#141418' : '#F8FAFC',
                  borderColor: colors.surfaceBorder,
                  color: colors.textPrimary,
                },
              ]}
              placeholder="e.g. Run together, endure forever."
              placeholderTextColor={colors.textMuted}
              value={motto}
              onChangeText={setMotto}
              maxLength={80}
            />

            {/* Crest Badge Icon Selection */}
            <Text style={[styles.label, { color: colors.textMuted }]}>CLAN CREST ICON</Text>
            <View style={styles.crestRow}>
              {BADGE_ICONS.map((item) => {
                const IconComp = item.icon;
                const isSelected = selectedIcon === item.id;
                return (
                  <TouchableOpacity
                    key={item.id}
                    onPress={() => setSelectedIcon(item.id)}
                    style={[
                      styles.crestChip,
                      {
                        backgroundColor: isSelected
                          ? isDark
                            ? 'rgba(204, 255, 0, 0.12)'
                            : 'rgba(0, 82, 255, 0.12)'
                          : isDark
                          ? '#141418'
                          : '#F8FAFC',
                        borderColor: isSelected ? selectedColor : colors.surfaceBorder,
                      },
                    ]}
                  >
                    <IconComp size={20} color={isSelected ? selectedColor : colors.textMuted} />
                    <Text
                      style={[
                        styles.crestChipLabel,
                        { color: isSelected ? colors.textPrimary : colors.textMuted },
                      ]}
                    >
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Accent Color Selection */}
            <Text style={[styles.label, { color: colors.textMuted }]}>CLAN ACCENT COLOR</Text>
            <View style={styles.colorRow}>
              {ACCENT_COLORS.map((c) => {
                const isSelected = selectedColor === c.id;
                return (
                  <TouchableOpacity
                    key={c.id}
                    onPress={() => setSelectedColor(c.id)}
                    style={[
                      styles.colorDotBox,
                      {
                        borderColor: isSelected ? colors.textPrimary : 'transparent',
                      },
                    ]}
                  >
                    <View style={[styles.colorDot, { backgroundColor: c.id }]}>
                      {isSelected && <Check size={12} color="#000000" strokeWidth={3} />}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Submit Button */}
            <View style={{ marginTop: 24 }}>
              <PerformaButton
                title={isSubmitting ? 'FOUNDING CLAN...' : 'FOUND CLAN & GENERATE INVITE'}
                disabled={isSubmitting}
                onPress={handleCreate}
                variant="accent"
                size="lg"
                icon={
                  isSubmitting ? (
                    <ActivityIndicator size="small" color="#000000" />
                  ) : (
                    <Shield size={16} color={isDark ? '#000000' : '#FFFFFF'} strokeWidth={2.4} />
                  )
                }
              />
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'flex-end',
  },
  container: {
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    borderWidth: 1,
    maxHeight: '90%',
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  kicker: {
    fontSize: 9.5,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  title: {
    fontSize: 17,
    fontWeight: '900',
    letterSpacing: -0.3,
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
  scrollBody: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
  },
  label: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderRadius: RADIUS.md,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 13,
  },
  tagRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
  },
  tagPreviewBox: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tagBadge: {
    borderWidth: 1.5,
    borderRadius: RADIUS.sm,
    paddingHorizontal: 14,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tagBadgeText: {
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 1,
  },
  crestRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  crestChip: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: RADIUS.md,
    borderWidth: 1,
  },
  crestChipLabel: {
    fontSize: 9,
    fontWeight: '700',
    marginTop: 4,
  },
  colorRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 6,
  },
  colorDotBox: {
    padding: 3,
    borderRadius: RADIUS.full,
    borderWidth: 1.5,
  },
  colorDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
