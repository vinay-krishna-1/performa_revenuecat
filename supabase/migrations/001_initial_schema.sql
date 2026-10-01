-- ====================================================================
-- PERFORMA — MASTER DATABASE SCHEMA & SECURITY POLICIES
-- PostgreSQL / Supabase Migration
-- ====================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. ENUMS
CREATE TYPE activity_sport_type AS ENUM ('RUN', 'CYCLE', 'WALK', 'SWIM');
CREATE TYPE verification_status_type AS ENUM ('VERIFIED', 'PENDING_REVIEW', 'FLAGGED');
CREATE TYPE division_tier_type AS ENUM ('BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'DIAMOND', 'ZENITH');
CREATE TYPE cosmetic_rarity_type AS ENUM ('COMMON', 'RARE', 'EPIC', 'ZENITH');
CREATE TYPE cosmetic_type AS ENUM ('FRAME', 'TITLE', 'BADGE', 'THEME');

-- 3. PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  bio TEXT,
  units TEXT DEFAULT 'METRIC',
  preferred_activity activity_sport_type DEFAULT 'RUN',
  
  -- Progression (Lifetime)
  level INTEGER DEFAULT 1,
  lifetime_xp BIGINT DEFAULT 0,
  
  -- Competitive (Seasonal)
  current_season_id UUID,
  current_division division_tier_type DEFAULT 'BRONZE',
  current_tier INTEGER DEFAULT 5, -- 5 = V, 1 = I
  current_pr INTEGER DEFAULT 0,
  peak_pr INTEGER DEFAULT 0,
  current_rank INTEGER,
  is_zenith_100 BOOLEAN DEFAULT FALSE,
  
  -- Consistency & Recovery
  streak_weeks INTEGER DEFAULT 0,
  last_active_week TEXT,
  qualifying_activities_this_week INTEGER DEFAULT 0,
  
  -- Lifetime Stats
  lifetime_distance_meters BIGINT DEFAULT 0,
  lifetime_duration_seconds BIGINT DEFAULT 0,
  lifetime_activities_count INTEGER DEFAULT 0,
  
  is_pro BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. SEASONS TABLE (60-Day Cycles)
CREATE TABLE IF NOT EXISTS public.seasons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  season_number INTEGER UNIQUE NOT NULL,
  title TEXT NOT NULL,
  start_at TIMESTAMPTZ NOT NULL,
  end_at TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. ACTIVITIES TABLE
CREATE TABLE IF NOT EXISTS public.activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  activity_type activity_sport_type NOT NULL,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  elapsed_seconds INTEGER NOT NULL,
  moving_seconds INTEGER NOT NULL,
  distance_meters INTEGER NOT NULL,
  avg_pace_seconds_per_km INTEGER NOT NULL,
  best_pace_seconds_per_km INTEGER,
  avg_speed_mps NUMERIC(6,2),
  max_speed_mps NUMERIC(6,2),
  elevation_gain_meters INTEGER DEFAULT 0,
  elevation_loss_meters INTEGER DEFAULT 0,
  xp_earned INTEGER DEFAULT 0,
  pr_earned INTEGER DEFAULT 0,
  verification_status verification_status_type DEFAULT 'PENDING_REVIEW',
  quality_score INTEGER DEFAULT 100,
  polyline_summary TEXT,
  visibility TEXT DEFAULT 'PRIVATE' CHECK (visibility IN ('PRIVATE', 'PUBLIC', 'CLAN')),
  ghost_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. ACTIVITY POINTS (GPS Breadcrumbs)
CREATE TABLE IF NOT EXISTS public.activity_points (
  id BIGSERIAL PRIMARY KEY,
  activity_id UUID NOT NULL REFERENCES public.activities(id) ON DELETE CASCADE,
  sequence_idx INTEGER NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  altitude NUMERIC(7,2),
  accuracy NUMERIC(5,2),
  speed NUMERIC(5,2),
  heading NUMERIC(5,2),
  point_timestamp TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_activity_points_act_id ON public.activity_points(activity_id);

-- 7. ACTIVITY SPLITS (Kilometer / Mile Splits)
CREATE TABLE IF NOT EXISTS public.activity_splits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  activity_id UUID NOT NULL REFERENCES public.activities(id) ON DELETE CASCADE,
  split_number INTEGER NOT NULL,
  distance_meters INTEGER NOT NULL,
  elapsed_seconds INTEGER NOT NULL,
  pace_seconds_per_km INTEGER NOT NULL,
  elevation_gain_meters INTEGER DEFAULT 0
);

-- 8. ROUTES TABLE
CREATE TABLE IF NOT EXISTS public.routes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  distance_meters INTEGER NOT NULL,
  elevation_gain_meters INTEGER DEFAULT 0,
  estimated_duration_seconds INTEGER NOT NULL,
  difficulty TEXT DEFAULT 'MODERATE',
  activity_type activity_sport_type DEFAULT 'RUN',
  polyline_data JSONB,
  attempts_count INTEGER DEFAULT 0,
  record_seconds INTEGER,
  record_holder_id UUID REFERENCES public.profiles(id),
  visibility TEXT DEFAULT 'COMMUNITY',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. GHOSTS TABLE
CREATE TABLE IF NOT EXISTS public.ghosts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source_activity_id UUID REFERENCES public.activities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  athlete_name TEXT NOT NULL,
  activity_type activity_sport_type NOT NULL,
  total_distance_meters INTEGER NOT NULL,
  total_duration_seconds INTEGER NOT NULL,
  checkpoints JSONB NOT NULL, -- Normalized distance checkpoints
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. CLANS & CLAN MEMBERS
CREATE TABLE IF NOT EXISTS public.clans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  tag TEXT UNIQUE NOT NULL,
  description TEXT,
  badge_icon TEXT DEFAULT 'shield',
  leader_id UUID NOT NULL REFERENCES public.profiles(id),
  member_count INTEGER DEFAULT 1,
  season_pr BIGINT DEFAULT 0,
  global_rank INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.clan_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clan_id UUID NOT NULL REFERENCES public.clans(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'MEMBER',
  contribution_pr INTEGER DEFAULT 0,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(clan_id, user_id)
);

-- 11. INVENTORY & COSMETICS
CREATE TABLE IF NOT EXISTS public.inventory_items (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type cosmetic_type NOT NULL,
  rarity cosmetic_rarity_type DEFAULT 'COMMON',
  description TEXT,
  icon TEXT,
  season_id UUID REFERENCES public.seasons(id)
);

CREATE TABLE IF NOT EXISTS public.user_inventory (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  item_id TEXT NOT NULL REFERENCES public.inventory_items(id) ON DELETE CASCADE,
  is_equipped BOOLEAN DEFAULT FALSE,
  acquired_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, item_id)
);

