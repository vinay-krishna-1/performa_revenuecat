import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ShieldCheck, MapPin, Trophy, Flame, Check } from 'lucide-react-native';
import * as Location from 'expo-location';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS } from '../../src/constants/theme';
import { ActivityType } from '../../src/constants/config';
import { Units } from '../../src/types';
import { useAuth } from '../../src/features/auth/AuthContext';
import { PerformaButton, PerformaCard, SegmentedControl } from '../../src/components/common';

export default function OnboardingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { completeOnboarding, user } = useAuth();

  const [step, setStep] = useState<number>(1);
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [username, setUsername] = useState(user?.username || '');
  const [preferredActivity, setPreferredActivity] = useState<ActivityType>('RUN');
  const [units, setUnits] = useState<Units>('METRIC');
  const [permissionGranted, setPermissionGranted] = useState(false);

  React.useEffect(() => {
    if (!user) {
      // Must have signed up before calibrating onboarding
      router.replace('/(auth)/signup');
    } else {
      if (user.displayName && !displayName) setDisplayName(user.displayName);
      if (user.username && !username) setUsername(user.username);
    }
  }, [user]);

  const requestGps = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        setPermissionGranted(true);
      }
    } catch {
      // Gracefully handle on web/sim
      setPermissionGranted(true);
    }
  };

  const handleStep1Continue = () => {
    if (!displayName.trim()) {
      Alert.alert('Required Field', 'Please enter your athlete name or display tag.');
      return;
    }
    if (!username.trim() || username.trim().length < 3) {
      Alert.alert('Required Field', 'Username must be at least 3 characters.');
      return;
    }
    setStep(2);
  };

  const handleFinish = async () => {
    if (!displayName.trim() || !username.trim()) {
      Alert.alert('Missing Identity', 'Please complete your athlete profile details.');
      setStep(1);
      return;
    }
    await completeOnboarding({
      displayName: displayName.trim(),
      username: username.trim().toLowerCase(),
      preferredActivity,
      units,
    });
    router.replace('/(tabs)/home');
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Progress indicator */}
        <View style={styles.stepIndicatorRow}>
          <View style={[styles.stepDot, step >= 1 && styles.stepDotActive]} />
          <View style={[styles.stepBar, step >= 2 && styles.stepBarActive]} />
          <View style={[styles.stepDot, step >= 2 && styles.stepDotActive]} />
          <View style={[styles.stepBar, step >= 3 && styles.stepBarActive]} />
          <View style={[styles.stepDot, step >= 3 && styles.stepDotActive]} />
        </View>

        {step === 1 && (
          <View>
            <Text style={styles.title}>Your Athlete Identity</Text>
            <Text style={styles.subtitle}>Choose how your competitors and clan see you.</Text>

            <PerformaCard padding="lg" elevated style={styles.card}>
              <Text style={styles.inputLabel}>DISPLAY NAME</Text>
              <TextInput
                value={displayName}
                onChangeText={setDisplayName}
                style={styles.input}
                placeholder="Full Name or Athlete Tag"
                placeholderTextColor={COLORS.textMuted}
              />

              <Text style={[styles.inputLabel, { marginTop: SPACING.md }]}>USERNAME</Text>
              <TextInput
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                style={styles.input}
                placeholder="username"
                placeholderTextColor={COLORS.textMuted}
              />

              <PerformaButton
                title="Continue"
                onPress={handleStep1Continue}
                variant="primary"
                size="md"
                style={{ marginTop: SPACING.lg }}
              />
            </PerformaCard>
          </View>
        )}

        {step === 2 && (
          <View>
            <Text style={styles.title}>Training Preferences</Text>
            <Text style={styles.subtitle}>Tailor your leaderboards and unit calculations.</Text>

            <PerformaCard padding="lg" elevated style={styles.card}>
              <Text style={styles.inputLabel}>PRIMARY SPORT</Text>
              <View style={styles.sportGrid}>
                {(['RUN', 'CYCLE', 'WALK'] as ActivityType[]).map((sport) => {
                  const isSelected = preferredActivity === sport;
                  return (
                    <TouchableOpacity
                      key={sport}
                      activeOpacity={0.8}
                      onPress={() => setPreferredActivity(sport)}
                      style={[styles.sportCard, isSelected && styles.sportCardSelected]}
                    >
                      <Text style={[styles.sportCardText, isSelected && styles.sportCardTextSelected]}>
                        {sport}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={[styles.inputLabel, { marginTop: SPACING.lg }]}>MEASUREMENT UNITS</Text>
              <SegmentedControl<Units>
                options={[
                  { id: 'METRIC', label: 'Metric (km / meters)' },
                  { id: 'IMPERIAL', label: 'Imperial (miles / feet)' },
                ]}
                selectedId={units}
                onSelect={(u) => setUnits(u)}
              />

              <PerformaButton
                title="Continue"
                onPress={() => setStep(3)}
                variant="primary"
                size="md"
                style={{ marginTop: SPACING.xl }}
              />
            </PerformaCard>
          </View>
        )}

        {step === 3 && (
          <View>
            <Text style={styles.title}>The Performa Philosophy</Text>
            <Text style={styles.subtitle}>Physical activity is your gameplay.</Text>

            <PerformaCard padding="lg" elevated style={styles.card}>
              <View style={styles.featureItem}>
                <Flame size={22} color={COLORS.accent} />
                <View style={{ flex: 1, marginLeft: SPACING.md }}>
                  <Text style={styles.featureTitle}>Healthy Consistency {'>'} Extreme Volume</Text>
                  <Text style={styles.featureDesc}>
                    Complete 2 activities a week to keep your streak. Rest days are celebrated.
                  </Text>
                </View>
              </View>

              <View style={styles.featureDivider} />

              <View style={styles.featureItem}>
                <Trophy size={22} color={COLORS.gold} />
                <View style={{ flex: 1, marginLeft: SPACING.md }}>
                  <Text style={styles.featureTitle}>56-Day Season & Weekly Zenith 100</Text>
                  <Text style={styles.featureDesc}>
                    8 structured weeks. Every Sunday at 23:59:59 UTC, athletes in the top 100 earn the permanent Zenith title.
                  </Text>
                </View>
              </View>

              <View style={styles.featureDivider} />

              <View style={styles.featureItem}>
                <MapPin size={22} color={COLORS.primaryBright} />
                <View style={{ flex: 1, marginLeft: SPACING.md }}>
                  <Text style={styles.featureTitle}>Location Permission</Text>
                  <Text style={styles.featureDesc}>
                    Performa uses your location to record routes and asynchronous ghost challenges.
                  </Text>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={requestGps}
                    style={styles.permissionBtn}
                  >
                    <Text style={styles.permissionBtnText}>
                      {permissionGranted ? 'GPS Ready ✓' : 'Enable Location'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <PerformaButton
                title="Enter Performa"
                onPress={handleFinish}
                variant="accent"
                size="lg"
                style={{ marginTop: SPACING.lg }}
              />
            </PerformaCard>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    flexGrow: 1,
  },
  stepIndicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xl,
  },
  stepDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.surfaceBorder,
  },
  stepDotActive: {
    backgroundColor: COLORS.accent,
  },
  stepBar: {
    width: 40,
    height: 3,
    backgroundColor: COLORS.surfaceBorder,
    marginHorizontal: 4,
  },
  stepBarActive: {
    backgroundColor: COLORS.accent,
  },
  title: {
    ...TYPOGRAPHY.h1,
    marginBottom: SPACING.xs,
  },
  subtitle: {
    ...TYPOGRAPHY.body,
    marginBottom: SPACING.lg,
  },
  card: {
    marginBottom: SPACING.lg,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  input: {
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    paddingHorizontal: SPACING.md,
    height: 48,
    color: COLORS.textPrimary,
    fontSize: 15,
  },
  sportGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  sportCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    alignItems: 'center',
  },
  sportCardSelected: {
    borderColor: COLORS.accent,
    backgroundColor: COLORS.accentMuted,
  },
  sportCardText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  sportCardTextSelected: {
    color: COLORS.accent,
    fontWeight: '800',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  featureDesc: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
    lineHeight: 16,
  },
  featureDivider: {
    height: 1,
    backgroundColor: COLORS.surfaceBorder,
    marginVertical: SPACING.md,
  },
  permissionBtn: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.surfaceBorder,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.sm,
    marginTop: 8,
  },
  permissionBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.accent,
  },
});
