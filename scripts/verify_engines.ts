import { XPEngine } from '../src/features/progression/XPEngine';
import { CompetitiveEngine } from '../src/features/progression/CompetitiveEngine';
import { GhostEngine } from '../src/features/ghost/GhostEngine';
import { GPSQualityFilter } from '../src/features/recording/GPSQualityFilter';
import { PacerEngine } from '../src/features/coaching/PacerEngine';
import { RecordingStateMachine } from '../src/features/recording/RecordingStateMachine';

function runTests() {
  console.log('--- RUNNING PERFORMA CORE LOGIC TESTS ---');

  // 1. XP Engine Test
  console.log('1. Testing XPEngine...');
  const xp30min = XPEngine.calculateActivityXP({
    activityType: 'RUN',
    durationMinutes: 30,
  });
  // 30 min run at 7 XP/min = 210 XP
  if (xp30min.xpAwarded !== 210) {
    throw new Error(`Expected 210 XP for 30m run, got ${xp30min.xpAwarded}`);
  }

  // 60 min run with diminishing returns: first 30m at 7 (210) + next 30m at 7*0.7=4.9 (147) = 357 XP
  const xp60min = XPEngine.calculateActivityXP({
    activityType: 'RUN',
    durationMinutes: 60,
  });
  if (xp60min.xpAwarded !== 357) {
    throw new Error(`Expected 357 XP for 60m run, got ${xp60min.xpAwarded}`);
  }
  console.log('✓ XPEngine diminishing returns passed: 30m = 210 XP, 60m = 357 XP');

  // Level curve test
  const lvl1 = XPEngine.getLevelFromLifetimeXp(0);
  const lvl27 = XPEngine.getLevelFromLifetimeXp(18240);
  if (lvl1.level !== 1) throw new Error('Level at 0 XP should be 1');
  console.log(`✓ Level curve passed: 18,240 XP maps to Level ${lvl27.level}`);

  // 2. Competitive Engine Test
  console.log('2. Testing CompetitiveEngine...');
  const goldStatus = CompetitiveEngine.getDivisionStatus(2840);
  if (goldStatus.division !== 'GOLD' || goldStatus.tier !== 3) {
    throw new Error(`Expected GOLD III for 2840 PR, got ${goldStatus.division} ${goldStatus.tier}`);
  }
  if (goldStatus.prToPromotion !== 160) {
    throw new Error(`Expected 160 PR to promotion, got ${goldStatus.prToPromotion}`);
  }
  console.log(`✓ Division test passed: 2,840 PR is ${goldStatus.division} Tier ${goldStatus.tier}, ${goldStatus.prToPromotion} PR to ${goldStatus.nextTierDivision}`);

  // Workload surge test
  const surge = CompetitiveEngine.checkWorkloadSurge(35, 20);
  if (!surge.hasSurge || !surge.message) {
    throw new Error('Expected workload surge alert for 35km vs 20km baseline');
  }
  console.log('✓ Workload surge test passed:', surge.message);

  // 3. Ghost Engine Test
  console.log('3. Testing GhostEngine...');
  const mockGhost = {
    id: 'ghost_test',
    activityId: 'act_test',
    athleteName: 'Arjun',
    activityType: 'RUN' as const,
    totalDistanceMeters: 5000,
    totalDurationSeconds: 1500, // 25:00
    checkpoints: [
      { distanceMeters: 1000, elapsedSeconds: 300, latitude: 0, longitude: 0 },
      { distanceMeters: 2000, elapsedSeconds: 600, latitude: 0, longitude: 0 },
    ],
  };

  // User at 1000m at 270s (30s faster than ghost's 300s)
  const ghostDelta = GhostEngine.calculateGhostDelta(mockGhost, 1000, 270);
  if (ghostDelta.deltaSeconds !== 30 || !ghostDelta.isUserWinning) {
    throw new Error(`Expected user +30s ahead, got ${ghostDelta.deltaSeconds}`);
  }
  console.log(`✓ Ghost delta test passed: User is +${ghostDelta.deltaSeconds}s ahead at 1 km`);

  // 4. GPS Quality Filter Test
  console.log('4. Testing GPSQualityFilter...');
  const filter = new GPSQualityFilter();
  const p1 = { latitude: 37.7749, longitude: -122.4194, timestamp: 1000000, accuracy: 5 };
  const res1 = filter.filterPoint(p1, 'RUN');
  if (!res1.isValid) throw new Error('First point should be valid');

  // Impossible jump: 5 km in 1 second
  const pImpossible = { latitude: 37.8200, longitude: -122.4194, timestamp: 1001000, accuracy: 5 };
  const resTeleport = filter.filterPoint(pImpossible, 'RUN');
  if (resTeleport.isValid) {
    throw new Error('Teleportation jump was not rejected by GPS filter!');
  }
  console.log('✓ GPSQualityFilter rejected teleportation jump successfully');

  // 5. Pacer Engine Test
  console.log('5. Testing PacerEngine...');
  const targetPace = PacerEngine.calculateTargetPace(5000, 1500); // 25:00 for 5K = 300 s/km = 5:00/km
  if (targetPace !== 300) throw new Error(`Expected 300 s/km target pace, got ${targetPace}`);
  console.log(`✓ PacerEngine target pace passed: 5K in 25:00 is ${targetPace} s/km`);

  // 6. State Machine Lifecycle Test
  console.log('6. Testing RecordingStateMachine transitions...');
  const sm = new RecordingStateMachine();
  sm.transition('PREPARING');
  sm.transition('COUNTDOWN');
  sm.transition('RECORDING');
  sm.transition('PAUSED');
  sm.transition('FINALIZING');
  sm.transition('COMPLETED');
  // Transition directly from COMPLETED to PREPARING for consecutive workouts
  const restartSuccess = sm.transition('PREPARING');
  if (!restartSuccess || sm.getState() !== 'PREPARING') {
    throw new Error('State machine failed to transition from COMPLETED to PREPARING');
  }
  sm.reset();
  if (sm.getState() !== 'IDLE') {
    throw new Error('State machine reset did not restore IDLE state');
  }
  console.log('✓ RecordingStateMachine lifecycle passed (including COMPLETED -> PREPARING and reset)');

  console.log('\n>>> ALL PERFORMA ENGINE TESTS PASSED! <<<');
}

runTests();
