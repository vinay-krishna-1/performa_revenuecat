import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
  TextInput,
} from 'react-native';
import * as Linking from 'expo-linking';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Crown,
  Settings,
  X,
  User,
  Shield,
  Volume2,
  Gauge,
  Sun,
  Moon,
  Cloud,
  CloudCheck,
  RefreshCw,
  LogOut,
  Trash2,
  ChevronRight,
  Sparkles,
  HeartPulse,
  Edit2,
  Check,
  ExternalLink,
  RotateCcw,
} from 'lucide-react-native';
import { RADIUS, SPACING } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../features/auth/AuthContext';
import { SyncService } from '../../services/SyncService';
import { SubscriptionService } from '../../services/revenuecat';
import { PerformaButton } from '../common';
import { useRouter } from 'expo-router';
import { FriendService } from '../../features/social/FriendService';
import { ClanService } from '../../features/clans/ClanService';
import { RoutePrivacyMode } from '../../types';

interface SettingsModalProps {
  visible: boolean;
  onClose: () => void;
}

export function SettingsModal({ visible, onClose }: SettingsModalProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark, toggleTheme } = useTheme();
  const { user, signOut, deleteAccount, updateProfile } = useAuth();

  const [units, setUnits] = useState<'METRIC' | 'IMPERIAL'>(user?.units || 'METRIC');
  const [voiceCues, setVoiceCues] = useState(true);
  const [redlineAlerts, setRedlineAlerts] = useState(true);
  const [routePrivacy, setRoutePrivacy] = useState<RoutePrivacyMode>('FULL');
  const [applyToAllActivities, setApplyToAllActivities] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatusText, setSyncStatusText] = useState('All data synchronized');

  // Athlete Profile Edit State
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [displayNameInput, setDisplayNameInput] = useState(user?.displayName || '');
  const [usernameInput, setUsernameInput] = useState(user?.username || '');
  const [bioInput, setBioInput] = useState(user?.bio || '');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  React.useEffect(() => {
    if (user) {
      setDisplayNameInput(user.displayName || '');
      setUsernameInput(user.username || '');
      setBioInput(user.bio || '');
    }
  }, [user?.displayName, user?.username, user?.bio]);

  const handleSaveProfile = async () => {
    const cleanUsername = usernameInput.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
    const cleanDisplayName = displayNameInput.trim();
    if (!cleanUsername) {
      Alert.alert('Invalid Handle', 'Please enter a valid username (letters, numbers, underscores).');
      return;
    }
    setIsSavingProfile(true);
    try {
      await updateProfile({
        displayName: cleanDisplayName || cleanUsername,
        username: cleanUsername,
        bio: bioInput.trim(),
      });
      if (user?.id) {
        await ClanService.getInstance().updateMemberProfile(user.id, {
          displayName: cleanDisplayName || cleanUsername,
          username: cleanUsername,
        });
      }
      setIsEditingProfile(false);
      Alert.alert('Profile Saved', `Your athlete profile and bio have been updated.`);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Could not update profile.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleResetToFree = async () => {
    try {
      SubscriptionService.getInstance().setMockProStatus(false);
      await updateProfile({ isPro: false });
      Alert.alert('Account Reset to Free Tier', 'Your account has been switched to Free tier. You can now showcase the Pro upgrade flow in your demo video!');
    } catch (e: any) {
      Alert.alert('Notice', 'Account tier updated.');
    }
  };

  const handleManageSubscription = () => {
    Linking.openURL('https://play.google.com/store/account/subscriptions').catch(() => {
      Alert.alert('Google Play Subscriptions', 'Open Google Play Store -> Tap Profile Icon -> Payments & subscriptions to view or cancel active memberships.');
    });
  };

  React.useEffect(() => {
    FriendService.getInstance().getRoutePrivacyMode().then(setRoutePrivacy);
  }, []);

  const handleUpdateRoutePrivacy = async (mode: RoutePrivacyMode, alsoApplyAll?: boolean) => {
    setRoutePrivacy(mode);
    const shouldApplyAll = alsoApplyAll !== undefined ? alsoApplyAll : applyToAllActivities;
    if (shouldApplyAll) {
      const allActs = await SyncService.getInstance().getAllActivities(user?.id);
      await FriendService.getInstance().setGlobalRoutePrivacyMode(mode, true, allActs.map((a) => a.id));
    } else {
      await FriendService.getInstance().setRoutePrivacyMode(mode);
    }
  };

  const handleManualSync = async () => {
    setIsSyncing(true);
    setSyncStatusText('Synchronizing with Supabase...');
    try {
      const res = await SyncService.getInstance().syncPending();
      if (res.errors.length === 0) {
        setSyncStatusText('All sessions synchronized to cloud');
      } else {
        setSyncStatusText(`${res.syncedCount} synced, ${res.errors.length} pending retry`);
      }
    } catch (e) {
      setSyncStatusText('Sync offline (will retry automatically)');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to end your session?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          onClose();
          await signOut();
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This will permanently delete your athlete profile, PR records, and all season telemetry. This action is irreversible.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Permanently',
          style: 'destructive',
          onPress: async () => {
            onClose();
            await deleteAccount();
            router.replace('/(auth)/signup');
          },
        },
      ]
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={[styles.modalOverlay, { paddingTop: insets.top + 10, paddingBottom: insets.bottom + 10 }]}>
        <View
          style={[
            styles.container,
            {
              backgroundColor: isDark ? '#0A0A0D' : '#FFFFFF',
              borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : colors.surfaceBorder,
            },
          ]}
        >
          {/* Header */}
          <View style={[styles.headerRow, { borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.06)' : colors.surfaceBorder }]}>
            <View>
              <Text style={[styles.kicker, { color: colors.textMuted }]}>PREFERENCES</Text>
              <Text style={[styles.title, { color: colors.textPrimary }]}>Settings</Text>
            </View>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={onClose}
              style={[styles.closeBtn, { borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : colors.surfaceBorder }]}
            >
              <X size={16} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollBody}>
            {/* Section 1: Athlete Account & Membership */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>ACCOUNT & MEMBERSHIP</Text>
              <View
                style={[
                  styles.card,
                  {
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.02)' : '#F8FAFC',
                    borderColor: isDark ? 'rgba(255, 255, 255, 0.06)' : colors.surfaceBorder,
                  },
                ]}
              >
                {isEditingProfile ? (
                  <View style={styles.editProfileContainer}>
                    <Text style={[styles.inputLabel, { color: colors.textMuted }]}>ATHLETE DISPLAY NAME</Text>
                    <TextInput
                      style={[
                        styles.inputField,
                        {
                          color: colors.textPrimary,
                          backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#FFFFFF',
                          borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : colors.surfaceBorder,
                        },
                      ]}
                      value={displayNameInput}
                      onChangeText={setDisplayNameInput}
                      placeholder="Display Name"
                      placeholderTextColor={colors.textMuted}
                      autoCapitalize="words"
                    />

                    <Text style={[styles.inputLabel, { color: colors.textMuted, marginTop: 10 }]}>ATHLETE USERNAME / HANDLE</Text>
                    <View
                      style={[
                        styles.usernameInputWrap,
                        {
                          backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#FFFFFF',
                          borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : colors.surfaceBorder,
                        },
                      ]}
                    >
                      <Text style={[styles.atPrefix, { color: colors.accent }]}>@</Text>
                      <TextInput
                        style={[styles.usernameInput, { color: colors.textPrimary }]}
                        value={usernameInput}
                        onChangeText={(txt) => setUsernameInput(txt.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                        placeholder="username"
                        placeholderTextColor={colors.textMuted}
                        autoCapitalize="none"
                        autoCorrect={false}
                      />
                    </View>

                    <Text style={[styles.inputLabel, { color: colors.textMuted, marginTop: 10 }]}>ATHLETE BIO & GOALS</Text>
                    <TextInput
                      style={[
                        styles.inputField,
                        {
                          color: colors.textPrimary,
                          backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#FFFFFF',
                          borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : colors.surfaceBorder,
                          minHeight: 52,
                          textAlignVertical: 'top',
                        },
                      ]}
                      value={bioInput}
                      onChangeText={setBioInput}
                      placeholder="e.g. Marathoner training for Sub-3. Chasing Zenith 100."
                      placeholderTextColor={colors.textMuted}
                      multiline
                      maxLength={120}
                    />

                    <View style={styles.editBtnRow}>
                      <TouchableOpacity
                        activeOpacity={0.7}
                        onPress={() => {
                          setDisplayNameInput(user?.displayName || '');
                          setUsernameInput(user?.username || '');
                          setBioInput(user?.bio || '');
                          setIsEditingProfile(false);
                        }}
                        style={[styles.cancelEditBtn, { borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : colors.surfaceBorder }]}
                      >
                        <Text style={[styles.cancelEditText, { color: colors.textSecondary }]}>Cancel</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={handleSaveProfile}
                        disabled={isSavingProfile}
                        style={[styles.saveEditBtn, { backgroundColor: colors.accent }]}
                      >
                        <Check size={14} color="#000000" />
                        <Text style={styles.saveEditText}>{isSavingProfile ? 'Saving...' : 'Save Changes'}</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <>
                    <View style={styles.accountRow}>
                      <View style={[styles.avatarCircle, { backgroundColor: colors.accent }]}>
                        <Text style={[styles.avatarText, { color: isDark ? '#000000' : '#FFFFFF' }]}>
                          {(user?.displayName || user?.username || 'A')[0].toUpperCase()}
                        </Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.accountName, { color: colors.textPrimary }]}>
                          {user?.displayName || user?.username || 'Athlete'}
                        </Text>
                        <Text style={[styles.accountHandle, { color: colors.textMuted }]}>
                          @{user?.username || 'athlete'}
                        </Text>
                        {user?.bio ? (
                          <Text style={[styles.accountBioText, { color: colors.textSecondary }]} numberOfLines={2}>
                            "{user.bio}"
                          </Text>
                        ) : null}
                      </View>

                      <TouchableOpacity
                        activeOpacity={0.7}
                        onPress={() => setIsEditingProfile(true)}
                        style={[styles.editProfileBtn, { borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : colors.surfaceBorder }]}
                      >
                        <Edit2 size={12} color={colors.textSecondary} />
                        <Text style={[styles.editProfileBtnText, { color: colors.textSecondary }]}>Edit</Text>
                      </TouchableOpacity>
                    </View>

                    {/* Subscription Tier Status & Actions */}
                    <View style={[styles.tierStatusRow, { borderTopColor: isDark ? 'rgba(255, 255, 255, 0.06)' : colors.surfaceBorder }]}>
                      {user?.isPro ? (
                        <View style={{ width: '100%' }}>
                          <View style={styles.proActiveHeader}>
                            <View style={styles.proBadgeMinimal}>
                              <Crown size={12} color={colors.gold} />
                              <Text style={[styles.proBadgeMinimalText, { color: colors.gold }]}>PRO ACTIVE</Text>
                            </View>
                            <Text style={[styles.tierStatusSub, { color: colors.textMuted }]}>
                              Adaptive Pacer Strategy & Real-Time Voice Coach unlocked
                            </Text>
                          </View>

                          <View style={styles.subActionBtnGroup}>
                            <TouchableOpacity
                              activeOpacity={0.8}
                              onPress={handleManageSubscription}
                              style={[
                                styles.subActionBtn,
                                {
                                  borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : colors.surfaceBorder,
                                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : '#FFFFFF',
                                },
                              ]}
                            >
                              <ExternalLink size={13} color={colors.textPrimary} />
                              <Text style={[styles.subActionBtnText, { color: colors.textPrimary }]}>Manage in Google Play</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                              activeOpacity={0.8}
                              onPress={handleResetToFree}
                              style={[
                                styles.subActionBtn,
                                {
                                  borderColor: isDark ? 'rgba(204, 255, 0, 0.3)' : 'rgba(0, 82, 255, 0.3)',
                                  backgroundColor: isDark ? 'rgba(204, 255, 0, 0.06)' : 'rgba(0, 82, 255, 0.06)',
                                },
                              ]}
                            >
                              <RotateCcw size={13} color={colors.accent} />
                              <Text style={[styles.subActionBtnText, { color: colors.accent }]}>Reset to Free (Demo Prep)</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      ) : (
                        <TouchableOpacity
                          activeOpacity={0.8}
                          onPress={() => {
                            onClose();
                            router.push('/pro');
                          }}
                          style={styles.upgradeRowFull}
                        >
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                            <Sparkles size={16} color={colors.accent} />
                            <View style={{ flex: 1 }}>
                              <Text style={[styles.upgradeText, { color: colors.textPrimary, marginLeft: 0 }]}>
                                Upgrade to Performa Pro
                              </Text>
                              <Text style={[styles.upgradeSubText, { color: colors.textMuted }]}>
                                Unlock Adaptive Pacer Strategy & Spoken Voice Coach
                              </Text>
                            </View>
                          </View>
                          <ChevronRight size={16} color={colors.accent} />
                        </TouchableOpacity>
                      )}
                    </View>
                  </>
                )}
              </View>
            </View>

            {/* Section 2: Athletic Units */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>MEASUREMENT UNITS</Text>
              <View
                style={[
                  styles.card,
                  {
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.02)' : '#F8FAFC',
                    borderColor: isDark ? 'rgba(255, 255, 255, 0.06)' : colors.surfaceBorder,
                  },
                ]}
              >
                <View style={styles.settingRow}>
                  <View>
                    <Text style={[styles.settingLabel, { color: colors.textPrimary }]}>Distance & Elevation</Text>
                    <Text style={[styles.settingSub, { color: colors.textMuted }]}>
                      {units === 'METRIC' ? 'Kilometers (km) & Meters (m)' : 'Miles (mi) & Feet (ft)'}
                    </Text>
                  </View>
                  <View style={[styles.unitToggleGroup, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : '#E2E8F0' }]}>
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={() => setUnits('METRIC')}
                      style={[
                        styles.unitBtn,
                        units === 'METRIC' && {
                          backgroundColor: colors.accent,
                          borderColor: colors.accent,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.unitBtnText,
                          {
                            color: units === 'METRIC' ? (isDark ? '#000000' : '#FFFFFF') : colors.textMuted,
                            fontWeight: units === 'METRIC' ? '900' : '600',
                          },
                        ]}
                      >
                        KM
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={() => setUnits('IMPERIAL')}
                      style={[
                        styles.unitBtn,
                        units === 'IMPERIAL' && {
                          backgroundColor: colors.accent,
                          borderColor: colors.accent,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.unitBtnText,
                          {
                            color: units === 'IMPERIAL' ? (isDark ? '#000000' : '#FFFFFF') : colors.textMuted,
                            fontWeight: units === 'IMPERIAL' ? '900' : '600',
                          },
                        ]}
                      >
                        MI
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>

            {/* Section 3: Audio Cues & Cardiac Care */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>COACHING & SAFETY ALERTS</Text>
              <View
                style={[
                  styles.card,
                  {
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.02)' : '#F8FAFC',
                    borderColor: isDark ? 'rgba(255, 255, 255, 0.06)' : colors.surfaceBorder,
                  },
                ]}
              >
                <View style={styles.settingRow}>
                  <View style={{ flex: 1, paddingRight: 10 }}>
                    <Text style={[styles.settingLabel, { color: colors.textPrimary }]}>Voice Coach Splits</Text>
                    <Text style={[styles.settingSub, { color: colors.textMuted }]}>
                      Audible kilometer pace and delta updates
                    </Text>
                  </View>
                  <Switch
                    value={voiceCues}
                    onValueChange={setVoiceCues}
                    thumbColor={voiceCues ? colors.accent : '#94A3B8'}
                    trackColor={{ false: '#334155', true: isDark ? 'rgba(204, 255, 0, 0.4)' : 'rgba(0, 82, 255, 0.4)' }}
                  />
                </View>

                <View style={[styles.rowDivider, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : colors.surfaceBorder }]} />

                <View style={styles.settingRow}>
                  <View style={{ flex: 1, paddingRight: 10 }}>
                    <Text style={[styles.settingLabel, { color: colors.textPrimary }]}>Zone 5 Redline Alert</Text>
                    <Text style={[styles.settingSub, { color: colors.textMuted }]}>
                      Care notification when cardiac rate exceeds peak threshold
                    </Text>
                  </View>
                  <Switch
                    value={redlineAlerts}
                    onValueChange={setRedlineAlerts}
                    thumbColor={redlineAlerts ? '#FF453A' : '#94A3B8'}
                    trackColor={{ false: '#334155', true: 'rgba(255, 69, 58, 0.4)' }}
                  />
                </View>
              </View>
            </View>

            {/* Section 4: Route & Map Privacy */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>ROUTE & MAP PRIVACY</Text>
              <View
                style={[
                  styles.card,
                  {
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.02)' : '#F8FAFC',
                    borderColor: isDark ? 'rgba(255, 255, 255, 0.06)' : colors.surfaceBorder,
                  },
                ]}
              >
                <View style={{ marginBottom: 12 }}>
                  <Text style={[styles.settingLabel, { color: colors.textPrimary }]}>Activity Map Display</Text>
                  <Text style={[styles.settingSub, { color: colors.textMuted }]}>
                    Control whether other athletes can view your exact neighborhood routes on profiles and cards.
                  </Text>
                </View>

                <View style={styles.privacyOptionList}>
                  {[
                    {
                      id: 'FULL' as RoutePrivacyMode,
                      title: 'Full Street Map (Public)',
                      desc: 'Full street map with road names and route markers visible.',
                    },
                    {
                      id: 'SILHOUETTE_ONLY' as RoutePrivacyMode,
                      title: 'Silhouette Trace (Recommended)',
                      desc: 'Abstract vector outline on dark grid; omits street names and start/end addresses.',
                    },
                    {
                      id: 'HIDDEN' as RoutePrivacyMode,
                      title: 'Hidden (Telemetry Only)',
                      desc: 'Map is completely hidden. Only distance, time, and pace metrics are shown.',
                    },
                  ].map((opt) => {
                    const isSelected = routePrivacy === opt.id;
                    return (
                      <TouchableOpacity
                        key={opt.id}
                        activeOpacity={0.8}
                        onPress={() => handleUpdateRoutePrivacy(opt.id)}
                        style={[
                          styles.privacyOptCard,
                          {
                            backgroundColor: isSelected
                              ? isDark
                                ? 'rgba(204, 255, 0, 0.06)'
                                : 'rgba(0, 82, 255, 0.06)'
                              : 'transparent',
                            borderColor: isSelected
                              ? colors.accent
                              : isDark
                              ? 'rgba(255, 255, 255, 0.06)'
                              : colors.surfaceBorder,
                          },
                        ]}
                      >
                        <View
                          style={[
                            styles.privacyRadio,
                            { borderColor: isSelected ? colors.accent : colors.surfaceBorder },
                          ]}
                        >
                          {isSelected && (
                            <View style={[styles.privacyRadioDot, { backgroundColor: colors.accent }]} />
                          )}
                        </View>
                        <View style={{ flex: 1, marginLeft: 10 }}>
                          <Text
                            style={[
                              styles.privacyOptTitle,
                              { color: isSelected ? colors.textPrimary : colors.textSecondary },
                            ]}
                          >
                            {opt.title}
                          </Text>
                          <Text style={[styles.privacyOptDesc, { color: colors.textMuted }]}>
                            {opt.desc}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Apply to all past activities toggle */}
                <View
                  style={[
                    styles.settingRow,
                    {
                      marginTop: 14,
                      paddingTop: 12,
                      borderTopWidth: 1,
                      borderTopColor: isDark ? 'rgba(255, 255, 255, 0.06)' : colors.surfaceBorder,
                    },
                  ]}
                >
                  <View style={{ flex: 1, paddingRight: 10 }}>
                    <Text style={[styles.settingLabel, { color: colors.textPrimary }]}>
                      Apply to all past activities
                    </Text>
                    <Text style={[styles.settingSub, { color: colors.textMuted }]}>
                      Retroactively update the map display setting across your entire history
                    </Text>
                  </View>
                  <Switch
                    value={applyToAllActivities}
                    onValueChange={(val) => {
                      setApplyToAllActivities(val);
                      if (val) {
                        handleUpdateRoutePrivacy(routePrivacy, true);
                      }
                    }}
                    thumbColor={applyToAllActivities ? colors.accent : '#94A3B8'}
                    trackColor={{
                      false: '#334155',
                      true: isDark ? 'rgba(204, 255, 0, 0.4)' : 'rgba(0, 82, 255, 0.4)',
                    }}
                  />
                </View>
              </View>
            </View>

            {/* Section 5: Appearance & Visual Mode */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>THEME & VISUALS</Text>
              <View
                style={[
                  styles.card,
                  {
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.02)' : '#F8FAFC',
                    borderColor: isDark ? 'rgba(255, 255, 255, 0.06)' : colors.surfaceBorder,
                  },
                ]}
              >
                <View style={styles.settingRow}>
                  <View>
                    <Text style={[styles.settingLabel, { color: colors.textPrimary }]}>Display Appearance</Text>
                    <Text style={[styles.settingSub, { color: colors.textMuted }]}>
                      {isDark ? 'Stealth Obsidian (Dark OLED)' : 'Electric Cobalt (Light)'}
                    </Text>
                  </View>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={toggleTheme}
                    style={[
                      styles.themeBtn,
                      {
                        backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#FFFFFF',
                        borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : colors.surfaceBorder,
                      },
                    ]}
                  >
                    {isDark ? <Moon size={16} color={colors.accent} /> : <Sun size={16} color="#F59E0B" />}
                    <Text style={[styles.themeBtnText, { color: colors.textPrimary }]}>
                      {isDark ? 'Dark' : 'Light'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Section 6: Cloud Sync */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>CLOUD SYNCHRONIZATION</Text>
              <View
                style={[
                  styles.card,
                  {
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.02)' : '#F8FAFC',
                    borderColor: isDark ? 'rgba(255, 255, 255, 0.06)' : colors.surfaceBorder,
                  },
                ]}
              >
                <View style={styles.settingRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.settingLabel, { color: colors.textPrimary }]}>Supabase Cloud Sync</Text>
                    <Text style={[styles.settingSub, { color: colors.textMuted }]}>{syncStatusText}</Text>
                  </View>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    disabled={isSyncing}
                    onPress={handleManualSync}
                    style={[
                      styles.syncBtn,
                      {
                        backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#FFFFFF',
                        borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : colors.surfaceBorder,
                      },
                    ]}
                  >
                    <RefreshCw size={14} color={isSyncing ? colors.accent : colors.textPrimary} />
                    <Text style={[styles.syncBtnText, { color: colors.textPrimary }]}>
                      {isSyncing ? 'Syncing' : 'Sync'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Section 7: Danger Zone */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.danger }]}>DANGER ZONE</Text>
              <View
                style={[
                  styles.card,
                  {
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.02)' : '#F8FAFC',
                    borderColor: isDark ? 'rgba(255, 255, 255, 0.06)' : colors.surfaceBorder,
                  },
                ]}
              >
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={handleSignOut}
                  style={styles.actionRow}
                >
                  <LogOut size={16} color={colors.textSecondary} />
                  <Text style={[styles.actionRowText, { color: colors.textPrimary }]}>Sign Out of Session</Text>
                </TouchableOpacity>

                <View style={[styles.rowDivider, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : colors.surfaceBorder }]} />

                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={handleDeleteAccount}
                  style={styles.actionRow}
                >
                  <Trash2 size={16} color={colors.danger} />
                  <Text style={[styles.actionRowText, { color: colors.danger }]}>Delete Athlete Account</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  container: {
    flex: 1,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    overflow: 'hidden',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  kicker: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  title: {
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.4,
    marginTop: 1,
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
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 8,
  },
  card: {
    borderRadius: RADIUS.md,
    borderWidth: 1,
    padding: 14,
  },
  accountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '900',
  },
  accountName: {
    fontSize: 15,
    fontWeight: '800',
  },
  accountHandle: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 1,
  },
  proBadgeMinimal: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: 'rgba(234, 179, 8, 0.4)',
    backgroundColor: 'rgba(234, 179, 8, 0.08)',
  },
  proBadgeMinimalText: {
    fontSize: 9.5,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  upgradeLinkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  upgradeLinkText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  upgradeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    marginTop: 12,
    borderTopWidth: 1,
  },
  upgradeText: {
    fontSize: 12,
    fontWeight: '800',
    flex: 1,
    marginLeft: 8,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  settingLabel: {
    fontSize: 13,
    fontWeight: '700',
  },
  settingSub: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },
  unitToggleGroup: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: RADIUS.sm,
    padding: 3,
    gap: 4,
  },
  unitBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.sm - 2,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  unitBtnText: {
    fontSize: 11,
    letterSpacing: 0.5,
  },
  themeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
  },
  themeBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  syncBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
  },
  syncBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 6,
  },
  actionRowText: {
    fontSize: 13,
    fontWeight: '700',
  },
  rowDivider: {
    height: 1,
    marginVertical: 12,
  },
  privacyOptionList: {
    gap: 8,
    marginTop: 4,
  },
  privacyOptCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: RADIUS.md,
    borderWidth: 1,
  },
  privacyRadio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  privacyRadioDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  privacyOptTitle: {
    fontSize: 12,
    fontWeight: '800',
  },
  privacyOptDesc: {
    fontSize: 10,
    marginTop: 2,
    lineHeight: 14,
  },
  editProfileContainer: {
    paddingVertical: 4,
  },
  inputLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 6,
  },
  inputField: {
    borderWidth: 1,
    borderRadius: RADIUS.sm,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 13,
    fontWeight: '700',
  },
  usernameInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: RADIUS.sm,
    paddingHorizontal: 10,
  },
  atPrefix: {
    fontSize: 14,
    fontWeight: '800',
    marginRight: 4,
  },
  usernameInput: {
    flex: 1,
    borderWidth: 0,
    paddingHorizontal: 0,
    paddingVertical: 9,
    fontSize: 13,
    fontWeight: '700',
  },
  editBtnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 14,
  },
  cancelEditBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
  },
  cancelEditText: {
    fontSize: 12,
    fontWeight: '700',
  },
  saveEditBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: RADIUS.sm,
  },
  saveEditText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#000000',
  },
  editProfileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
  },
  editProfileBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  accountBioText: {
    fontSize: 11,
    fontStyle: 'italic',
    marginTop: 3,
    lineHeight: 15,
  },
  tierStatusRow: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  proActiveHeader: {
    marginBottom: 10,
  },
  tierStatusSub: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
  },
  subActionBtnGroup: {
    gap: 8,
    marginTop: 4,
  },
  subActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
  },
  subActionBtnText: {
    fontSize: 12,
    fontWeight: '800',
  },
  upgradeRowFull: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  upgradeSubText: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },
});
