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
import { X, Shield, Flame, Crown, Zap, Check, Users, ArrowRight } from 'lucide-react-native';
import { RADIUS } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';
import { ClanService, DEFAULT_COMMUNITY_CLANS } from '../../features/clans/ClanService';
import { useAuth } from '../../features/auth/AuthContext';
import { PerformaButton } from '../common';
import { ClanItem } from '../../types';

interface JoinClanModalProps {
  visible: boolean;
  onClose: () => void;
  onClanJoined: (clan: ClanItem) => void;
}

export function JoinClanModal({ visible, onClose, onClanJoined }: JoinClanModalProps) {
  const { colors, isDark } = useTheme();
  const { user } = useAuth();

  const [inviteInput, setInviteInput] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [joiningClanId, setJoiningClanId] = useState<string | null>(null);

  const handleJoinWithCode = async () => {
    if (!inviteInput.trim()) {
      Alert.alert('Missing Code', 'Please enter a clan invite code or tag.');
      return;
    }
    if (!user) {
      Alert.alert('Sign In Required', 'Please sign in to join a clan.');
      return;
    }

    setIsJoining(true);
    try {
      const result = await ClanService.getInstance().joinClan(inviteInput.trim(), user);
      setIsJoining(false);

      if (result.success && result.clan) {
        onClanJoined(result.clan);
        onClose();
        Alert.alert('Welcome to the Clan!', `You joined [${result.clan.tag}] ${result.clan.name}!`);
      } else {
        Alert.alert('Join Failed', result.message || 'Could not find clan with that code or tag.');
      }
    } catch (err) {
      console.warn('[JoinClanModal] Error joining clan:', err);
      setIsJoining(false);
      Alert.alert('Join Error', 'Failed to join clan at this time.');
    }
  };

  const handleQuickJoin = async (clan: ClanItem) => {
    if (!user) {
      Alert.alert('Sign In Required', 'Please sign in to join a clan.');
      return;
    }

    setJoiningClanId(clan.id);
    try {
      const result = await ClanService.getInstance().joinClan(clan.inviteCode, user);
      setJoiningClanId(null);

      if (result.success && result.clan) {
        onClanJoined(result.clan);
        onClose();
        Alert.alert('Welcome to the Clan!', `You joined [${result.clan.tag}] ${result.clan.name}!`);
      } else {
        Alert.alert('Join Failed', result.message || 'Could not join clan.');
      }
    } catch (err) {
      console.warn('[JoinClanModal] Quick join error:', err);
      setJoiningClanId(null);
      Alert.alert('Join Error', 'Failed to join clan.');
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
              <Text style={[styles.kicker, { color: colors.accent }]}>ATHLETIC COLLECTIVES</Text>
              <Text style={[styles.title, { color: colors.textPrimary }]}>Join a Clan</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={[styles.closeBtn, { borderColor: colors.surfaceBorder }]}>
              <X size={16} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollBody}>
            {/* Input with Code / Tag */}
            <Text style={[styles.label, { color: colors.textMuted }]}>ENTER INVITE CODE OR TAG</Text>
            <View style={styles.inputRow}>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: isDark ? '#141418' : '#F8FAFC',
                    borderColor: colors.surfaceBorder,
                    color: colors.textPrimary,
                    textTransform: 'uppercase',
                    fontWeight: '800',
                    letterSpacing: 1.5,
                  },
                ]}
                placeholder="e.g. APEX-5520 or STRD"
                placeholderTextColor={colors.textMuted}
                value={inviteInput}
                onChangeText={(val) => setInviteInput(val.toUpperCase())}
                maxLength={12}
              />
              <TouchableOpacity
                onPress={handleJoinWithCode}
                disabled={isJoining}
                style={[
                  styles.joinBtn,
                  {
                    backgroundColor: colors.accent,
                  },
                ]}
              >
                {isJoining ? (
                  <ActivityIndicator size="small" color="#000000" />
                ) : (
                  <Text style={styles.joinBtnText}>JOIN</Text>
                )}
              </TouchableOpacity>
            </View>

            {/* Featured Community Clans */}
            <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>
              FEATURED ATHLETIC CLANS
            </Text>

            {DEFAULT_COMMUNITY_CLANS.map((clan) => {
              const isTargetJoining = joiningClanId === clan.id;
              return (
                <View
                  key={clan.id}
                  style={[
                    styles.clanCard,
                    {
                      backgroundColor: isDark ? '#141418' : '#F8FAFC',
                      borderColor: colors.surfaceBorder,
                    },
                  ]}
                >
                  <View style={styles.clanCardTop}>
                    <View
                      style={[
                        styles.badgeIconBox,
                        {
                          backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#E2E8F0',
                          borderColor: clan.accentColor || colors.accent,
                        },
                      ]}
                    >
                      <Shield size={16} color={clan.accentColor || colors.accent} />
                    </View>
                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={[styles.clanCardName, { color: colors.textPrimary }]}>
                          {clan.name}
                        </Text>
                        <Text style={[styles.clanCardTag, { color: clan.accentColor || colors.accent }]}>
                          [{clan.tag}]
                        </Text>
                      </View>
                      <Text style={[styles.clanCardDesc, { color: colors.textMuted }]} numberOfLines={1}>
                        {clan.description}
                      </Text>
                    </View>
                  </View>

                  <View style={[styles.clanCardBottom, { borderTopColor: colors.divider }]}>
                    <View style={styles.metaRow}>
                      <Users size={12} color={colors.textMuted} />
                      <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                        {clan.memberCount} Athletes
                      </Text>
                      <Text style={[styles.metaDot, { color: colors.textMuted }]}>•</Text>
                      <Text style={[styles.metaPrText, { color: colors.accent }]}>
                        {clan.seasonPr.toLocaleString()} PR
                      </Text>
                    </View>

                    <TouchableOpacity
                      activeOpacity={0.8}
                      disabled={isTargetJoining}
                      onPress={() => handleQuickJoin(clan)}
                      style={[
                        styles.quickJoinBtn,
                        {
                          backgroundColor: isDark ? '#1C1C24' : '#F1F5F9',
                          borderColor: colors.surfaceBorder,
                        },
                      ]}
                    >
                      {isTargetJoining ? (
                        <ActivityIndicator size="small" color={colors.accent} />
                      ) : (
                        <>
                          <Text style={[styles.quickJoinText, { color: colors.textPrimary }]}>
                            Join Clan
                          </Text>
                          <ArrowRight size={13} color={colors.accent} />
                        </>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
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
    maxHeight: '88%',
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
    marginBottom: 8,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderRadius: RADIUS.md,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 13,
  },
  joinBtn: {
    paddingHorizontal: 20,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  joinBtnText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#000000',
    letterSpacing: 0.5,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 12,
  },
  clanCard: {
    borderWidth: 1,
    borderRadius: RADIUS.lg,
    padding: 14,
    marginBottom: 10,
  },
  clanCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  badgeIconBox: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clanCardName: {
    fontSize: 13,
    fontWeight: '800',
  },
  clanCardTag: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  clanCardDesc: {
    fontSize: 11,
    marginTop: 2,
  },
  clanCardBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    marginTop: 10,
    paddingTop: 10,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 11,
    fontWeight: '600',
  },
  metaDot: {
    fontSize: 10,
  },
  metaPrText: {
    fontSize: 11,
    fontWeight: '800',
  },
  quickJoinBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.md,
    borderWidth: 1,
  },
  quickJoinText: {
    fontSize: 11,
    fontWeight: '700',
  },
});
