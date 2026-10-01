import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle, LayoutAnimation } from 'react-native';
import { RADIUS, SPACING } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';

export interface SegmentOption<T extends string = string> {
  id: T;
  label: string;
  badge?: string | number;
}

interface SegmentedControlProps<T extends string = string> {
  options: SegmentOption<T>[];
  selectedId: T;
  onSelect: (id: T) => void;
  style?: ViewStyle;
}

export function SegmentedControl<T extends string = string>({
  options,
  selectedId,
  onSelect,
  style,
}: SegmentedControlProps<T>) {
  const { colors, isDark } = useTheme();

  const handlePress = (id: T) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    onSelect(id);
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.04)',
          borderColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.05)',
        },
        style,
      ]}
    >
      {options.map((opt) => {
        const isSelected = opt.id === selectedId;
        return (
          <TouchableOpacity
            key={opt.id}
            activeOpacity={0.75}
            onPress={() => handlePress(opt.id)}
            style={[
              styles.segment,
              isSelected && {
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
              },
            ]}
          >
            <Text
              style={[
                styles.segmentText,
                {
                  color: isSelected ? colors.textPrimary : colors.textMuted,
                  fontWeight: isSelected ? '900' : '600',
                },
              ]}
            >
              {opt.label}
            </Text>
            {opt.badge !== undefined && (
              <View
                style={[
                  styles.badge,
                  {
                    backgroundColor: isSelected
                      ? colors.accent
                      : isDark
                      ? 'rgba(255, 255, 255, 0.08)'
                      : 'rgba(0, 0, 0, 0.06)',
                  },
                ]}
              >
                <Text
                  style={[
                    styles.badgeText,
                    {
                      color: isSelected
                        ? (isDark ? '#000000' : '#FFFFFF')
                        : colors.textMuted,
                    },
                  ]}
                >
                  {opt.badge}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderRadius: RADIUS.full,
    padding: 2.5,
    borderWidth: 1,
  },
  segment: {
    flex: 1,
    paddingVertical: 7,
    paddingHorizontal: SPACING.sm,
    borderRadius: RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  segmentText: {
    fontSize: 11.5,
    letterSpacing: 0.4,
  },
  badge: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: RADIUS.full,
    marginLeft: 4,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
  },
});
