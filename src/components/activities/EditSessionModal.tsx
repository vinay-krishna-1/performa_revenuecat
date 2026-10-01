import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { X, Edit3, Check } from 'lucide-react-native';
import { RADIUS } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';
import { ActivitySummary } from '../../types';

interface EditSessionModalProps {
  visible: boolean;
  activity: ActivitySummary | null;
  onClose: () => void;
  onSave: (activityId: string, title: string, description: string) => Promise<void>;
}

export function EditSessionModal({
  visible,
  activity,
  onClose,
  onSave,
}: EditSessionModalProps) {
  const { colors, isDark } = useTheme();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (activity) {
      setTitle(activity.title || `${activity.type === 'RUN' ? 'Run' : activity.type === 'CYCLE' ? 'Cycle' : 'Walk'} Workout`);
      setDescription(activity.description || '');
    }
  }, [activity, visible]);

  const handleSave = async () => {
    if (!activity) return;
    setIsSaving(true);
    try {
      await onSave(activity.id, title.trim(), description.trim());
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  if (!activity) return null;

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.overlay}
      >
        <View
          style={[
            styles.modalBox,
            {
              backgroundColor: isDark ? '#0D0D12' : '#FFFFFF',
              borderColor: colors.surfaceBorder,
            },
          ]}
        >
          {/* Header */}
          <View style={[styles.headerRow, { borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#E2E8F0' }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Edit3 size={16} color={colors.accent} />
              <Text style={[styles.title, { color: colors.textPrimary }]}>Edit Session Details</Text>
            </View>
            <TouchableOpacity activeOpacity={0.7} onPress={onClose} style={styles.closeBtn}>
              <X size={16} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Form */}
          <View style={styles.formBody}>
            <Text style={[styles.label, { color: colors.textMuted }]}>SESSION NAME / TITLE</Text>
            <TextInput
              style={[
                styles.input,
                {
                  color: colors.textPrimary,
                  backgroundColor: isDark ? '#141A22' : '#F8FAFC',
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : '#CBD5E1',
                },
              ]}
              value={title}
              onChangeText={setTitle}
              placeholder="e.g. Morning 5K Pace Run"
              placeholderTextColor={colors.textMuted}
              maxLength={60}
            />

            <Text style={[styles.label, { color: colors.textMuted, marginTop: 14 }]}>
              WORKOUT NOTES & DESCRIPTION
            </Text>
            <TextInput
              style={[
                styles.textArea,
                {
                  color: colors.textPrimary,
                  backgroundColor: isDark ? '#141A22' : '#F8FAFC',
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : '#CBD5E1',
                },
              ]}
              value={description}
              onChangeText={setDescription}
              placeholder="How did this workout feel? Notes on cadence, terrain, or milestones..."
              placeholderTextColor={colors.textMuted}
              multiline
              numberOfLines={3}
              maxLength={200}
            />
          </View>

          {/* Actions */}
          <View style={styles.actionsRow}>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={onClose}
              style={[styles.cancelBtn, { borderColor: colors.surfaceBorder }]}
            >
              <Text style={[styles.cancelText, { color: colors.textSecondary }]}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleSave}
              disabled={isSaving}
              style={[styles.saveBtn, { backgroundColor: colors.accent }]}
            >
              <Check size={14} color={isDark ? '#000000' : '#FFFFFF'} strokeWidth={2.4} />
              <Text style={[styles.saveText, { color: isDark ? '#000000' : '#FFFFFF' }]}>
                {isSaving ? 'Saving...' : 'Save Details'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalBox: {
    width: '100%',
    maxWidth: 420,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    padding: 18,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  closeBtn: {
    padding: 4,
  },
  formBody: {
    paddingVertical: 14,
  },
  label: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  input: {
    height: 44,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 13,
    fontWeight: '600',
  },
  textArea: {
    minHeight: 74,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 12,
    textAlignVertical: 'top',
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 8,
  },
  cancelBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
  },
  cancelText: {
    fontSize: 12,
    fontWeight: '700',
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: RADIUS.sm,
  },
  saveText: {
    fontSize: 12,
    fontWeight: '800',
  },
});
