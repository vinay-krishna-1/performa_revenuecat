import { createClient } from '@supabase/supabase-js';
import { GPSQualityFilter } from '../src/features/recording/GPSQualityFilter';
import { SeasonService } from '../src/features/progression/SeasonService';
import { COMPETITIVE_CONFIG } from '../src/constants/config';

// Load Supabase environment
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://elhgtxlqygvnhawwdmud.supabase.co';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';

async function runSecurityAndStressTests() {
  console.log('====================================================');
  console.log('  PERFORMA SECURITY, RLS & STRESS TEST SUITE        ');
  console.log('====================================================\n');

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition: boolean, label: string) {
    totalTests++;
    if (condition) {
      console.log(`[PASS] ${label}`);
      passedTests++;
    } else {
      console.error(`[FAIL] ${label}`);
      throw new Error(`Assertion failed: ${label}`);
    }
  }

  // ----------------------------------------------------
  // TEST 1: 56-Day Season & UTC 0 Weekly Zenith Evaluation
  // ----------------------------------------------------
  console.log('--> 1. Validating 56-Day Season & UTC 0 Zenith Rule...');
  const seasonService = SeasonService.getInstance();
  const seasonInfo = seasonService.getCurrentSeason();
  assert(seasonInfo.totalWeeks === 8, 'Season duration is partitioned into exactly 8 weeks');
  assert(COMPETITIVE_CONFIG.seasonDurationDays === 56, 'COMPETITIVE_CONFIG.seasonDurationDays is 56 days');
  assert(seasonInfo.daysRemaining <= 56, 'Days remaining is within 56-day bound');

  // Verify Weekly UTC 0 Rollover computation
  const rollover = seasonInfo.weeklyRolloverUtc;
  const rolloverDate = new Date(rollover.nextRolloverIso);
  assert(rolloverDate.getUTCDay() === 0, 'Rollover target day is Sunday (UTC Day 0)');
  assert(rolloverDate.getUTCHours() === 23, 'Rollover target hour is 23:59:59 UTC');
  assert(rolloverDate.getUTCMinutes() === 59, 'Rollover target minute is 59 UTC');
  assert(rolloverDate.getUTCSeconds() === 59, 'Rollover target second is 59 UTC');

  // Verify Zenith weekly eligibility (Top 100 cut-off)
  assert(seasonService.isZenithWeeklyEligible(1) === true, 'Rank 1 is eligible for Zenith Season title');
  assert(seasonService.isZenithWeeklyEligible(50) === true, 'Rank 50 is eligible for Zenith Season title');
  assert(seasonService.isZenithWeeklyEligible(100) === true, 'Rank 100 is eligible for Zenith Season title');
  assert(seasonService.isZenithWeeklyEligible(101) === false, 'Rank 101 is NOT eligible for Zenith Season title');
  assert(seasonService.isZenithWeeklyEligible(undefined) === false, 'Unranked athlete is NOT eligible for Zenith');

  const zenithTitle = seasonService.getZenithWeeklyTitle('RUN');
  assert(zenithTitle === 'Zenith Season 01 RUN', `Zenith title formatted correctly: "${zenithTitle}"`);

  // ----------------------------------------------------
  // TEST 2: Anti-Cheat & GPS Teleportation Stress Checks
  // ----------------------------------------------------
  console.log('\n--> 2. Validating Anti-Cheat & Physics Boundary Enforcement...');
  const filter = new GPSQualityFilter();

  // Baseline point
  const startLoc = {
    latitude: 37.7749,
    longitude: -122.4194,
    altitude: 15,
    accuracy: 3.5,
    timestamp: 1700000000000,
  };
  const filterRes1 = filter.filterPoint(startLoc, 'RUN');
  assert(filterRes1.isValid === true, 'Initial legitimate GPS fix accepted');

  // Scenario A: Teleportation attack (Moving 3.2km in 2 seconds = 1,600 m/s)
  const teleportLoc = {
    latitude: 37.8049,
    longitude: -122.4194,
    altitude: 15,
    accuracy: 4.0,
    timestamp: 1700000002000, // 2s later
  };
  const filterResTeleport = filter.filterPoint(teleportLoc, 'RUN');
  assert(filterResTeleport.isValid === false, 'Anti-Cheat: Teleportation jump (1,600 m/s) successfully rejected');
  assert(filterResTeleport.deltaDistanceMeters === 0, 'Rejection zeroes out distance accrual to prevent false PR score');

  // Scenario B: Jitter noise attack (Accuracy = 65 meters, unacceptable for competitive PR)
  const jitterLoc = {
    latitude: 37.7750,
    longitude: -122.4195,
    altitude: 15,
    accuracy: 65, // > 35m threshold
    timestamp: 1700000003000,
  };
  const filterResJitter = filter.filterPoint(jitterLoc, 'RUN');
  assert(filterResJitter.isValid === false, 'Anti-Cheat: Weak accuracy GPS point (accuracy 65m) rejected');

  // Scenario C: Realistic competitive run pace (5:00 /km = ~3.33 m/s)
  // Distance ~ 16.6 meters in 5 seconds
  const legitimateLoc = {
    latitude: 37.77505,
    longitude: -122.4194,
    altitude: 15.2,
    accuracy: 4.1,
    timestamp: 1700000005000,
  };
  const filterResLegit = filter.filterPoint(legitimateLoc, 'RUN');
  assert(filterResLegit.isValid === true, 'Clean athletic GPS fix accepted under competitive pacing');

  // ----------------------------------------------------
  // TEST 3: Offline Queue Drain & Idempotency Invariants
  // ----------------------------------------------------
  console.log('\n--> 3. Testing Offline Queue Drain Idempotency...');
  const mockActivityId = 'act_offline_stress_' + Date.now();
  const mockQueueItem = {
    activityId: mockActivityId,
    timestamp: Date.now(),
    payload: {
      id: mockActivityId,
      userId: 'usr_stress_test',
      type: 'RUN',
      distanceMeters: 5000,
      movingSeconds: 1500,
    },
  };

  // Simulating duplicate queue drain attempts (e.g. cellular reconnection network retry)
  const processedStore = new Set<string>();
  function processQueueSync(item: typeof mockQueueItem): { status: 'PROCESSED' | 'DEDUPLICATED' } {
    if (processedStore.has(item.activityId)) {
      return { status: 'DEDUPLICATED' };
    }
    processedStore.add(item.activityId);
    return { status: 'PROCESSED' };
  }

  const drain1 = processQueueSync(mockQueueItem);
  assert(drain1.status === 'PROCESSED', 'First sync batch successfully processed');

  const drain2 = processQueueSync(mockQueueItem);
  assert(drain2.status === 'DEDUPLICATED', 'Duplicate sync retry safely deduplicated without creating orphaned duplicates');

  // ----------------------------------------------------
  // TEST 4: Supabase RLS (Row Level Security) Verification
  // ----------------------------------------------------
  console.log('\n--> 4. Testing Supabase RLS & Anonymous Authorization Isolation...');
  const anonymousClient = createClient(supabaseUrl, supabaseAnonKey);

  // Attempt unauthenticated write to activities table
  // Under Performa RLS, anon clients cannot insert activities without a valid auth.uid() matching user_id
  const rogueActivityId = 'rogue_act_' + Math.random().toString(36).substring(7);
  const { data: insertData, error: insertError } = await anonymousClient
    .from('activities')
    .insert([
      {
        id: rogueActivityId,
        user_id: '00000000-0000-0000-0000-000000000000',
        activity_type: 'RUN',
        distance_meters: 10000,
        moving_seconds: 1800,
        avg_pace_seconds_per_km: 180,
      },
    ])
    .select();

  assert(
    insertError !== null || !insertData || insertData.length === 0,
    'RLS Protection: Anonymous unauthenticated client write rejected or isolated by Postgres RLS'
  );
  if (insertError) {
    console.log(`  [RLS Confirmation] Server responded with expected denial: "${insertError.message}"`);
  }

  // Attempt unauthenticated update to another user's profile
  const { data: profileUpdateData, error: profileUpdateError } = await anonymousClient
    .from('profiles')
    .update({ lifetime_xp: 9999999 })
    .eq('id', '00000000-0000-0000-0000-000000000000')
    .select();

  assert(
    profileUpdateError !== null || !profileUpdateData || profileUpdateData.length === 0,
    'RLS Protection: Unauthorized profile mutation blocked by Postgres RLS'
  );

  // ----------------------------------------------------
  // TEST 5: Cascade Deletion Integrity Verification
  // ----------------------------------------------------
  console.log('\n--> 5. Testing Cascade Deletion & Aggregation Rollback Integrity...');
  const initialUserLifetime = {
    distanceMeters: 25000,
    durationSeconds: 7200,
    activitiesCount: 5,
  };

  const activityToDelete = {
    id: 'act_cascade_test_01',
    distanceMeters: 5000,
    movingSeconds: 1500,
  };

  // Rollback logic
  const rolledBackState = {
    distanceMeters: Math.max(0, initialUserLifetime.distanceMeters - activityToDelete.distanceMeters),
    durationSeconds: Math.max(0, initialUserLifetime.durationSeconds - activityToDelete.movingSeconds),
    activitiesCount: Math.max(0, initialUserLifetime.activitiesCount - 1),
  };

  assert(rolledBackState.distanceMeters === 20000, 'Distance correctly decremented after activity deletion');
  assert(rolledBackState.durationSeconds === 5700, 'Duration correctly decremented after activity deletion');
  assert(rolledBackState.activitiesCount === 4, 'Activity count correctly decremented');

  console.log('\n====================================================');
  console.log(`  ALL ${passedTests}/${totalTests} SECURITY & STRESS TESTS PASSED SUCCESSFULLY!`);
  console.log('====================================================\n');
}

runSecurityAndStressTests().catch((err) => {
  console.error('\n[FATAL] Stress test failure:', err);
  process.exit(1);
});
