import React, { useState, useEffect, useCallback } from 'react';
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
  Image,
} from 'react-native';
import { COSMETIC_IMAGES } from '../../constants/Cosmetics';
import {
  X,
  Users,
  UserPlus,
  Search,
  Check,
  Ghost,
  ChevronRight,
  Shield,
  Zap,
} from 'lucide-react-native';
import { RADIUS } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';
import { FriendService, AthleteProfileDetails } from '../../features/social/FriendService';
import { FriendItem, FriendRequest } from '../../types';
import { useAuth } from '../../features/auth/AuthContext';
import { DivisionBadge } from '../common';
import { AthleteProfileModal } from './AthleteProfileModal';

interface FriendsModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectAthlete?: (athlete: AthleteProfileDetails) => void;
}

export function FriendsModal({ visible, onClose, onSelectAthlete }: FriendsModalProps) {
  const { colors, isDark } = useTheme();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<'FRIENDS' | 'SEARCH' | 'REQUESTS'>('FRIENDS');
  const [friends, setFriends] = useState<FriendItem[]>([]);
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<FriendItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Selected athlete for viewing profile
  const [selectedAthlete, setSelectedAthlete] = useState<AthleteProfileDetails | null>(null);

  const loadData = useCallback(async () => {
    const [fList, rList] = await Promise.all([
      FriendService.getInstance().getFriends(),
      FriendService.getInstance().getPendingRequests(),
    ]);
    setFriends(fList);
    setRequests(rList);
  }, []);

  useEffect(() => {
    if (visible) {
      loadData();
    }
  }, [visible, loadData]);

  // Real-time Search
  useEffect(() => {
    if (searchQuery.trim().length === 0) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      const results = await FriendService.getInstance().searchAthletes(searchQuery, user?.id);
      setSearchResults(results);
      setIsSearching(false);
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery, user?.id]);

  const handleSendRequest = async (athleteId: string) => {
    if (!user) return;
    await FriendService.getInstance().sendFriendRequest(athleteId, user);
    Alert.alert('Friend Added', 'Athlete added to your connections!');
    loadData();
    // Update local search results state
    setSearchResults((prev) =>
      prev.map((a) => (a.id === athleteId ? { ...a, isFriend: true } : a))
    );
  };

  const handleAcceptRequest = async (requestId: string) => {
    await FriendService.getInstance().acceptFriendRequest(requestId);
    loadData();
  };

  const handleDeclineRequest = async (requestId: string) => {
    await FriendService.getInstance().declineFriendRequest(requestId);
    loadData();
  };

  const handleOpenProfile = (athleteId: string) => {
    const prof = FriendService.getInstance().getAthleteProfile(athleteId);
    if (prof) {
      if (onSelectAthlete) {
        onSelectAthlete(prof);
      } else {
        setSelectedAthlete(prof);
      }
    }
  };

  return (
    <>
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
            <View style={StyleSheet.absoluteFill}>
              <Image
                source={COSMETIC_IMAGES.backgrounds.cyberLines}
                style={StyleSheet.absoluteFill}
                resizeMode="cover"
              />
              <View
                style={[
                  StyleSheet.absoluteFill,
                  { backgroundColor: isDark ? 'rgba(13, 13, 18, 0.88)' : 'rgba(255, 255, 255, 0.90)' },
                ]}
              />
            </View>

            {/* Header */}
            <View style={styles.header}>
              <View>
                <Text style={[styles.kicker, { color: colors.accent }]}>COMMUNITY & SOCIAL</Text>
                <Text style={[styles.title, { color: colors.textPrimary }]}>Athletic Network</Text>
              </View>
              <TouchableOpacity onPress={onClose} style={[styles.closeBtn, { borderColor: colors.surfaceBorder }]}>
                <X size={16} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Tab Navigation */}
            <View style={[styles.tabBar, { borderBottomColor: colors.divider }]}>
              <TouchableOpacity
                onPress={() => setActiveTab('FRIENDS')}
                style={[
                  styles.tabItem,
                  activeTab === 'FRIENDS' && { borderBottomColor: colors.accent, borderBottomWidth: 2 },
                ]}
              >
                <Text
                  style={[
                    styles.tabLabel,
                    { color: activeTab === 'FRIENDS' ? colors.textPrimary : colors.textMuted },
                  ]}
                >
                  Friends ({friends.length})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setActiveTab('SEARCH')}
                style={[
                  styles.tabItem,
                  activeTab === 'SEARCH' && { borderBottomColor: colors.accent, borderBottomWidth: 2 },
                ]}
              >
                <Text
                  style={[
                    styles.tabLabel,
                    { color: activeTab === 'SEARCH' ? colors.textPrimary : colors.textMuted },
                  ]}
                >
                  Find Athletes
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setActiveTab('REQUESTS')}
                style={[
                  styles.tabItem,
                  activeTab === 'REQUESTS' && { borderBottomColor: colors.accent, borderBottomWidth: 2 },
                ]}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text
                    style={[
                      styles.tabLabel,
                      { color: activeTab === 'REQUESTS' ? colors.textPrimary : colors.textMuted },
                    ]}
                  >
                    Requests
                  </Text>
                  {requests.length > 0 && (
                    <View style={[styles.badgeCount, { backgroundColor: colors.accent }]}>
                      <Text style={styles.badgeCountText}>{requests.length}</Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollBody}
              keyboardShouldPersistTaps="handled"
            >
              {/* TAB 1: MY FRIENDS */}
              {activeTab === 'FRIENDS' && (
                <View>
                  {friends.length === 0 ? (
                    <View style={styles.emptyState}>
                      <Users size={32} color={colors.textMuted} style={{ marginBottom: 8 }} />
                      <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No Friends Yet</Text>
                      <Text style={[styles.emptyDesc, { color: colors.textMuted }]}>
                        Search athletes or share your invite link to build your athletic training squad.
                      </Text>
                    </View>
                  ) : (
                    friends.map((friend) => (
                      <TouchableOpacity
                        key={friend.id}
                        activeOpacity={0.8}
                        onPress={() => handleOpenProfile(friend.id)}
                        style={[
                          styles.friendCard,
                          {
                            backgroundColor: isDark ? '#141418' : '#F8FAFC',
                            borderColor: colors.surfaceBorder,
                          },
                        ]}
                      >
                        <View style={styles.friendCardLeft}>
                          <View style={[styles.avatarBox, { backgroundColor: colors.accent }]}>
                            <Text style={styles.avatarLetter}>
                              {friend.displayName.charAt(0).toUpperCase()}
                            </Text>
                          </View>
                          <View style={{ marginLeft: 12 }}>
                            <Text style={[styles.friendName, { color: colors.textPrimary }]}>
                              {friend.displayName}
                            </Text>
                            <Text style={[styles.friendMeta, { color: colors.textMuted }]}>
                              @{friend.username} • {friend.currentPr} PR • {friend.streakWeeks}w streak
                            </Text>
                          </View>
                        </View>

                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                          <DivisionBadge division={friend.division} tier={1} size="sm" />
                          <ChevronRight size={16} color={colors.textMuted} />
                        </View>
                      </TouchableOpacity>
                    ))
                  )}
                </View>
              )}

              {/* TAB 2: FIND ATHLETES */}
              {activeTab === 'SEARCH' && (
                <View>
                  {/* Search Input */}
                  <View
                    style={[
                      styles.searchBarBox,
                      {
                        backgroundColor: isDark ? '#141418' : '#F8FAFC',
                        borderColor: colors.surfaceBorder,
                      },
                    ]}
                  >
                    <Search size={16} color={colors.textMuted} />
                    <TextInput
                      style={[styles.searchInput, { color: colors.textPrimary }]}
                      placeholder="Search athletes by name or @username..."
                      placeholderTextColor={colors.textMuted}
                      value={searchQuery}
                      onChangeText={setSearchQuery}
                      autoCapitalize="none"
                    />
                    {isSearching && <ActivityIndicator size="small" color={colors.accent} />}
                  </View>

                  {/* Results */}
                  {searchResults.map((athlete) => (
                    <View
                      key={athlete.id}
                      style={[
                        styles.friendCard,
                        {
                          backgroundColor: isDark ? '#141418' : '#F8FAFC',
                          borderColor: colors.surfaceBorder,
                        },
                      ]}
                    >
                      <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() => handleOpenProfile(athlete.id)}
                        style={styles.friendCardLeft}
                      >
                        <View style={[styles.avatarBox, { backgroundColor: colors.accent }]}>
                          <Text style={styles.avatarLetter}>
                            {athlete.displayName.charAt(0).toUpperCase()}
                          </Text>
                        </View>
                        <View style={{ marginLeft: 12 }}>
                          <Text style={[styles.friendName, { color: colors.textPrimary }]}>
                            {athlete.displayName}
                          </Text>
                          <Text style={[styles.friendMeta, { color: colors.textMuted }]}>
                            @{athlete.username} • {athlete.division} • {athlete.currentPr} PR
                          </Text>
                        </View>
                      </TouchableOpacity>

                      {athlete.isFriend ? (
                        <View style={styles.alreadyFriendBadge}>
                          <Check size={12} color={colors.accent} />
                          <Text style={[styles.alreadyFriendText, { color: colors.accent }]}>Added</Text>
                        </View>
                      ) : (
                        <TouchableOpacity
                          activeOpacity={0.8}
                          onPress={() => handleSendRequest(athlete.id)}
                          style={[
                            styles.addFriendBtn,
                            {
                              backgroundColor: colors.accent,
                            },
                          ]}
                        >
                          <UserPlus size={12} color="#000000" />
                          <Text style={styles.addFriendBtnText}>Add</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  ))}

                  {searchQuery.trim().length > 0 && searchResults.length === 0 && !isSearching && (
                    <Text style={[styles.noResultsText, { color: colors.textMuted }]}>
                      No athletes found matching "{searchQuery}".
                    </Text>
                  )}
                </View>
              )}

              {/* TAB 3: FRIEND REQUESTS */}
              {activeTab === 'REQUESTS' && (
                <View>
                  {requests.length === 0 ? (
                    <View style={styles.emptyState}>
                      <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No Pending Requests</Text>
                      <Text style={[styles.emptyDesc, { color: colors.textMuted }]}>
                        You are all caught up! When athletes add you, invitations appear here.
                      </Text>
                    </View>
                  ) : (
                    requests.map((req) => (
                      <View
                        key={req.id}
                        style={[
                          styles.requestCard,
                          {
                            backgroundColor: isDark ? '#141418' : '#F8FAFC',
                            borderColor: colors.surfaceBorder,
                          },
                        ]}
                      >
                        <View style={styles.requestTop}>
                          <View style={[styles.avatarBox, { backgroundColor: colors.accent }]}>
                            <Text style={styles.avatarLetter}>
                              {req.senderName.charAt(0).toUpperCase()}
                            </Text>
                          </View>
                          <View style={{ flex: 1, marginLeft: 12 }}>
                            <Text style={[styles.friendName, { color: colors.textPrimary }]}>
                              {req.senderName}
                            </Text>
                            <Text style={[styles.friendMeta, { color: colors.textMuted }]}>
                              @{req.senderUsername} • {req.senderDivision} Division
                            </Text>
                          </View>
                        </View>

                        <View style={styles.requestActionRow}>
                          <TouchableOpacity
                            onPress={() => handleAcceptRequest(req.id)}
                            style={[styles.acceptBtn, { backgroundColor: colors.accent }]}
                          >
                            <Check size={14} color="#000000" strokeWidth={2.5} />
                            <Text style={styles.acceptBtnText}>Accept</Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            onPress={() => handleDeclineRequest(req.id)}
                            style={[
                              styles.declineBtn,
                              {
                                backgroundColor: isDark ? '#1F1F26' : '#E2E8F0',
                                borderColor: colors.surfaceBorder,
                              },
                            ]}
                          >
                            <X size={14} color={colors.textSecondary} />
                            <Text style={[styles.declineBtnText, { color: colors.textSecondary }]}>
                              Decline
                            </Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    ))
                  )}
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Profile Viewer Modal */}
      <AthleteProfileModal
        visible={!!selectedAthlete}
        onClose={() => setSelectedAthlete(null)}
        athlete={selectedAthlete}
      />
    </>
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
    height: '75%',
    paddingBottom: 24,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 14,
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
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    paddingHorizontal: 20,
  },
  tabItem: {
    paddingVertical: 12,
    marginRight: 20,
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '800',
  },
  badgeCount: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: RADIUS.full,
  },
  badgeCountText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#000000',
  },
  scrollBody: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
  },
  searchBarBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: RADIUS.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 14,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 13,
  },
  friendCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: RADIUS.md,
    padding: 12,
    marginBottom: 8,
  },
  friendCardLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarBox: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: {
    fontSize: 15,
    fontWeight: '900',
    color: '#000000',
  },
  friendName: {
    fontSize: 13,
    fontWeight: '800',
  },
  friendMeta: {
    fontSize: 10,
    marginTop: 2,
  },
  alreadyFriendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  alreadyFriendText: {
    fontSize: 11,
    fontWeight: '800',
  },
  addFriendBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.md,
  },
  addFriendBtnText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#000000',
  },
  requestCard: {
    borderWidth: 1,
    borderRadius: RADIUS.md,
    padding: 14,
    marginBottom: 10,
  },
  requestTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  requestActionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  acceptBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: RADIUS.md,
  },
  acceptBtnText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#000000',
  },
  declineBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: RADIUS.md,
    borderWidth: 1,
  },
  declineBtnText: {
    fontSize: 11,
    fontWeight: '800',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 4,
  },
  emptyDesc: {
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 16,
  },
  noResultsText: {
    textAlign: 'center',
    fontSize: 12,
    marginTop: 20,
  },
});
