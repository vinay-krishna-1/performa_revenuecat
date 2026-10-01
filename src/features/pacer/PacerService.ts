import { PacerSettings, PacerSplitStrategy, PacerSplitTarget, PacerStrategyIntensity } from '../../types';

export class PacerService {
  private static instance: PacerService;

  public static getInstance(): PacerService {
    if (!PacerService.instance) {
      PacerService.instance = new PacerService();
    }
    return PacerService.instance;
  }

  /**
   * Generates a precise split pacing table for each kilometer
   * based on the selected endurance pacing strategy and intensity level.
   */
  public generateSplits(
    targetDistanceMeters: number,
    targetTimeSeconds: number,
    strategy: PacerSplitStrategy,
    intensity: PacerStrategyIntensity = 'MODERATE'
  ): PacerSplitTarget[] {
    const totalKm = Math.max(1, Math.ceil(targetDistanceMeters / 1000));
    const exactKm = targetDistanceMeters / 1000;
    const basePaceSec = targetTimeSeconds / exactKm;

    const splits: PacerSplitTarget[] = [];
    let cumulative = 0;

    if (strategy === 'EVEN' || totalKm <= 1) {
      // Flat rhythm: every kilometer target is identical
      for (let km = 1; km <= totalKm; km++) {
        const isLastKm = km === totalKm;
        const kmDistanceFraction = isLastKm ? (exactKm - (km - 1)) : 1.0;
        const kmPace = Math.round(basePaceSec);
        const kmDuration = Math.round(kmPace * kmDistanceFraction);
        cumulative += kmDuration;

        splits.push({
          kmNumber: km,
          targetPaceSeconds: kmPace,
          cumulativeTargetSeconds: cumulative,
        });
      }
      return splits;
    }

    // Determine spread based on chosen intensity level
    // Mild: ±2% (4% spread), Moderate: ±4% (8% spread), Aggressive: ±7% (14% spread)
    const spreadPct = intensity === 'MILD' ? 0.04 : intensity === 'AGGRESSIVE' ? 0.14 : 0.08;
    const halfSpread = spreadPct / 2;

    if (strategy === 'NEGATIVE_SPLIT') {
      // Negative split: start conservative, accelerate to the finish line
      let rawPaces: number[] = [];
      let totalRawSec = 0;

      for (let km = 1; km <= totalKm; km++) {
        const t = (km - 1) / Math.max(1, totalKm - 1); // 0 at start, 1 at finish
        const factor = 1 + (halfSpread - t * spreadPct);
        const kmPace = basePaceSec * factor;
        const isLastKm = km === totalKm;
        const kmDistanceFraction = isLastKm ? (exactKm - (km - 1)) : 1.0;
        rawPaces.push(kmPace);
        totalRawSec += kmPace * kmDistanceFraction;
      }

      // Normalize so sum equals targetTimeSeconds exactly
      const normRatio = targetTimeSeconds / totalRawSec;
      for (let km = 1; km <= totalKm; km++) {
        const adjustedPace = Math.round(rawPaces[km - 1] * normRatio);
        const isLastKm = km === totalKm;
        const kmDistanceFraction = isLastKm ? (exactKm - (km - 1)) : 1.0;
        cumulative += Math.round(adjustedPace * kmDistanceFraction);

        splits.push({
          kmNumber: km,
          targetPaceSeconds: adjustedPace,
          cumulativeTargetSeconds: cumulative,
        });
      }
      return splits;
    }

    if (strategy === 'POSITIVE_SPLIT') {
      // Positive split: aggressive early pace, holding on in 2nd half
      let rawPaces: number[] = [];
      let totalRawSec = 0;

      for (let km = 1; km <= totalKm; km++) {
        const t = (km - 1) / Math.max(1, totalKm - 1);
        const factor = 1 - (halfSpread - t * spreadPct);
        const kmPace = basePaceSec * factor;
        const isLastKm = km === totalKm;
        const kmDistanceFraction = isLastKm ? (exactKm - (km - 1)) : 1.0;
        rawPaces.push(kmPace);
        totalRawSec += kmPace * kmDistanceFraction;
      }

      const normRatio = targetTimeSeconds / totalRawSec;
      for (let km = 1; km <= totalKm; km++) {
        const adjustedPace = Math.round(rawPaces[km - 1] * normRatio);
        const isLastKm = km === totalKm;
        const kmDistanceFraction = isLastKm ? (exactKm - (km - 1)) : 1.0;
        cumulative += Math.round(adjustedPace * kmDistanceFraction);

        splits.push({
          kmNumber: km,
          targetPaceSeconds: adjustedPace,
          cumulativeTargetSeconds: cumulative,
        });
      }
      return splits;
    }

    return splits;
  }

