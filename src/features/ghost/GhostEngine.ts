import { GhostData, ActivitySummary, RouteItem } from '../../types';
import { ActivityType } from '../../constants/config';

export class GhostEngine {
  /**
   * Converts a recorded activity into a normalized GhostData object
   * with distance checkpoints (every 50 meters) for asynchronous comparison.
   */
  public static createGhostFromActivity(
    activity: ActivitySummary,
    athleteName: string
  ): GhostData {
    const checkpoints: GhostData['checkpoints'] = [];
    const totalDist = activity.distanceMeters;
    const totalSec = activity.movingSeconds;

    // Generate normalized distance intervals every 50 meters
    const intervalMeters = 50;
    const numIntervals = Math.max(1, Math.floor(totalDist / intervalMeters));

    for (let i = 1; i <= numIntervals; i++) {
      const dist = i * intervalMeters;
      const frac = dist / totalDist;
      const elapsed = Math.round(totalSec * frac);

      // Interpolate coordinates from activity route coordinates if available
      const coordIndex = Math.min(
        Math.floor(frac * activity.routeCoordinates.length),
        activity.routeCoordinates.length - 1
      );
      const coord = activity.routeCoordinates[coordIndex] || { latitude: 0, longitude: 0 };

      checkpoints.push({
        distanceMeters: dist,
        elapsedSeconds: elapsed,
        latitude: coord.latitude,
        longitude: coord.longitude,
      });
    }

    return {
      id: `ghost_${activity.id}`,
      activityId: activity.id,
      athleteName,
      activityType: activity.type,
      totalDistanceMeters: totalDist,
      totalDurationSeconds: totalSec,
      checkpoints,
    };
  }

  /**
   * Generates a GhostData object simulating an exact target pace along a given route.
   */
  public static createTargetPaceGhost(
    route: RouteItem,
    targetPaceSecondsPerKm: number,
    label: string = 'Target Pacemaker'
  ): GhostData {
    const totalDist = route.distanceMeters;
    const totalSec = Math.round((totalDist / 1000) * targetPaceSecondsPerKm);
    const intervalMeters = 50;
    const numIntervals = Math.max(1, Math.floor(totalDist / intervalMeters));
    const checkpoints: GhostData['checkpoints'] = [];

    for (let i = 1; i <= numIntervals; i++) {
      const dist = i * intervalMeters;
      const frac = dist / totalDist;
      const elapsed = Math.round(totalSec * frac);

      let coord = { latitude: 0, longitude: 0 };
      if (route.polyline && route.polyline.length > 0) {
        const coordIndex = Math.min(
          Math.floor(frac * route.polyline.length),
          route.polyline.length - 1
        );
        coord = route.polyline[coordIndex];
      }

      checkpoints.push({
        distanceMeters: dist,
        elapsedSeconds: elapsed,
        latitude: coord.latitude,
        longitude: coord.longitude,
      });
    }

    return {
      id: `target_pacer_${route.id}_${targetPaceSecondsPerKm}`,
      routeId: route.id,
      activityId: `pacer_${targetPaceSecondsPerKm}`,
      athleteName: label,
      activityType: route.activityType,
      totalDistanceMeters: totalDist,
      totalDurationSeconds: totalSec,
      checkpoints,
    };
  }

