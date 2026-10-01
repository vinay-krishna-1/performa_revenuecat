import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Flame, Lock, Mail, User, ArrowLeft, ShieldCheck, CheckCircle2 } from 'lucide-react-native';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS } from '../../src/constants/theme';
import { useAuth } from '../../src/features/auth/AuthContext';
import { PerformaButton, PerformaCard } from '../../src/components/common';

export default function SignUpScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { signUpWithEmail } = useAuth();

  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    const cleanName = displayName.trim();
    const cleanUser = username.trim().toLowerCase();
    const cleanEmail = email.trim();

    if (!cleanName) {
      Alert.alert('Missing Name', 'Please enter your athlete name or display name.');
      return;
    }

    if (!cleanUser || cleanUser.length < 3) {
      Alert.alert('Invalid Username', 'Username must be at least 3 characters long and contain no spaces.');
      return;
    }

    if (/\s/.test(cleanUser)) {
      Alert.alert('Invalid Username', 'Usernames cannot contain spaces.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!cleanEmail || !emailRegex.test(cleanEmail)) {
      Alert.alert('Invalid Email', 'Please provide a valid email address.');
      return;
    }

    if (!password || password.length < 6) {
      Alert.alert('Weak Password', 'Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Password Mismatch', 'The passwords you entered do not match. Please re-enter.');
      return;
    }

    setLoading(true);
    const res = await signUpWithEmail(cleanEmail, password, cleanUser, cleanName);
    setLoading(false);

    if (res.success) {
      router.replace('/(onboarding)');
    } else {
      Alert.alert('Registration Error', res.error || 'Failed to create your account.');
    }
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={20} color={COLORS.textPrimary} />
        </TouchableOpacity>

        <View style={styles.brandHeader}>
          <View style={styles.logoBadge}>
            <Flame size={26} color={COLORS.accent} strokeWidth={2.6} />
          </View>
          <Text style={styles.appName}>CREATE ATHLETE ACCOUNT</Text>
          <Text style={styles.tagline}>Step onto the competitive fitness grid.</Text>
        </View>

        <PerformaCard padding="lg" elevated style={styles.card}>
          <Text style={styles.cardTitle}>Athlete Credentials</Text>

          {/* Display Name */}
          <View style={styles.inputContainer}>
            <User size={18} color={COLORS.textMuted} style={styles.inputIcon} />
            <TextInput
              placeholder="Display Name (e.g. Alex Hunter)"
              placeholderTextColor={COLORS.textMuted}
              value={displayName}
              onChangeText={setDisplayName}
              style={styles.input}
            />
          </View>

          {/* Username */}
          <View style={styles.inputContainer}>
            <Text style={styles.atSymbol}>@</Text>
            <TextInput
              placeholder="username (min 3 chars)"
              placeholderTextColor={COLORS.textMuted}
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              autoCorrect={false}
              style={styles.input}
            />
          </View>

          {/* Email */}
          <View style={styles.inputContainer}>
            <Mail size={18} color={COLORS.textMuted} style={styles.inputIcon} />
            <TextInput
              placeholder="Email address"
              placeholderTextColor={COLORS.textMuted}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              autoCorrect={false}
              style={styles.input}
            />
          </View>

          {/* Password */}
          <View style={styles.inputContainer}>
            <Lock size={18} color={COLORS.textMuted} style={styles.inputIcon} />
            <TextInput
              placeholder="Password (min 6 characters)"
              placeholderTextColor={COLORS.textMuted}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              style={styles.input}
            />
          </View>

          {/* Confirm Password */}
          <View style={styles.inputContainer}>
            <Lock size={18} color={COLORS.textMuted} style={styles.inputIcon} />
            <TextInput
              placeholder="Confirm password"
              placeholderTextColor={COLORS.textMuted}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              style={styles.input}
            />
          </View>

          <PerformaButton
            title="Create Account & Calibrate"
            onPress={handleRegister}
            loading={loading}
            variant="accent"
            size="md"
            style={{ marginTop: SPACING.sm }}
          />
        </PerformaCard>

        <View style={styles.footerRow}>
          <Text style={styles.footerText}>Already registered? </Text>
          <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
            <Text style={styles.signInLink}>Sign In</Text>
          </TouchableOpacity>
        </View>
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
    justifyContent: 'center',
    flexGrow: 1,
    paddingVertical: SPACING.md,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  brandHeader: {
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  logoBadge: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 2,
    borderColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xs,
  },
  appName: {
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 1.5,
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  tagline: {
    ...TYPOGRAPHY.body,
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
  card: {
    marginBottom: SPACING.lg,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.5,
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    paddingHorizontal: SPACING.md,
    height: 48,
    marginBottom: SPACING.sm + 2,
  },
  inputIcon: {
    marginRight: SPACING.sm,
  },
  atSymbol: {
    color: COLORS.textMuted,
    fontSize: 16,
    fontWeight: '700',
    marginRight: SPACING.sm,
  },
  input: {
    flex: 1,
    color: COLORS.textPrimary,
    fontSize: 14,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  signInLink: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primaryBright,
  },
});
