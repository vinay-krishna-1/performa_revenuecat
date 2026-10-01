-- ====================================================================
-- PERFORMA — SEED LEADERBOARDS, CLANS & COMPETITIVE ATHLETES
-- PostgreSQL / Supabase Migration
-- ====================================================================

-- 1. SEED ACTIVE SEASON
INSERT INTO public.seasons (id, season_number, title, start_at, end_at, is_active)
VALUES (
  '11111111-1111-1111-1111-111111111111',
  4,
  'Season 04: Obsidian Dawn',
  NOW() - INTERVAL '14 days',
  NOW() + INTERVAL '46 days',
  TRUE
)
ON CONFLICT (season_number) DO UPDATE 
SET is_active = TRUE;

-- 2. SEED COMPETITIVE ATHLETE AUTH USERS
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, aud)
VALUES 
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'sarah@performa.app', crypt('Performa2026!', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}', '{"name":"Sarah Connor"}', NOW(), NOW(), 'authenticated', 'authenticated'),
  ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'marcus@performa.app', crypt('Performa2026!', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}', '{"name":"Marcus Vance"}', NOW(), NOW(), 'authenticated', 'authenticated'),
  ('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'elena@performa.app', crypt('Performa2026!', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}', '{"name":"Elena Rostova"}', NOW(), NOW(), 'authenticated', 'authenticated'),
  ('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'liam@performa.app', crypt('Performa2026!', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}', '{"name":"Liam Chen"}', NOW(), NOW(), 'authenticated', 'authenticated'),
  ('e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a55', 'david@performa.app', crypt('Performa2026!', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}', '{"name":"David Kim"}', NOW(), NOW(), 'authenticated', 'authenticated')
ON CONFLICT (id) DO NOTHING;

-- 3. SEED ATHLETE PROFILES
INSERT INTO public.profiles (
  id, username, display_name, avatar_url, bio, current_division, current_tier, current_pr, peak_pr, streak_weeks, lifetime_xp, lifetime_distance_meters, lifetime_duration_seconds, lifetime_activities_count, current_season_id
)
VALUES
  (
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'sarah_c',
    'Sarah Connor',
    'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200',
    'Chasing the Zenith 100 podium. Marathoner.',
    'DIAMOND',
    1,
    6850,
    7100,
    12,
    48500,
    1420000,
    420000,
    140,
    '11111111-1111-1111-1111-111111111111'
  ),
  (
    'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
    'marcus_v',
    'Marcus Vance',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200',
    'Pace is everything. Sub-16 5K specialist.',
    'DIAMOND',
    2,
    6420,
    6600,
    9,
    41200,
    1180000,
    360000,
    115,
    '11111111-1111-1111-1111-111111111111'
  ),
  (
    'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33',
    'elena_r',
    'Elena Rostova',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200',
    'Consistency over intensity. Ultra runner.',
    'DIAMOND',
    2,
    6310,
    6450,
    16,
    39800,
    1240000,
    380000,
    120,
    '11111111-1111-1111-1111-111111111111'
  ),
  (
    'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a44',
    'liam_c',
    'Liam Chen',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200',
    'Urban circuits & cadence training.',
    'DIAMOND',
    3,
    5980,
    6100,
    8,
    36200,
    980000,
    290000,
    95,
    '11111111-1111-1111-1111-111111111111'
  ),
  (
    'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a55',
    'david_k',
    'David Kim',
    'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200',
    'Tempo runs and hill repeats.',
    'DIAMOND',
    4,
    5720,
    5900,
    6,
    33400,
    870000,
    270000,
    88,
    '11111111-1111-1111-1111-111111111111'
  )
ON CONFLICT (id) DO UPDATE SET
  current_pr = EXCLUDED.current_pr,
  peak_pr = EXCLUDED.peak_pr;

-- 4. SEED COMPETITIVE CLANS
INSERT INTO public.clans (
  id, name, tag, description, badge_icon, leader_id, member_count, season_pr, global_rank
)
VALUES
  (
    'c1111111-1111-1111-1111-111111111111',
    'Apex Striders',
    'APEX',
    'Elite distance specialists maintaining sub-4:30 pace.',
    'shield',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    24,
    48290,
    18
  ),
  (
    'c2222222-2222-2222-2222-222222222222',
    'Neon Stride',
    'NEON',
    'Night runners tracking city circuit segments.',
    'zap',
    'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
    28,
    44120,
    22
  ),
  (
    'c3333333-3333-3333-3333-333333333333',
    'Silicon Sprinters',
    'SILC',
    'Tech corridor athletes training for marathon PRs.',
    'award',
    'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33',
    20,
    39800,
    31
  ),
  (
    'c4444444-4444-4444-4444-444444444444',
    'Midnight Aerobic',
    'MDNT',
    'Ultra and tempo endurance crew.',
    'shield',
    'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a44',
    18,
    34500,
    44
  )
ON CONFLICT (id) DO UPDATE SET
  season_pr = EXCLUDED.season_pr,
  member_count = EXCLUDED.member_count;

-- 5. SEED COSMETIC INVENTORY ITEMS
INSERT INTO public.inventory_items (id, name, type, rarity, description, icon)
VALUES
  ('frame_gold_s4', 'Season 04 Gold Crest', 'FRAME', 'RARE', 'Awarded for reaching Gold division in Season 04.', 'shield'),
  ('title_pacesetter', 'Pacesetter', 'TITLE', 'COMMON', 'Consistent 5K pacing achieved across 10 sessions.', 'zap'),
  ('badge_5k_sub25', 'Sub-25 5K Master', 'BADGE', 'EPIC', 'Officially verified sub-25 minute 5K performance.', 'award'),
  ('theme_dark_matrix', 'Stealth Obsidian Theme', 'THEME', 'EPIC', 'Pure pitch black OLED canvas with precision volt telemetry.', 'palette'),
  ('theme_light_cobalt', 'Cobalt Daylight Theme', 'THEME', 'EPIC', 'Crisp light slate canvas with deep electric cobalt typography.', 'palette')
ON CONFLICT (id) DO NOTHING;
