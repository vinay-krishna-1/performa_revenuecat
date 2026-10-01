import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ActivitySummary, UserProfile, RouteItem, LeaderboardEntry, ClanItem } from '../types';

const RAW_URL = (process.env.EXPO_PUBLIC_SUPABASE_URL || '').trim();
export const SUPABASE_URL = RAW_URL.replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');
export const SUPABASE_ANON_KEY = (process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '').trim();

export const isSupabaseConfigured = (): boolean => {
  return (
    !!SUPABASE_URL &&
    !!SUPABASE_ANON_KEY &&
    !SUPABASE_URL.includes('your-project') &&
    !SUPABASE_URL.includes('mock')
  );
};

export const supabase = createClient(
  SUPABASE_URL || 'https://performa-sandbox.supabase.co',
  SUPABASE_ANON_KEY || 'mock-anon-key',
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
);

export class SupabaseService {
  private static instance: SupabaseService;

  public static getInstance(): SupabaseService {
    if (!SupabaseService.instance) {
      SupabaseService.instance = new SupabaseService();
    }
    return SupabaseService.instance;
  }

  /**
   * Uploads and syncs a completed activity session and its GPS points to Supabase.
   */
  public async syncActivity(activity: ActivitySummary, userId: string): Promise<{ success: boolean; error?: string }> {
    if (!isSupabaseConfigured()) {
      return { success: true }; // Local sandbox mode succeeds without error
    }

    try {
      // Resolve valid Supabase UUID from authenticated user only
      const { data: authData } = await supabase.auth.getUser();
      const resolvedUserId = authData?.user?.id;

      if (!resolvedUserId) {
        // User is in offline/guest mode, keep in local SQLite/AsyncStorage sync queue
        return { success: false, error: 'No active Supabase user session' };
      }

      // Ensure profile exists in profiles table to satisfy foreign key constraint
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', resolvedUserId)
        .maybeSingle();

      if (!existingProfile) {
        await supabase.from('profiles').upsert({
          id: resolvedUserId,
          username: authData?.user?.email?.split('@')[0] || 'athlete',
          display_name: authData?.user?.user_metadata?.full_name || 'Athlete',
          current_division: 'BRONZE',
          current_tier: 5,
          current_pr: 0,
          lifetime_xp: 0,
          updated_at: new Date().toISOString(),
        });
      }

      // 1. Insert activity row with rounded integer fields matching Postgres schema
      const { data: actData, error: actError } = await supabase
        .from('activities')
        .insert({
          user_id: resolvedUserId,
          activity_type: activity.type,
          start_time: new Date(activity.startTime).toISOString(),
          end_time: new Date(activity.endTime).toISOString(),
          elapsed_seconds: Math.round(activity.elapsedSeconds || 1),
          moving_seconds: Math.round(activity.movingSeconds || 1),
          distance_meters: Math.round(activity.distanceMeters || 0),
          avg_pace_seconds_per_km: Math.round(activity.avgPaceSecondsPerKm || 0),
          best_pace_seconds_per_km: Math.round(activity.bestPaceSecondsPerKm || 0),
          avg_speed_mps: Number(activity.avgSpeedMps || 0),
          max_speed_mps: Number(activity.maxSpeedMps || 0),
          elevation_gain_meters: Math.round(activity.elevationGainMeters || 0),
          elevation_loss_meters: Math.round(activity.elevationLossMeters || 0),
          xp_earned: Math.round(activity.xpEarned || 0),
          pr_earned: Math.round(activity.prEarned || 0),
          verification_status: activity.verificationStatus,
          quality_score: Math.round(activity.qualityScore || 100),
          polyline_summary: JSON.stringify(activity.routeCoordinates.slice(0, 100)),
          ghost_id: (activity.ghostId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(activity.ghostId)) ? activity.ghostId : null,
        })
        .select()
        .single();

      if (actError) throw actError;

      const activityId = actData?.id;

      // 2. Batch insert GPS coordinates if points exist
      if (activityId && activity.routeCoordinates.length > 0) {
        const points = activity.routeCoordinates.map((coord, idx) => ({
          activity_id: activityId,
          sequence_idx: idx,
          latitude: coord.latitude,
          longitude: coord.longitude,
        }));

        // Batch in chunks of 200 points
        const chunkSize = 200;
        for (let i = 0; i < points.length; i += chunkSize) {
          const chunk = points.slice(i, i + chunkSize);
          await supabase.from('activity_points').insert(chunk);
        }
      }

      // 3. Update user profile lifetime stats and PR
      await this.incrementUserStats(resolvedUserId, activity);

      return { success: true };
    } catch (e: any) {
      console.warn('[SupabaseService] syncActivity error:', e.message || e);
      return { success: false, error: e.message || 'Sync failed' };
    }
  }

