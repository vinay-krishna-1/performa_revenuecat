import { COMPETITIVE_CONFIG } from '../../constants/config';

export interface SeasonInfo {
  id: string;
  number: number;
  name: string;
  theme: string;
  startDate: string;
  endDate: string;
  daysRemaining: number;
  totalDurationDays: number;
  totalWeeks: number;
  currentWeek: number;
  weeklyRolloverUtc: {
    nextRolloverIso: string;
    formattedCountdown: string;
    hoursRemaining: number;
    daysRemaining: number;
  };
  zenithRankCutoff: number;
  rewardsSummary: {
    zenith: string;
    diamond: string;
    platinum: string;
    gold: string;
    silver: string;
    bronze: string;
  };
}

export class SeasonService {
  private static instance: SeasonService;

  // Official 56-Day (8-Week) Launch Season
  private currentSeason: SeasonInfo = {
    id: 'season_00',
    number: 0,
    name: 'Season 0',
    theme: 'Genesis Horizon',
    startDate: '2026-09-01T00:00:00Z',
    endDate: '2026-10-26T23:59:59Z', // 56 days exactly (8 weeks * 7 days)
    daysRemaining: 28,
    totalDurationDays: COMPETITIVE_CONFIG.seasonDurationDays || 56,
    totalWeeks: 8,
    currentWeek: 4,
    weeklyRolloverUtc: {
      nextRolloverIso: '',
      formattedCountdown: '',
      hoursRemaining: 0,
      daysRemaining: 0,
    },
    zenithRankCutoff: COMPETITIVE_CONFIG.zenithThresholdRank || 100,
    rewardsSummary: {
      zenith: 'Zenith Season 0 Title + Obsidian Crest',
      diamond: 'Diamond Frame + Exclusive Volt Theme',
      platinum: 'Platinum Athlete Badge + 1,500 Bonus XP',
      gold: 'Season 0 Gold Crest + Title',
      silver: 'Silver Competitor Badge',
      bronze: 'Season 0 Finisher Badge',
    },
  };

  private constructor() {
    this.recomputeSeasonTelemetry();
  }

  public static getInstance(): SeasonService {
    if (!SeasonService.instance) {
      SeasonService.instance = new SeasonService();
    }
    return SeasonService.instance;
  }

  /**
   * Recomputes remaining season days, current week (1-8), and exact UTC 0 weekly rollover.
   */
  private recomputeSeasonTelemetry(): void {
    const now = new Date();
    const nowUtcMs = now.getTime();
    const startUtcMs = new Date(this.currentSeason.startDate).getTime();
    const endUtcMs = new Date(this.currentSeason.endDate).getTime();

    // 1. Overall Season Days Remaining
    const diffDays = Math.max(0, Math.ceil((endUtcMs - nowUtcMs) / (1000 * 60 * 60 * 24)));
    this.currentSeason.daysRemaining = diffDays;

    // 2. Current Week in Season (1 through 8)
    const elapsedMs = Math.max(0, nowUtcMs - startUtcMs);
    const msInWeek = 7 * 24 * 60 * 60 * 1000;
    const computedWeek = Math.min(8, Math.max(1, Math.floor(elapsedMs / msInWeek) + 1));
    this.currentSeason.currentWeek = computedWeek;

    // 3. Weekly Zenith Rollover strictly at Sunday 23:59:59.999 UTC
    const utcDay = now.getUTCDay(); // 0 is Sunday, 1 is Monday ... 6 is Saturday
    const daysUntilSundayEnd = (7 - utcDay) % 7; // days to next Sunday

    const nextSundayUtc = new Date(Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate() + daysUntilSundayEnd,
      23, 59, 59, 999
    ));

    const msUntilWeeklyRollover = Math.max(0, nextSundayUtc.getTime() - nowUtcMs);
    const rolloverDays = Math.floor(msUntilWeeklyRollover / (1000 * 60 * 60 * 24));
    const rolloverHours = Math.floor((msUntilWeeklyRollover % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const rolloverMins = Math.floor((msUntilWeeklyRollover % (1000 * 60 * 60)) / (1000 * 60));

    this.currentSeason.weeklyRolloverUtc = {
      nextRolloverIso: nextSundayUtc.toISOString(),
      formattedCountdown: `${rolloverDays}d ${rolloverHours}h ${rolloverMins}m (UTC 0)`,
      hoursRemaining: Math.floor(msUntilWeeklyRollover / (1000 * 60 * 60)),
      daysRemaining: rolloverDays,
    };
  }

  public getCurrentSeason(): SeasonInfo {
    this.recomputeSeasonTelemetry();
    return this.currentSeason;
  }

  /**
   * Zenith Qualification Rule:
   * Any athlete who is within the Top 100 of their particular sport category
   * at the end of a week (Sunday 23:59:59 UTC) earns the Zenith Season (X) title.
   */
  public isZenithWeeklyEligible(rank?: number): boolean {
    if (!rank || rank <= 0) return false;
    return rank <= this.currentSeason.zenithRankCutoff;
  }

  /**
   * Generates official Zenith title for weekly top 100 qualifiers.
   */
  public getZenithWeeklyTitle(category?: string): string {
    const cat = category ? ` ${category.toUpperCase()}` : '';
    return `Zenith Season ${String(this.currentSeason.number).padStart(2, '0')}${cat}`;
  }

  /**
   * Returns promotion requirement and status for given division and tier.
   */
  public getTierThresholds(division: string): { basePr: number; prPerTier: number; color: string } {
    const div = COMPETITIVE_CONFIG.divisions.find(
      (d) => d.name.toUpperCase() === division.toUpperCase()
    );
    if (div) {
      return { basePr: div.basePr, prPerTier: div.prPerTier, color: div.color };
    }
    return { basePr: 0, prPerTier: 200, color: '#CD7F32' };
  }
}