-- ====================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ====================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_splits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ghosts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clan_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_inventory ENABLE ROW LEVEL SECURITY;

-- Profiles: Public can read leaderboard profiles; users can only update their own
CREATE POLICY "Public read profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Activities: Users read their own activities; others can only read if explicitly set to 'PUBLIC'
CREATE POLICY "Users read own activities" ON public.activities 
  FOR SELECT USING (auth.uid() = user_id OR visibility = 'PUBLIC');
CREATE POLICY "Users insert own activities" ON public.activities 
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own activities" ON public.activities 
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own activities" ON public.activities 
  FOR DELETE USING (auth.uid() = user_id);

-- Activity Points (Raw GPS breadcrumbs): Strictly accessible by activity owner (or if public)
CREATE POLICY "Users read own activity points" ON public.activity_points 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.activities a 
      WHERE a.id = activity_points.activity_id 
      AND (a.user_id = auth.uid() OR a.visibility = 'PUBLIC')
    )
  );
CREATE POLICY "Users insert own activity points" ON public.activity_points 
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.activities a 
      WHERE a.id = activity_points.activity_id 
      AND a.user_id = auth.uid()
    )
  );
CREATE POLICY "Users delete own activity points" ON public.activity_points 
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.activities a 
      WHERE a.id = activity_points.activity_id 
      AND a.user_id = auth.uid()
    )
  );

-- Activity Splits
CREATE POLICY "Users read own activity splits" ON public.activity_splits 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.activities a 
      WHERE a.id = activity_splits.activity_id 
      AND (a.user_id = auth.uid() OR a.visibility = 'PUBLIC')
    )
  );
