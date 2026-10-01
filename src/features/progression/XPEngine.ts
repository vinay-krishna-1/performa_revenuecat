import { XP_CONFIG, ActivityType } from '../../constants/config';

export interface XPCalculationParams {
  activityType: ActivityType;
  durationMinutes: number;
  verificationFactor?: number;
  isVerifiedGps?: boolean;
}

export interface XPCalculationResult {
  xpAwarded: number;
  baseXp: number;
  diminishingPenalty: number;
  dailyCapApplied: boolean;
}

export class XPEngine {
  /**
   * Calculates XP with non-linear diminishing returns curve to prevent dangerous volume grinding.
   */
  public static calculateActivityXP(params: XPCalculationParams): XPCalculationResult {
    const ratePerMin = XP_CONFIG.baseXpPerMinute[params.activityType] || 6;
    let remainingMinutes = Math.max(params.durationMinutes, 0);
    let totalXp = 0;
    let prevThreshold = 0;

    for (const bracket of XP_CONFIG.diminishingReturns) {
      const bracketCapacity = bracket.upToMinutes - prevThreshold;
      const minutesInBracket = Math.min(remainingMinutes, bracketCapacity);

      if (minutesInBracket > 0) {
        totalXp += minutesInBracket * ratePerMin * bracket.multiplier;
        remainingMinutes -= minutesInBracket;
      }

      prevThreshold = bracket.upToMinutes;
      if (remainingMinutes <= 0) break;
    }

    const verificationMultiplier = params.isVerifiedGps !== false ? 1.0 : 0.7;
    const finalRawXp = Math.round(totalXp * verificationMultiplier);

    // Apply daily cap
    const finalXp = Math.min(finalRawXp, XP_CONFIG.dailyCap);

    return {
      xpAwarded: finalXp,
      baseXp: Math.round(params.durationMinutes * ratePerMin),
      diminishingPenalty: Math.max(0, Math.round(params.durationMinutes * ratePerMin) - finalXp),
      dailyCapApplied: finalRawXp > XP_CONFIG.dailyCap,
    };
  }

  /**
   * Calculates cumulative XP required to achieve level L.
   */
  public static xpRequiredForLevel(level: number): number {
    if (level <= 1) return 0;
    return Math.round(
      XP_CONFIG.levelFormula.baseMultiplier *
        Math.pow(level, XP_CONFIG.levelFormula.exponent)
    );
  }

  /**
   * Calculates current level from total lifetime XP.
   */
  public static getLevelFromLifetimeXp(lifetimeXp: number): {
    level: number;
    currentXpInLevel: number;
    xpForNextLevel: number;
    progressPercent: number;
  } {
    let level = 1;
    while (this.xpRequiredForLevel(level + 1) <= lifetimeXp) {
      level += 1;
    }

    const currentLevelFloor = this.xpRequiredForLevel(level);
    const nextLevelCeiling = this.xpRequiredForLevel(level + 1);
    const xpSpan = nextLevelCeiling - currentLevelFloor;
    const currentXpInLevel = lifetimeXp - currentLevelFloor;
    const progressPercent = xpSpan > 0 ? (currentXpInLevel / xpSpan) * 100 : 0;

    return {
      level,
      currentXpInLevel,
      xpForNextLevel: xpSpan,
      progressPercent: Math.min(Math.max(progressPercent, 0), 100),
    };
  }
}
