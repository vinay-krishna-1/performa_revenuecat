export interface PacerTarget {
  targetDistanceMeters: number;
  targetTimeSeconds: number;
  strategy: 'FLAT' | 'NEGATIVE_SPLIT' | 'PROGRESSIVE';
}

export class PacerEngine {
  /**
   * Calculates overall required target pace in seconds per km.
   */
  public static calculateTargetPace(targetDistanceMeters: number, targetTimeSeconds: number): number {
    const km = targetDistanceMeters / 1000;
    if (km <= 0) return 0;
    return Math.round(targetTimeSeconds / km);
  }

  /**
   * Generates target splits based on chosen pacing strategy.
   */
  public static generateSplitTargets(target: PacerTarget): { splitKm: number; targetPaceSec: number }[] {
    const totalKm = Math.ceil(target.targetDistanceMeters / 1000);
    const flatPace = this.calculateTargetPace(target.targetDistanceMeters, target.targetTimeSeconds);
    const splits: { splitKm: number; targetPaceSec: number }[] = [];

    for (let km = 1; km <= totalKm; km++) {
      if (target.strategy === 'NEGATIVE_SPLIT') {
        // First half 3% slower, second half 3% faster
        const isSecondHalf = km > totalKm / 2;
        const adjustedPace = isSecondHalf ? Math.round(flatPace * 0.97) : Math.round(flatPace * 1.03);
        splits.push({ splitKm: km, targetPaceSec: adjustedPace });
      } else if (target.strategy === 'PROGRESSIVE') {
        // Starts 5% slower and accelerates 2% per km
        const progressionFactor = 1.05 - (km / totalKm) * 0.1;
        splits.push({ splitKm: km, targetPaceSec: Math.round(flatPace * progressionFactor) });
      } else {
        // Flat pacing
        splits.push({ splitKm: km, targetPaceSec: flatPace });
      }
    }

    return splits;
  }

  /**
   * Compares current actual elapsed time against scheduled target time at distance.
   */
  public static evaluatePacerDelta(
    target: PacerTarget,
    currentDistanceMeters: number,
    currentMovingSeconds: number
  ): { deltaSeconds: number; isAhead: boolean; message: string } {
    if (target.targetDistanceMeters <= 0) {
      return { deltaSeconds: 0, isAhead: true, message: 'On pace' };
    }

    const progressFraction = currentDistanceMeters / target.targetDistanceMeters;
    const scheduledTimeAtDistance = target.targetTimeSeconds * progressFraction;
    const deltaSeconds = Math.round(scheduledTimeAtDistance - currentMovingSeconds);
    const isAhead = deltaSeconds >= 0;

    const absDelta = Math.abs(deltaSeconds);
    const message =
      absDelta < 3
        ? 'Directly on target pace'
        : isAhead
        ? `${absDelta}s ahead of target pace`
        : `${absDelta}s behind target pace`;

    return {
      deltaSeconds,
      isAhead,
      message,
    };
  }
}