  /**
   * Updates user lifetime and seasonal telemetry after an activity.
   */
  private async incrementUserStats(userId: string, activity: ActivitySummary) {
    if (!isSupabaseConfigured()) return;

    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('lifetime_xp, current_pr, peak_pr, lifetime_distance_meters, lifetime_duration_seconds, lifetime_activities_count')
        .eq('id', userId)
        .single();

      if (profile) {
        const newXp = (profile.lifetime_xp || 0) + activity.xpEarned;
        const newPr = (profile.current_pr || 0) + activity.prEarned;
        const newPeakPr = Math.max(profile.peak_pr || 0, newPr);
        const newDist = (profile.lifetime_distance_meters || 0) + activity.distanceMeters;
        const newDur = (profile.lifetime_duration_seconds || 0) + activity.movingSeconds;
        const newCount = (profile.lifetime_activities_count || 0) + 1;

        await supabase
          .from('profiles')
          .update({
            lifetime_xp: newXp,
            current_pr: newPr,
            peak_pr: newPeakPr,
            lifetime_distance_meters: newDist,
            lifetime_duration_seconds: newDur,
            lifetime_activities_count: newCount,
            updated_at: new Date().toISOString(),
          })
          .eq('id', userId);
      }
    } catch (e) {
      console.warn('[SupabaseService] incrementUserStats error:', e);
    }
  }

  /**
   * Fetches real cloud leaderboard rankings from Supabase.
   */
  public async fetchLeaderboard(sport: string = 'RUN', limit: number = 50): Promise<LeaderboardEntry[]> {
    if (!isSupabaseConfigured()) {
      return [];
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url, current_division, current_tier, current_pr')
        .order('current_pr', { ascending: false })
        .limit(limit);

      if (error) throw error;

      if (!data) return [];

      return data.map((p, idx) => ({
        rank: idx + 1,
        userId: p.id,
        athleteName: p.display_name || p.username || 'Athlete',
        avatarUrl: p.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200',
        pr: p.current_pr || 0,
        division: p.current_division || 'BRONZE',
        tier: p.current_tier || 5,
        streakWeeks: 4,
        isUser: false,
      }));
    } catch (e) {
      console.warn('[SupabaseService] fetchLeaderboard error:', e);
      return [];
    }
  }

  /**
   * Ensures all seeded athlete profiles exist in Supabase profiles table.
   */
  public async ensureProfilesSeeded(): Promise<void> {
    if (!isSupabaseConfigured()) return;
    try {
      const seedProfiles = [
        {
          id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
          username: 'kipchoge_fan',
          display_name: 'Eliud Kipchoge Fan',
          avatar_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200',
          bio: 'Chasing the Zenith 100 podium. Sub-2 hour mindset.',
          current_division: 'ZENITH',
          current_tier: 1,
          current_pr: 4820,
          peak_pr: 4950,
          streak_weeks: 16,
          lifetime_xp: 48500,
          lifetime_distance_meters: 1420000,
          lifetime_duration_seconds: 420000,
          lifetime_activities_count: 140,
        },
        {
          id: 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
          username: 'elena_rostova',
          display_name: 'Elena Rostova',
          avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200',
          bio: 'Consistency over intensity. Ultra runner & Zenith challenger.',
          current_division: 'ZENITH',
          current_tier: 1,
          current_pr: 4450,
          peak_pr: 4600,
          streak_weeks: 12,
          lifetime_xp: 41200,
          lifetime_distance_meters: 1180000,
          lifetime_duration_seconds: 360000,
          lifetime_activities_count: 115,
        },
        {
          id: 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33',
          username: 'mvance',
          display_name: 'Marcus Vance',
          avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200',
          bio: 'Marathoner in training. Building steady consistency on morning loops.',
          current_division: 'DIAMOND',
          current_tier: 1,
          current_pr: 3980,
          peak_pr: 4100,
          streak_weeks: 9,
          lifetime_xp: 36200,
          lifetime_distance_meters: 980000,
          lifetime_duration_seconds: 290000,
          lifetime_activities_count: 95,
        },
        {
          id: 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a44',
          username: 'david_kim',
          display_name: 'David Kim',
          avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200',
          bio: 'Tempo running & evening 5Ks.',
          current_division: 'DIAMOND',
          current_tier: 3,
          current_pr: 3420,
          peak_pr: 3500,
          streak_weeks: 8,
          lifetime_xp: 29000,
          lifetime_distance_meters: 750000,
          lifetime_duration_seconds: 220000,
          lifetime_activities_count: 70,
        },
        {
          id: 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a55',
          username: 'sarah_j',
          display_name: 'Sarah Jenkins',
          avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200',
          bio: 'Negative splits and progression runs.',
          current_division: 'PLATINUM',
          current_tier: 2,
          current_pr: 2850,
          peak_pr: 2900,
          streak_weeks: 6,
          lifetime_xp: 22000,
          lifetime_distance_meters: 520000,
          lifetime_duration_seconds: 155000,
          lifetime_activities_count: 50,
        },
        {
          id: 'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a66',
          username: 'lucas_m',
          display_name: 'Lucas Mayer',
          avatar_url: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=200',
          bio: 'Chasing personal records on asphalt.',
          current_division: 'GOLD',
          current_tier: 1,
          current_pr: 2210,
          peak_pr: 2300,
          streak_weeks: 5,
          lifetime_xp: 18000,
          lifetime_distance_meters: 410000,
          lifetime_duration_seconds: 125000,
          lifetime_activities_count: 42,
        },
        {
          id: '10eebc99-9c0b-4ef8-bb6d-6bb9bd380a77',
          username: 'chloe_zhao',
          display_name: 'Chloe Zhao',
          avatar_url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200',
          bio: 'Casual runner under streetlights. Slow and steady.',
          current_division: 'SILVER',
          current_tier: 2,
          current_pr: 1420,
          peak_pr: 1500,
          streak_weeks: 4,
          lifetime_xp: 12000,
          lifetime_distance_meters: 280000,
          lifetime_duration_seconds: 85000,
          lifetime_activities_count: 28,
        },
        {
          id: '20eebc99-9c0b-4ef8-bb6d-6bb9bd380a88',
          username: 'samir_p',
          display_name: 'Samir Patel',
          avatar_url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200',
          bio: 'Building base mileage. First season on Performa.',
          current_division: 'BRONZE',
          current_tier: 1,
          current_pr: 650,
          peak_pr: 700,
          streak_weeks: 2,
          lifetime_xp: 5000,
          lifetime_distance_meters: 120000,
          lifetime_duration_seconds: 38000,
          lifetime_activities_count: 14,
        },
      ];

      for (const p of seedProfiles) {
        await supabase.from('profiles').upsert(p, { onConflict: 'id' });
      }
    } catch (err) {
      console.warn('[SupabaseService] ensureProfilesSeeded note:', err);
    }
  }

  /**
   * Fetches a specific athlete profile by ID from Supabase.
   */
  public async fetchProfileById(userId: string): Promise<any | null> {
    if (!isSupabaseConfigured()) return null;
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
      if (error || !data) return null;
      return data;
    } catch {
      return null;
    }
  }

  /**
   * Fetches clan standings from Supabase.
   */
  public async fetchClanLeaderboard(limit: number = 20): Promise<ClanItem[]> {
    if (!isSupabaseConfigured()) {
      return [];
    }

    try {
      const { data, error } = await supabase
        .from('clans')
        .select('*')
        .order('season_pr', { ascending: false })
        .limit(limit);

      if (error) throw error;
      if (!data) return [];

      return data.map((c, idx) => ({
        id: c.id,
        name: c.name,
        tag: c.tag,
        description: c.description || '',
        badgeIcon: c.badge_icon || 'shield',
        inviteCode: c.invite_code || `${c.tag || 'CLAN'}-1001`,
        leaderId: c.leader_id || '',
        memberCount: c.member_count || 1,
        seasonPr: Number(c.season_pr) || 0,
        globalRank: idx + 1,
        topContributors: [],
      }));
    } catch (e) {
      console.warn('[SupabaseService] fetchClanLeaderboard error:', e);
      return [];
    }
  }

  /**
   * Fetches user recorded activities from Supabase cloud database.
   */
  public async fetchUserActivities(userId?: string): Promise<ActivitySummary[]> {
    if (!isSupabaseConfigured()) {
      return [];
    }

    try {
      let targetId = userId;
      if (!targetId) {
        const { data: authData } = await supabase.auth.getUser();
        targetId = authData?.user?.id;
      }

      if (!targetId) {
        return [];
      }

      const { data, error } = await supabase
        .from('activities')
        .select('*')
        .eq('user_id', targetId)
        .order('start_time', { ascending: false });

      if (error) throw error;
      if (!data) return [];

      return data.map((row) => ({
        id: row.id,
        userId: row.user_id,
        type: row.activity_type,
        startTime: new Date(row.start_time).getTime(),
        endTime: new Date(row.end_time).getTime(),
        elapsedSeconds: row.elapsed_seconds,
        movingSeconds: row.moving_seconds,
        distanceMeters: row.distance_meters,
        avgPaceSecondsPerKm: row.avg_pace_seconds_per_km,
        bestPaceSecondsPerKm: row.best_pace_seconds_per_km || 0,
        avgSpeedMps: Number(row.avg_speed_mps) || 0,
        maxSpeedMps: Number(row.max_speed_mps) || 0,
        elevationGainMeters: row.elevation_gain_meters || 0,
        elevationLossMeters: row.elevation_loss_meters || 0,
        xpEarned: row.xp_earned || 0,
        prEarned: row.pr_earned || 0,
        verificationStatus: row.verification_status,
        qualityScore: row.quality_score || 100,
        routeCoordinates: row.polyline_summary ? JSON.parse(row.polyline_summary) : [],
        splits: [],
        ghostId: row.ghost_id || undefined,
      }));
    } catch (e) {
      console.warn('[SupabaseService] fetchUserActivities error:', e);
      return [];
    }
  }

  /**
   * Deletes a user activity from Supabase cloud database.
   */
  public async deleteUserActivity(activityId: string): Promise<boolean> {
    if (!isSupabaseConfigured()) {
      return false;
    }
    try {
      const { error } = await supabase
        .from('activities')
        .delete()
        .eq('id', activityId);

      if (error) {
        console.warn('[SupabaseService] deleteUserActivity error:', error);
        return false;
      }
      return true;
    } catch (e) {
      console.warn('[SupabaseService] deleteUserActivity exception:', e);
      return false;
    }
  }
}