CREATE POLICY "Users insert own activity splits" ON public.activity_splits 
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.activities a 
      WHERE a.id = activity_splits.activity_id 
      AND a.user_id = auth.uid()
    )
  );

-- Routes & Ghosts: Public community read
CREATE POLICY "Public read routes" ON public.routes FOR SELECT USING (true);
CREATE POLICY "Public read ghosts" ON public.ghosts FOR SELECT USING (true);

-- User inventory: Strictly private to the owning user
CREATE POLICY "Users manage own inventory" ON public.user_inventory FOR ALL USING (auth.uid() = user_id);

-- ====================================================================
-- SERVER-SIDE ACTIVITY VALIDATION & REWARDS RPC FUNCTION
-- ====================================================================
CREATE OR REPLACE FUNCTION public.calculate_activity_rewards(
  p_activity_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_act RECORD;
  v_rate_per_min INTEGER := 7;
  v_duration_min NUMERIC;
  v_xp INTEGER := 0;
  v_pr INTEGER := 0;
  v_is_suspicious BOOLEAN := FALSE;
BEGIN
  SELECT * INTO v_act FROM public.activities WHERE id = p_activity_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Activity not found');
  END IF;

  v_duration_min := v_act.moving_seconds / 60.0;

  -- 1. Anti-Cheat: Validate human speed heuristics
  IF v_act.activity_type = 'RUN' AND v_act.avg_speed_mps > 12.5 THEN
    v_is_suspicious := TRUE;
  ELSIF v_act.activity_type = 'CYCLE' AND v_act.avg_speed_mps > 25.0 THEN
    v_is_suspicious := TRUE;
  END IF;

  IF v_is_suspicious THEN
    UPDATE public.activities
    SET verification_status = 'FLAGGED', xp_earned = 0, pr_earned = 0
    WHERE id = p_activity_id;
    RETURN jsonb_build_object('status', 'FLAGGED', 'reason', 'Speed limit exceeded');
  END IF;

  -- 2. Calculate XP with diminishing returns (7 XP/min for run, 6 for cycle)
  IF v_act.activity_type = 'CYCLE' THEN v_rate_per_min := 6;
  ELSIF v_act.activity_type = 'WALK' THEN v_rate_per_min := 5;
  ELSIF v_act.activity_type = 'SWIM' THEN v_rate_per_min := 8;
  END IF;

  -- Full XP first 30 mins, 70% next 30 mins, 40% after
  IF v_duration_min <= 30 THEN
    v_xp := ROUND(v_duration_min * v_rate_per_min);
  ELSIF v_duration_min <= 60 THEN
    v_xp := ROUND((30 * v_rate_per_min) + ((v_duration_min - 30) * v_rate_per_min * 0.7));
  ELSE
    v_xp := ROUND((30 * v_rate_per_min) + (30 * v_rate_per_min * 0.7) + ((v_duration_min - 60) * v_rate_per_min * 0.4));
  END IF;

  -- 3. Calculate PR (Competitive Rating)
  IF v_act.distance_meters >= 1000 THEN
    v_pr := LEAST(ROUND((v_act.distance_meters / 1000.0) * 6.2), 65);
  END IF;

  -- 4. Update Activity & User Profile
  UPDATE public.activities
  SET verification_status = 'VERIFIED', xp_earned = v_xp, pr_earned = v_pr
  WHERE id = p_activity_id;

  UPDATE public.profiles
  SET 
    lifetime_xp = lifetime_xp + v_xp,
    current_pr = current_pr + v_pr,
    peak_pr = GREATEST(peak_pr, current_pr + v_pr),
    lifetime_distance_meters = lifetime_distance_meters + v_act.distance_meters,
    lifetime_duration_seconds = lifetime_duration_seconds + v_act.moving_seconds,
    lifetime_activities_count = lifetime_activities_count + 1
  WHERE id = v_act.user_id;

  RETURN jsonb_build_object(
    'status', 'VERIFIED',
    'xp_earned', v_xp,
    'pr_earned', v_pr
  );
END;
$$;