  /**
   * Adapts upcoming splits mid-run when an athlete feels heavy / tired.
   * Eases the remaining kilometers by +bufferSecondsPerKm.
   */
  public relaxRemainingSplits(
    currentKm: number,
    existingSplits: PacerSplitTarget[],
    bufferSecondsPerKm: number = 25
  ): PacerSplitTarget[] {
    const updated = [...existingSplits];
    let cumulative = 0;

    for (let i = 0; i < updated.length; i++) {
      const s = updated[i];
      if (s.kmNumber <= currentKm) {
        cumulative = s.cumulativeTargetSeconds;
      } else {
        const newPace = s.targetPaceSeconds + bufferSecondsPerKm;
        cumulative += newPace;
        updated[i] = {
          ...s,
          targetPaceSeconds: newPace,
          cumulativeTargetSeconds: cumulative,
        };
      }
    }

    return updated;
  }

  /**
   * Adapts upcoming splits mid-run when an athlete feels fresh / ready to kick.
   * Accelerates remaining kilometers by -surgeSecondsPerKm.
   */
  public surgeRemainingSplits(
    currentKm: number,
    existingSplits: PacerSplitTarget[],
    surgeSecondsPerKm: number = 15
  ): PacerSplitTarget[] {
    const updated = [...existingSplits];
    let cumulative = 0;

    for (let i = 0; i < updated.length; i++) {
      const s = updated[i];
      if (s.kmNumber <= currentKm) {
        cumulative = s.cumulativeTargetSeconds;
      } else {
        const newPace = Math.max(120, s.targetPaceSeconds - surgeSecondsPerKm); // Never faster than 2:00/km
        cumulative += newPace;
        updated[i] = {
          ...s,
          targetPaceSeconds: newPace,
          cumulativeTargetSeconds: cumulative,
        };
      }
    }

    return updated;
  }

  /**
   * Evaluates current pace against target pace for immediate coaching feedback.
   */
  public evaluatePace(
    currentPaceSec: number,
    targetPaceSec: number
  ): {
    status: 'ON_PACE' | 'AHEAD' | 'BEHIND';
    deltaSeconds: number; // positive = faster than target, negative = slower
    feedbackText: string;
  } {
    if (!currentPaceSec || currentPaceSec <= 0 || !targetPaceSec || targetPaceSec <= 0) {
      return { status: 'ON_PACE', deltaSeconds: 0, feedbackText: 'Pacing calibrating...' };
    }

    // Delta = Target - Current (if target is 300s and current is 290s, delta is +10s faster)
    const deltaSeconds = targetPaceSec - currentPaceSec;

    if (Math.abs(deltaSeconds) <= 4) {
      return {
        status: 'ON_PACE',
        deltaSeconds,
        feedbackText: 'On target pace! Excellent rhythm.',
      };
    } else if (deltaSeconds > 4) {
      return {
        status: 'AHEAD',
        deltaSeconds,
        feedbackText: `${Math.round(deltaSeconds)}s ahead of target. Relax and sustain.`,
      };
    } else {
      return {
        status: 'BEHIND',
        deltaSeconds,
        feedbackText: `${Math.round(Math.abs(deltaSeconds))}s behind split. Pick up stride rhythm.`,
      };
    }
  }
}
