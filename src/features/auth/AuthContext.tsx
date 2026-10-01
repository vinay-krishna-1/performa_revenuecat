import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import * as Linking from 'expo-linking';
import { UserProfile, Units } from '../../types';
import { ActivityType } from '../../constants/config';
import { supabase, isSupabaseConfigured } from '../../services/supabase';

interface AuthState {
  isAuthenticated: boolean;
  isOnboarded: boolean;
  isLoading: boolean;
  user: UserProfile | null;
  signInWithEmail: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  signUpWithEmail: (email: string, pass: string, username: string, displayName?: string) => Promise<{ success: boolean; error?: string }>;
  signInWithOAuth: (provider: 'google' | 'apple') => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  deleteAccount: () => Promise<void>;
  completeOnboarding: (data: {
    displayName: string;
    username: string;
    preferredActivity: ActivityType;
    units: Units;
  }) => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
}

const STORAGE_KEYS = {
  USER_PROFILE: '@performa_user_profile',
  AUTH_TOKEN: 'performa_auth_token',
  ONBOARDING_DONE: '@performa_onboarded',
};

// Clean zero-state profile for authentic stress testing (Level 1, Bronze V, 0 km, 0 PR)
export const DEFAULT_0_PROFILE: UserProfile = {
  id: '',
  username: '',
  displayName: '',
  avatarUrl: undefined,
  bio: '',
  units: 'METRIC',
  preferredActivity: 'RUN',
  level: 1,
  lifetimeXp: 0,
  currentXp: 0,
  xpForNextLevel: 1000,
  currentSeasonId: '11111111-1111-1111-1111-111111111111',
  currentDivision: 'BRONZE',
  currentTier: 5, // BRONZE V
  currentPr: 0,
  peakPr: 0,
  rank: undefined,
  isZenith100: false,
  zenithBadges: [],
  streakWeeks: 0,
  lastActiveWeek: '',
  qualifyingActivitiesThisWeek: 0,
  lifetimeDistanceMeters: 0,
  lifetimeDurationSeconds: 0,
  lifetimeActivitiesCount: 0,
  personalBests: [],
  isPro: false,
  equippedCosmetics: {
    theme: 'theme_dark_matrix',
  },
};

