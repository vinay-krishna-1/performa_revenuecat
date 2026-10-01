import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Flame, Lock, Mail, ArrowRight, ShieldCheck } from 'lucide-react-native';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS } from '../../src/constants/theme';
import { useAuth } from '../../src/features/auth/AuthContext';
import { PerformaButton, PerformaCard } from '../../src/components/common';

export default function LoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { signInWithEmail, signInWithOAuth } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Missing Fields', 'Please enter your email and password.');
      return;
    }
    setLoading(true);
    const res = await signInWithEmail(email, password);
    setLoading(false);
    if (res.success) {
      router.replace('/(tabs)/home');
    } else {
      Alert.alert('Login Error', res.error || 'Failed to sign in.');
    }
  };

  const handleOAuth = async (provider: 'google') => {
    setLoading(true);
    const res = await signInWithOAuth(provider);
    setLoading(false);
    if (res.success) {
      router.replace('/(tabs)/home');
    } else {
      Alert.alert(
        'Google Sign-In Notice',
        res.error?.includes('not enabled') || res.error?.includes('validation_failed')
          ? 'Google OAuth provider is not yet enabled in your Supabase project. To use Google Sign-In, enable Google in your Supabase Dashboard under Authentication -> Providers -> Google.\n\nIn the meantime, you can create an account and sign in instantly using email & password!'
          : (res.error || 'Failed to authenticate with Google. Use email & password or check connection.')
      );
    }
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Brand Header */}
        <View style={styles.brandHeader}>
          <View style={styles.logoBadge}>
            <Flame size={32} color={COLORS.accent} strokeWidth={2.6} />
          </View>
          <Text style={styles.appName}>PERFORMA</Text>
          <Text style={styles.tagline}>Physical activity is the gameplay.</Text>
        </View>

        {/* Input Card */}
        <PerformaCard padding="lg" elevated style={styles.card}>
          <Text style={styles.cardTitle}>Sign In</Text>

          <View style={styles.inputContainer}>
            <Mail size={18} color={COLORS.textMuted} style={styles.inputIcon} />
            <TextInput
              placeholder="Email address"
              placeholderTextColor={COLORS.textMuted}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              style={styles.input}
            />
          </View>

          <View style={styles.inputContainer}>
            <Lock size={18} color={COLORS.textMuted} style={styles.inputIcon} />
            <TextInput
              placeholder="Password"
              placeholderTextColor={COLORS.textMuted}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              style={styles.input}
            />
          </View>

          <PerformaButton
            title="Sign In with Email"
            onPress={handleLogin}
            loading={loading}
            variant="primary"
            size="md"
            style={{ marginTop: SPACING.sm }}
          />

          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Google OAuth Button */}
          <PerformaButton
            title="Continue with Google"
            onPress={() => handleOAuth('google')}
            variant="secondary"
            size="md"
          />
        </PerformaCard>

        {/* Registration Link */}
        <View style={styles.footerRow}>
          <Text style={styles.footerText}>New athlete? </Text>
          <TouchableOpacity onPress={() => router.push('/(auth)/signup')}>
            <Text style={styles.signUpLink}>Create Account</Text>
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
  },
  brandHeader: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  logoBadge: {
    width: 64,
    height: 64,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 2,
    borderColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  appName: {
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 2,
    color: COLORS.textPrimary,
  },
  tagline: {
    ...TYPOGRAPHY.body,
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  card: {
    marginBottom: SPACING.lg,
  },
  cardTitle: {
    ...TYPOGRAPHY.h2,
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
    marginBottom: SPACING.md,
  },
  inputIcon: {
    marginRight: SPACING.sm,
  },
  input: {
    flex: 1,
    color: COLORS.textPrimary,
    fontSize: 15,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: SPACING.md,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.surfaceBorder,
  },
  dividerText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textMuted,
    marginHorizontal: SPACING.md,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: SPACING.sm,
  },
  footerText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  signUpLink: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.accent,
  },
});
