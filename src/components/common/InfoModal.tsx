import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X, HelpCircle, CheckCircle2 } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { RADIUS, SPACING } from '../../constants/theme';
import { PerformaButton } from './PerformaButton';

export interface InfoModalSection {
  title: string;
  content: string;
  bulletPoints?: string[];
  icon?: any;
}

interface InfoModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  badge?: string;
  sections: InfoModalSection[];
  accentColor?: string;
}

export function InfoModal({
  visible,
  onClose,
  title,
  subtitle,
  badge,
  sections,
  accentColor,
}: InfoModalProps) {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const accent = accentColor || colors.accent;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
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
            <View style={{ flex: 1, marginRight: 10 }}>
              {badge && (
                <View style={[styles.badge, { borderColor: accent, backgroundColor: isDark ? 'rgba(204, 255, 0, 0.08)' : 'rgba(0, 82, 255, 0.08)' }]}>
                  <Text style={[styles.badgeText, { color: accent }]}>{badge}</Text>
                </View>
              )}
              <Text style={[styles.title, { color: colors.textPrimary }]}>{title}</Text>
              {subtitle && <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{subtitle}</Text>}
            </View>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={onClose}
              style={[styles.closeBtn, { borderColor: colors.surfaceBorder, backgroundColor: isDark ? '#141A22' : '#F1F5F9' }]}
            >
              <X size={16} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Body Content */}
          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            {sections.map((sec, idx) => {
              const Icon = sec.icon || HelpCircle;
              return (
                <View
                  key={idx}
                  style={[
                    styles.sectionCard,
                    {
                      backgroundColor: isDark ? '#12161E' : '#F8FAFC',
                      borderColor: colors.surfaceBorder,
                    },
                  ]}
                >
                  <View style={styles.sectionHeaderRow}>
                    <View style={[styles.iconWrapper, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.05)' }]}>
                      <Icon size={16} color={accent} />
                    </View>
                    <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>{sec.title}</Text>
                  </View>
                  <Text style={[styles.sectionContent, { color: colors.textSecondary }]}>{sec.content}</Text>

                  {sec.bulletPoints && sec.bulletPoints.length > 0 && (
                    <View style={styles.bulletList}>
                      {sec.bulletPoints.map((bp, bIdx) => (
                        <View key={bIdx} style={styles.bulletItem}>
                          <CheckCircle2 size={12} color={accent} style={{ marginTop: 2, marginRight: 6 }} />
                          <Text style={[styles.bulletText, { color: colors.textSecondary }]}>{bp}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              );
            })}
          </ScrollView>

          {/* Footer Action */}
          <View style={[styles.footer, { borderTopColor: colors.surfaceBorder }]}>
            <PerformaButton
              title="GOT IT"
              onPress={onClose}
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
    maxHeight: '85%',
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
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    marginBottom: 6,
  },
  badgeText: {
    fontSize: 9.5,
    fontWeight: '900',
    letterSpacing: 0.6,
  },
  title: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.2,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
    lineHeight: 16,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  sectionCard: {
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    padding: 14,
    marginBottom: 10,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  iconWrapper: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  sectionContent: {
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '500',
  },
  bulletList: {
    marginTop: 8,
    gap: 4,
  },
  bulletItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  bulletText: {
    fontSize: 11.5,
    lineHeight: 16,
    flex: 1,
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: 1,
  },
});