function mapDbProfileToUserProfile(dbProfile: any, authEmail?: string): UserProfile {
  return {
    id: dbProfile.id,
    username: dbProfile.username || authEmail?.split('@')[0] || 'athlete',
    displayName: dbProfile.display_name || authEmail?.split('@')[0] || 'Athlete',
    avatarUrl: dbProfile.avatar_url || undefined,
    bio: dbProfile.bio || '',
    units: (dbProfile.units as Units) || 'METRIC',
    preferredActivity: (dbProfile.preferred_activity as ActivityType) || 'RUN',
    level: dbProfile.level || 1,
    lifetimeXp: Number(dbProfile.lifetime_xp) || 0,
    currentXp: Number(dbProfile.lifetime_xp) || 0,
    xpForNextLevel: (dbProfile.level || 1) * 1000,
    currentSeasonId: dbProfile.current_season_id || '11111111-1111-1111-1111-111111111111',
    currentDivision: dbProfile.current_division || 'BRONZE',
    currentTier: dbProfile.current_tier || 5,
    currentPr: dbProfile.current_pr || 0,
    peakPr: dbProfile.peak_pr || 0,
    rank: dbProfile.current_rank || undefined,
    isZenith100: !!dbProfile.is_zenith_100,
    zenithBadges: [],
    streakWeeks: dbProfile.streak_weeks || 0,
    lastActiveWeek: dbProfile.last_active_week || '',
    qualifyingActivitiesThisWeek: dbProfile.qualifying_activities_this_week || 0,
    lifetimeDistanceMeters: Number(dbProfile.lifetime_distance_meters) || 0,
    lifetimeDurationSeconds: Number(dbProfile.lifetime_duration_seconds) || 0,
    lifetimeActivitiesCount: dbProfile.lifetime_activities_count || 0,
    personalBests: [],
    isPro: !!dbProfile.is_pro,
    clanId: dbProfile.clan_id || undefined,
    clanName: dbProfile.clan_name || undefined,
    equippedCosmetics: {
      theme: 'theme_dark_matrix',
    },
  };
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isOnboarded, setIsOnboarded] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Restore stored session or Supabase session on startup
  useEffect(() => {
    let isMounted = true;

    const bootstrapAuth = async () => {
      try {
        if (isSupabaseConfigured()) {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user && isMounted) {
            // User has active Supabase session
            const { data: profile } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .single();

            if (profile && isMounted) {
              const mapped = mapDbProfileToUserProfile(profile, session.user.email);
              setUser(mapped);
              setIsAuthenticated(true);
              setIsOnboarded(true);
              await AsyncStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(mapped));
              return;
            }
          }
        }

        // Check local storage fallback
        const storedProfile = await AsyncStorage.getItem(STORAGE_KEYS.USER_PROFILE);
        const storedOnboarded = await AsyncStorage.getItem(STORAGE_KEYS.ONBOARDING_DONE);
        if (storedProfile && isMounted) {
          const parsed = JSON.parse(storedProfile);
          setUser(parsed);
          setIsAuthenticated(true);
          setIsOnboarded(storedOnboarded === 'true');
        } else if (isMounted) {
          setUser(null);
          setIsAuthenticated(false);
          setIsOnboarded(false);
        }
      } catch (e) {
        console.error('Failed to restore auth session:', e);
        if (isMounted) {
          setUser(null);
          setIsAuthenticated(false);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    bootstrapAuth();

    // Supabase auth state change listener
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user && isMounted) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (profile && isMounted) {
          const mapped = mapDbProfileToUserProfile(profile, session.user.email);
          setUser(mapped);
          setIsAuthenticated(true);
          setIsOnboarded(true);
          await AsyncStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(mapped));
        }
      } else if (event === 'SIGNED_OUT' && isMounted) {
        setUser(null);
        setIsAuthenticated(false);
        setIsOnboarded(false);
      }
    });

    // Deep linking handler for OAuth redirects
    const handleUrl = async (url: string) => {
      try {
        const parsed = Linking.parse(url);
        const queryParams = parsed.queryParams || {};
        let accessToken = queryParams.access_token as string;
        let refreshToken = queryParams.refresh_token as string;

        // If returned in hash fragment (#access_token=...&refresh_token=...)
        if (!accessToken && url.includes('#')) {
          const hash = url.split('#')[1];
          const hashParams = new URLSearchParams(hash);
          accessToken = hashParams.get('access_token') || '';
          refreshToken = hashParams.get('refresh_token') || '';
        }

        if (accessToken && refreshToken && isSupabaseConfigured()) {
          await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
        }
      } catch (err) {
        console.error('Failed to parse OAuth redirect URL:', err);
      }
    };

    Linking.getInitialURL().then((url) => {
      if (url) handleUrl(url);
    });

    const linkingSubscription = Linking.addEventListener('url', (event) => {
      handleUrl(event.url);
    });

    return () => {
      isMounted = false;
      authListener?.subscription?.unsubscribe();
      linkingSubscription.remove();
    };
  }, []);

  const signInWithEmail = async (email: string, pass: string) => {
    setIsLoading(true);
    try {
      if (isSupabaseConfigured()) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: pass,
        });

        if (error) {
          return { success: false, error: error.message };
        }

        if (data?.user) {
          // Fetch or create profile
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .single();

          let userProfile: UserProfile;
          if (profile) {
            userProfile = mapDbProfileToUserProfile(profile, data.user.email);
          } else {
            const username = email.split('@')[0];
            const newRow = {
              id: data.user.id,
              username,
              display_name: username,
              level: 1,
              lifetime_xp: 0,
              current_pr: 0,
              peak_pr: 0,
              current_division: 'BRONZE',
              current_tier: 5,
              streak_weeks: 0,
              lifetime_distance_meters: 0,
              lifetime_duration_seconds: 0,
              lifetime_activities_count: 0,
            };
            await supabase.from('profiles').upsert(newRow);
            userProfile = mapDbProfileToUserProfile(newRow, email);
          }

          await AsyncStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(userProfile));
          await AsyncStorage.setItem(STORAGE_KEYS.ONBOARDING_DONE, 'true');
          setUser(userProfile);
          setIsAuthenticated(true);
          setIsOnboarded(true);
          return { success: true };
        }
      }

      // Offline Sandbox fallback if Supabase is unconfigured
      const cleanUser: UserProfile = {
        ...DEFAULT_0_PROFILE,
        id: 'usr_local_' + Date.now(),
        displayName: email.split('@')[0],
        username: email.split('@')[0].toLowerCase(),
      };
      await AsyncStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(cleanUser));
      setUser(cleanUser);
      setIsAuthenticated(true);
      setIsOnboarded(true);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Login failed' };
    } finally {
      setIsLoading(false);
    }
  };

  const signUpWithEmail = async (email: string, pass: string, username: string, displayName?: string) => {
    setIsLoading(true);
    try {
      const cleanUsername = username.trim().toLowerCase();
      const resolvedName = displayName?.trim() || username.trim();

      if (isSupabaseConfigured()) {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password: pass,
          options: {
            data: {
              username: cleanUsername,
              display_name: resolvedName,
            },
          },
        });

        if (error) {
          return { success: false, error: error.message };
        }

        if (data?.user) {
          // Insert initial 0-state profile into public.profiles
          const initialProfile = {
            id: data.user.id,
            username: cleanUsername,
            display_name: resolvedName,
            level: 1,
            lifetime_xp: 0,
            current_pr: 0,
            peak_pr: 0,
            current_division: 'BRONZE',
            current_tier: 5,
            streak_weeks: 0,
            lifetime_distance_meters: 0,
            lifetime_duration_seconds: 0,
            lifetime_activities_count: 0,
          };

          await supabase.from('profiles').upsert(initialProfile);

          const userProfile = mapDbProfileToUserProfile(initialProfile, email);
          await AsyncStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(userProfile));
          setUser(userProfile);
          setIsAuthenticated(true);
          setIsOnboarded(false);
          return { success: true };
        }
      }

      // Offline Sandbox fallback
      const newUser: UserProfile = {
        ...DEFAULT_0_PROFILE,
        id: 'usr_local_' + Date.now(),
        username: cleanUsername,
        displayName: resolvedName,
      };
      await AsyncStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(newUser));
      setUser(newUser);
      setIsAuthenticated(true);
      setIsOnboarded(false);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Registration failed' };
    } finally {
      setIsLoading(false);
    }
  };

  const signInWithOAuth = async (provider: 'google' | 'apple') => {
    setIsLoading(true);
    try {
      if (isSupabaseConfigured()) {
        const redirectUrl = Linking.createURL('auth/callback');
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider,
          options: {
            redirectTo: redirectUrl,
            skipBrowserRedirect: false,
          },
        });

        if (error) {
          return { success: false, error: error.message };
        }

        if (data?.url) {
          const supported = await Linking.canOpenURL(data.url);
          if (supported) {
            await Linking.openURL(data.url);
            return { success: true };
          }
        }
      }

      // Offline sandbox fallback
      const oAuthUser: UserProfile = {
        ...DEFAULT_0_PROFILE,
        id: 'usr_' + provider + '_' + Date.now(),
        displayName: provider === 'google' ? 'Google Athlete' : 'Apple Athlete',
        username: provider + '_athlete',
      };
      await AsyncStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(oAuthUser));
      setUser(oAuthUser);
      setIsAuthenticated(true);
      setIsOnboarded(true);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || `${provider} OAuth failed` };
    } finally {
      setIsLoading(false);
    }
  };

  const completeOnboarding = async (data: {
    displayName: string;
    username: string;
    preferredActivity: ActivityType;
    units: Units;
  }) => {
    if (!user) return;
    const updated: UserProfile = {
      ...user,
      displayName: data.displayName,
      username: data.username,
      preferredActivity: data.preferredActivity,
      units: data.units,
    };
    setUser(updated);
    setIsOnboarded(true);
    await AsyncStorage.setItem(STORAGE_KEYS.ONBOARDING_DONE, 'true');
    await AsyncStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(updated));

    // Sync to Supabase if configured
    if (isSupabaseConfigured() && user.id) {
      supabase.from('profiles').update({
        display_name: data.displayName,
        username: data.username,
        preferred_activity: data.preferredActivity,
        units: data.units,
        updated_at: new Date().toISOString(),
      }).eq('id', user.id).then();
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) return;
    const updated: UserProfile = { ...user, ...updates };
    setUser(updated);
    await AsyncStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(updated));

    if (isSupabaseConfigured() && user.id) {
      const dbUpdates: any = { updated_at: new Date().toISOString() };
      if (updates.displayName) dbUpdates.display_name = updates.displayName;
      if (updates.username) dbUpdates.username = updates.username;
      if (updates.bio !== undefined) dbUpdates.bio = updates.bio;
      if (updates.units) dbUpdates.units = updates.units;
      if (updates.preferredActivity) dbUpdates.preferred_activity = updates.preferredActivity;
      supabase.from('profiles').update(dbUpdates).eq('id', user.id).then();
    }
  };

  const signOut = async () => {
    setIsLoading(true);
    try {
      if (isSupabaseConfigured()) {
        await supabase.auth.signOut().catch(() => {});
      }
      await AsyncStorage.removeItem(STORAGE_KEYS.USER_PROFILE);
      await AsyncStorage.removeItem(STORAGE_KEYS.ONBOARDING_DONE);
      await SecureStore.deleteItemAsync(STORAGE_KEYS.AUTH_TOKEN).catch(() => {});
      setUser(null);
      setIsAuthenticated(false);
      setIsOnboarded(false);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteAccount = async () => {
    setIsLoading(true);
    try {
      if (isSupabaseConfigured() && user?.id) {
        await supabase.from('profiles').delete().eq('id', user.id);
        await supabase.auth.signOut();
      }
      await AsyncStorage.clear();
      await SecureStore.deleteItemAsync(STORAGE_KEYS.AUTH_TOKEN).catch(() => {});
      setUser(null);
      setIsAuthenticated(false);
      setIsOnboarded(false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isOnboarded,
        isLoading,
        user,
        signInWithEmail,
        signUpWithEmail,
        signInWithOAuth,
        signOut,
        deleteAccount,
        completeOnboarding,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
