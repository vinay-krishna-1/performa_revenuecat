import { LocationPoint, GPSQualityScore } from '../../types';
import { ActivityType, RECORDING_CONFIG } from '../../constants/config';

export class GPSQualityFilter {
  private lastValidPoint: LocationPoint | null = null;
  private stationaryAnchor: LocationPoint | null = null;
  private isMoving: boolean = false;
  private consecutiveMovementSamples: number = 0;
  private consecutiveStopSamples: number = 0;

  public reset() {
    this.lastValidPoint = null;
    this.stationaryAnchor = null;
    this.isMoving = false;
    this.consecutiveMovementSamples = 0;
    this.consecutiveStopSamples = 0;
  }

  /**
   * Calculates Haversine distance between two coordinates in meters.
   */
  public static calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371000; // Radius of Earth in meters
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Evaluates accuracy metadata and returns a subtle quality score.
   */
  public evaluateSignal(accuracy?: number): GPSQualityScore {
    if (!accuracy || accuracy <= 0) return 'NONE';
    if (accuracy <= 8) return 'EXCELLENT';
    if (accuracy <= 18) return 'GOOD';
    return 'WEAK';
  }

  /**
   * Filters out impossible jumps, teleportation, indoor multipath drift, and stationary jitter.
   */
  public filterPoint(
    point: LocationPoint,
    activityType: ActivityType
  ): { isValid: boolean; filteredPoint?: LocationPoint; deltaDistanceMeters: number } {
    // 1. Accuracy check - reject high uncertainty noise
    if (point.accuracy && point.accuracy > RECORDING_CONFIG.maxAccuracyMeters) {
      return { isValid: false, deltaDistanceMeters: 0 };
    }

    // First reading initializes the stationary anchor and starting position
    if (!this.lastValidPoint) {
      this.lastValidPoint = point;
      this.stationaryAnchor = point;
      this.isMoving = false;
      this.consecutiveMovementSamples = 0;
      this.consecutiveStopSamples = 0;
      return { isValid: true, filteredPoint: point, deltaDistanceMeters: 0 };
    }

    const timeDeltaSeconds = (point.timestamp - this.lastValidPoint.timestamp) / 1000;

    // Discard duplicate or backwards timestamps
    if (timeDeltaSeconds <= 0.2) {
      return { isValid: false, deltaDistanceMeters: 0 };
    }

    const distanceFromLast = GPSQualityFilter.calculateDistance(
      this.lastValidPoint.latitude,
      this.lastValidPoint.longitude,
      point.latitude,
      point.longitude
    );

    const calculatedSpeedMps = distanceFromLast / timeDeltaSeconds;
    const maxAllowedSpeed = RECORDING_CONFIG.maxSpeedMps[activityType] || 15.0;

    // 2. Reject speed exceeding physical human limit
    if (calculatedSpeedMps > maxAllowedSpeed) {
      return { isValid: false, deltaDistanceMeters: 0 };
    }

    // 3. Stationary Deadband Anchor & Movement Gate
    // Human walking speed is ~1.1 m/s, running >= 2.0 m/s, cycling >= 3.0 m/s.
    // Indoor GPS multipath drifts 2-6m with low reported speed.
    const minSpeedThreshold = activityType === 'CYCLE' ? 1.2 : activityType === 'RUN' ? 0.9 : 0.7;
    const reportedSpeed = point.speed !== undefined && point.speed >= 0 ? point.speed : calculatedSpeedMps;

    const anchorDistance = this.stationaryAnchor
      ? GPSQualityFilter.calculateDistance(
          this.stationaryAnchor.latitude,
          this.stationaryAnchor.longitude,
          point.latitude,
          point.longitude
        )
      : distanceFromLast;

    const movementRadiusThreshold = Math.max(6.5, (point.accuracy || 8) * 0.75);

    if (!this.isMoving) {
      // User is STATIONARY (sitting indoors, standing at the start line)
      const hasSufficientDisplacement = anchorDistance >= movementRadiusThreshold;
      const hasSufficientSpeed = reportedSpeed >= minSpeedThreshold && calculatedSpeedMps >= minSpeedThreshold * 0.65;

      if (hasSufficientDisplacement && hasSufficientSpeed) {
        this.consecutiveMovementSamples++;
        if (this.consecutiveMovementSamples >= 2) {
          // True movement confirmed: exit stationary anchor
          this.isMoving = true;
          this.consecutiveStopSamples = 0;
          this.lastValidPoint = {
            ...point,
            speed: reportedSpeed,
          };
          return { isValid: true, filteredPoint: this.lastValidPoint, deltaDistanceMeters: anchorDistance };
        }
        return { isValid: false, deltaDistanceMeters: 0 };
      } else {
        // Still stationary indoors: suppress drift, reset movement samples, smooth anchor
        this.consecutiveMovementSamples = 0;
        if (this.stationaryAnchor) {
          this.stationaryAnchor = {
            latitude: this.stationaryAnchor.latitude * 0.85 + point.latitude * 0.15,
            longitude: this.stationaryAnchor.longitude * 0.85 + point.longitude * 0.15,
            timestamp: point.timestamp,
            accuracy: point.accuracy,
          };
        }
        return { isValid: false, deltaDistanceMeters: 0 };
      }
    } else {
      // User is IN MOTION
      const isStopped = reportedSpeed < 0.5 && calculatedSpeedMps < 0.5;
      if (isStopped) {
        this.consecutiveStopSamples++;
        if (this.consecutiveStopSamples >= 2) {
          // User came to a stop
          this.isMoving = false;
          this.stationaryAnchor = point;
          this.consecutiveMovementSamples = 0;
          return { isValid: false, deltaDistanceMeters: 0 };
        }
        return { isValid: false, deltaDistanceMeters: 0 };
      }

      this.consecutiveStopSamples = 0;

      // 4. Acceleration sanity check
      const lastSpeed = this.lastValidPoint.speed || 0;
      const acceleration = Math.abs(calculatedSpeedMps - lastSpeed) / timeDeltaSeconds;
      if (acceleration > RECORDING_CONFIG.maxAccelerationMps2 && calculatedSpeedMps > 5.0) {
        return { isValid: false, deltaDistanceMeters: 0 };
      }

      // Point accepted in active motion
      this.lastValidPoint = {
        ...point,
        speed: reportedSpeed,
      };

      return { isValid: true, filteredPoint: this.lastValidPoint, deltaDistanceMeters: distanceFromLast };
    }
  }
}