  /**
   * Compares the user's current progress against the ghost opponent
   * using distance normalization (immune to GPS drift / missing points).
   */
  public static calculateGhostDelta(
    ghost: GhostData,
    userDistanceMeters: number,
    userMovingSeconds: number
  ): {
    deltaSeconds: number; // positive = user ahead, negative = user behind
    isUserWinning: boolean;
    ghostElapsedAtDistance: number;
    distanceAheadMeters: number;
  } {
    if (ghost.checkpoints.length === 0 || userDistanceMeters <= 0) {
      return {
        deltaSeconds: 0,
        isUserWinning: true,
        ghostElapsedAtDistance: 0,
        distanceAheadMeters: 0,
      };
    }

    // Find the closest checkpoint by distance
    let closestCp = ghost.checkpoints[0];
    let minDiff = Math.abs(closestCp.distanceMeters - userDistanceMeters);

    for (const cp of ghost.checkpoints) {
      const diff = Math.abs(cp.distanceMeters - userDistanceMeters);
      if (diff < minDiff) {
        minDiff = diff;
        closestCp = cp;
      }
    }

    // Delta = Ghost time - User time
    // If ghost took 300s at 1km and user took 270s, delta is +30s (user is ahead!)
    const deltaSeconds = closestCp.elapsedSeconds - userMovingSeconds;
    const isUserWinning = deltaSeconds >= 0;

    // Approximate meter distance lead based on average speed
    const userSpeedMps = userMovingSeconds > 0 ? userDistanceMeters / userMovingSeconds : 3.0;
    const distanceAheadMeters = Math.round(deltaSeconds * userSpeedMps);

    return {
      deltaSeconds,
      isUserWinning,
      ghostElapsedAtDistance: closestCp.elapsedSeconds,
      distanceAheadMeters,
    };
  }

  /**
   * Returns the exact interpolated geographic coordinate of the Ghost
   * at the user's current elapsed workout time.
   */
  public static getGhostCoordinateAtElapsedSeconds(
    ghost: GhostData,
    elapsedSeconds: number
  ): { latitude: number; longitude: number } | null {
    if (!ghost || !ghost.checkpoints || ghost.checkpoints.length === 0) {
      return null;
    }

    const cps = ghost.checkpoints;

    // If runner hasn't started or elapsed time is 0
    if (elapsedSeconds <= 0) {
      return { latitude: cps[0].latitude, longitude: cps[0].longitude };
    }

    // If ghost has completed the full course
    if (elapsedSeconds >= ghost.totalDurationSeconds) {
      const last = cps[cps.length - 1];
      return { latitude: last.latitude, longitude: last.longitude };
    }

    // Find the segment [cpA, cpB] containing elapsedSeconds
    for (let i = 0; i < cps.length - 1; i++) {
      const cpA = cps[i];
      const cpB = cps[i + 1];

      if (elapsedSeconds >= cpA.elapsedSeconds && elapsedSeconds <= cpB.elapsedSeconds) {
        const timeDiff = cpB.elapsedSeconds - cpA.elapsedSeconds;
        const frac = timeDiff > 0 ? (elapsedSeconds - cpA.elapsedSeconds) / timeDiff : 0;

        const lat = cpA.latitude + frac * (cpB.latitude - cpA.latitude);
        const lng = cpA.longitude + frac * (cpB.longitude - cpA.longitude);

        return { latitude: lat, longitude: lng };
      }
    }

    const last = cps[cps.length - 1];
    return { latitude: last.latitude, longitude: last.longitude };
  }

  /**
   * Returns how many meters the ghost had covered at a given elapsed time.
   */
  public static getGhostDistanceAtElapsedSeconds(
    ghost: GhostData,
    elapsedSeconds: number
  ): number {
    if (!ghost || !ghost.checkpoints || ghost.checkpoints.length === 0) return 0;
    if (elapsedSeconds <= 0) return 0;
    if (elapsedSeconds >= ghost.totalDurationSeconds) return ghost.totalDistanceMeters;

    const cps = ghost.checkpoints;
    for (let i = 0; i < cps.length - 1; i++) {
      const cpA = cps[i];
      const cpB = cps[i + 1];

      if (elapsedSeconds >= cpA.elapsedSeconds && elapsedSeconds <= cpB.elapsedSeconds) {
        const timeDiff = cpB.elapsedSeconds - cpA.elapsedSeconds;
        const frac = timeDiff > 0 ? (elapsedSeconds - cpA.elapsedSeconds) / timeDiff : 0;
        return cpA.distanceMeters + frac * (cpB.distanceMeters - cpA.distanceMeters);
      }
    }

    return ghost.totalDistanceMeters;
  }
}
