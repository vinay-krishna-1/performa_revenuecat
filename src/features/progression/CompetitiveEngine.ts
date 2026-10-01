import { COMPETITIVE_CONFIG, ActivityType } from '../../constants/config';

export interface PRCalculationParams {
  activityType: ActivityType;
  distanceMeters: number;
  durationSeconds: number;
  currentDivision: string;
  ghostOpponentId?: string;
  beatGhost?: boolean;
}

export interface PRCalculationResult {
  prAwarded: number;
  bonusReason?: string;
  newPrTotal?: number;
}

export class CompetitiveEngine {
  /**
   * Calculates PR (Performa Rating) points earned for a verified activity.
   */
  public static calculateActivityPR(params: PRCalculationParams): PRCalculationResult {
    const km = params.distanceMeters / 1000;
    if (km < 1.0) {
      return { prAwarded: 0, bonusReason: 'Under 1 km minimum for PR' };
    }

    // Base PR: ~6 PR per km
    let basePr = Math.round(km * 6.2);

    // Ghost victory bonus
    let bonusPr = 0;
    let bonusReason: string | undefined;

    if (params.ghostOpponentId && params.beatGhost) {
      bonusPr = 15;
      bonusReason = 'Defeated Ghost Opponent (+15 PR)';
    }

    const totalPr = Math.min(basePr + bonusPr, 65); // Cap per single activity to keep competition balanced

    return {
      prAwarded: totalPr,
      bonusReason,
    };
  }

  /**
   * Evaluates current division, tier, and distance to next tier promotion.
   */
  public static getDivisionStatus(currentPr: number): {
    division: string;
    tier: number;
    prToPromotion: number;
    progressPercent: number;
    nextTierDivision: string;
    nextTier: number;
  } {
    const divs = COMPETITIVE_CONFIG.divisions;

    for (let i = divs.length - 1; i >= 0; i--) {
      const div = divs[i];
      if (currentPr >= div.basePr) {
        const prAboveBase = currentPr - div.basePr;
        const tierIndex = Math.min(Math.floor(prAboveBase / div.prPerTier), 4);
        // Tiers: 5 is V (lowest in division), 1 is I (highest in division)
        const tier = 5 - tierIndex;

        const currentTierFloor = div.basePr + tierIndex * div.prPerTier;
        const currentTierCeiling = currentTierFloor + div.prPerTier;
        const prToPromotion = Math.max(0, currentTierCeiling - currentPr);
        const progressPercent = Math.min(
          100,
          Math.max(0, ((currentPr - currentTierFloor) / div.prPerTier) * 100)
        );

        let nextTierDivision = div.name.toUpperCase();
        let nextTier = tier - 1;
        if (nextTier < 1) {
          const nextDivIndex = i + 1;
          if (nextDivIndex < divs.length) {
            nextTierDivision = divs[nextDivIndex].name.toUpperCase();
            nextTier = 5;
          } else {
            nextTierDivision = 'ZENITH 100';
            nextTier = 0;
          }
        }

        return {
          division: div.name.toUpperCase(),
          tier,
          prToPromotion,
          progressPercent,
          nextTierDivision,
          nextTier,
        };
      }
    }

    return {
      division: 'BRONZE',
      tier: 5,
      prToPromotion: 200 - currentPr,
      progressPercent: (currentPr / 200) * 100,
      nextTierDivision: 'BRONZE',
      nextTier: 4,
    };
  }

  /**
   * Checks weekly workload surge and returns gentle recovery guidance without alarmist medical claims.
   */
  public static checkWorkloadSurge(
    currentWeekKm: number,
    baselineThreeWeekAvgKm: number
  ): { hasSurge: boolean; message?: string } {
    if (baselineThreeWeekAvgKm > 5 && currentWeekKm > baselineThreeWeekAvgKm * 1.45) {
      return {
        hasSurge: true,
        message:
          "That's a big increase from your recent activity. Consider taking recovery time before your next hard session.",
      };
    }
    return { hasSurge: false };
  }
}
