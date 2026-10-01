import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { COLORS, TYPOGRAPHY, SPACING } from '../../constants/theme';
import { PerformaButton } from './PerformaButton';

interface ErrorStateProps {
  whatHappened: string;
  whatYouCanDo: string;
  icon?: React.ReactNode;
  retryTitle?: string;
  onRetry?: () => void;
  style?: ViewStyle;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  whatHappened,
  whatYouCanDo,
  icon,
  retryTitle = 'Try Again',
  onRetry,
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      {icon && <View style={styles.iconContainer}>{icon}</View>}
      <Text style={styles.whatHappened}>{whatHappened}</Text>
      <Text style={styles.whatYouCanDo}>{whatYouCanDo}</Text>
      {onRetry && (
        <PerformaButton
          title={retryTitle}
          onPress={onRetry}
          variant="primary"
          size="md"
          fullWidth={false}
          style={styles.retryButton}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: SPACING.xl,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.dangerMuted,
    marginVertical: SPACING.md,
  },
  iconContainer: {
    marginBottom: SPACING.md,
  },
  whatHappened: {
    ...TYPOGRAPHY.h3,
    color: COLORS.danger,
    textAlign: 'center',
    marginBottom: SPACING.xs,
  },
  whatYouCanDo: {
    ...TYPOGRAPHY.body,
    textAlign: 'center',
    color: COLORS.textSecondary,
    marginBottom: SPACING.lg,
    maxWidth: 290,
  },
  retryButton: {
    minWidth: 150,
  },
});
