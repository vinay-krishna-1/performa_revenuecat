import AsyncStorage from '@react-native-async-storage/async-storage';
import { RouteItem, GhostData, ActivitySummary } from '../../types';
import { GhostEngine } from '../ghost/GhostEngine';
import { ActivityType } from '../../constants/config';

const STORAGE_CUSTOM_ROUTES_KEY = '@performa_custom_routes';
const STORAGE_SAVED_ROUTE_IDS_KEY = '@performa_saved_route_ids';

export const DEFAULT_ROUTES: RouteItem[] = [
  // Bengaluru (Local Home Base)
  {
    id: 'blr_sankey_tank_loop',
    title: 'Sankey Tank Perimeter Circuit',
    description: 'Scenic lakeside paved loop in Malleshwaram & Sadashivanagar with zero traffic and brisk water breezes.',
    distanceMeters: 3200,
    elevationGainMeters: 18,
    estimatedDurationSeconds: 960, // 16:00
    difficulty: 'EASY',
    activityType: 'RUN',
    city: 'Bengaluru',
    region: 'Karnataka, India',
    polyline: [
      { latitude: 13.0075, longitude: 77.5735 },
      { latitude: 13.0098, longitude: 77.5750 },
      { latitude: 13.0112, longitude: 77.5772 },
      { latitude: 13.0085, longitude: 77.5788 },
      { latitude: 13.0062, longitude: 77.5765 },
      { latitude: 13.0075, longitude: 77.5735 },
    ],
    attemptsCount: 785,
    recordHolderName: 'Malleshwaram Striders',
    recordTimeSeconds: 780, // 13:00
    communityRating: 5.0,
    isSaved: true,
  },
  {
    id: 'blr_cubbon_park_circuit',
    title: 'Cubbon Park Green Canopy 5K',
    description: 'Tree-lined historic park trail in the heart of Bengaluru. Fresh morning air, zero motorized traffic.',
    distanceMeters: 5000,
    elevationGainMeters: 35,
    estimatedDurationSeconds: 1560,
    difficulty: 'EASY',
    activityType: 'RUN',
    city: 'Bengaluru',
    region: 'Karnataka, India',
    polyline: [
      { latitude: 12.9763, longitude: 77.5929 },
      { latitude: 12.9790, longitude: 77.5900 },
      { latitude: 12.9815, longitude: 77.5925 },
      { latitude: 12.9785, longitude: 77.5960 },
      { latitude: 12.9763, longitude: 77.5929 },
    ],
    attemptsCount: 620,
    recordHolderName: 'Bangalore Pacers Club',
    recordTimeSeconds: 1165, // 19:25
    communityRating: 4.9,
    isSaved: true,
  },
  {
    id: 'blr_malleshwaram_heritage',
    title: 'Margosa Heritage 3K Sprint',
    description: 'Classic tree-covered avenue stretch from 18th Cross down Margosa Road past heritage landmarks.',
    distanceMeters: 3000,
    elevationGainMeters: 22,
    estimatedDurationSeconds: 900,
    difficulty: 'EASY',
    activityType: 'RUN',
    city: 'Bengaluru',
    region: 'Karnataka, India',
    polyline: [
      { latitude: 13.0110, longitude: 77.5680 },
      { latitude: 13.0060, longitude: 77.5695 },
      { latitude: 13.0005, longitude: 77.5710 },
      { latitude: 12.9960, longitude: 77.5720 },
    ],
    attemptsCount: 412,
    recordHolderName: 'North BLR Runners',
    recordTimeSeconds: 710, // 11:50
    communityRating: 4.8,
    isSaved: false,
  },
  {
    id: 'blr_kanteerava_cycling',
    title: 'Kanteerava Outer Veloway',
    description: 'Dedicated cycling loop around the stadium and Kasturba avenue with smooth tarmac and quick turnarounds.',
    distanceMeters: 12000,
    elevationGainMeters: 42,
    estimatedDurationSeconds: 1600,
    difficulty: 'MODERATE',
    activityType: 'CYCLE',
    city: 'Bengaluru',
    region: 'Karnataka, India',
    polyline: [
      { latitude: 12.9698, longitude: 77.5926 },
      { latitude: 12.9725, longitude: 77.5960 },
      { latitude: 12.9680, longitude: 77.6000 },
      { latitude: 12.9645, longitude: 77.5940 },
      { latitude: 12.9698, longitude: 77.5926 },
    ],
    attemptsCount: 380,
    recordHolderName: 'BLR Crank Masters',
    recordTimeSeconds: 1290, // 21:30
    communityRating: 4.7,
    isSaved: false,
  },
  // San Francisco
  {
    id: 'sf_embarcadero_5k',
    title: 'Embarcadero Pier 39 Sprint',
    description: 'Fast, flat paved seaside boulevard from the Ferry Building past Pier 39. Benchmark for 5K Personal Bests.',
    distanceMeters: 5000,
    elevationGainMeters: 14,
    estimatedDurationSeconds: 1380, // 23:00
    difficulty: 'EASY',
    activityType: 'RUN',
    city: 'San Francisco',
    region: 'California, USA',
    polyline: [
      { latitude: 37.7955, longitude: -122.3937 },
      { latitude: 37.8001, longitude: -122.3982 },
      { latitude: 37.8052, longitude: -122.4045 },
      { latitude: 37.8085, longitude: -122.4098 },
      { latitude: 37.8105, longitude: -122.4104 },
    ],
    attemptsCount: 842,
    recordHolderName: 'SF Harriers Pacer',
    recordTimeSeconds: 1062, // 17:42 5K
    communityRating: 4.9,
    isSaved: true,
  },
  {
    id: 'sf_twinpeaks_climb',
    title: 'Twin Peaks Anaerobic Climb',
    description: 'Challenging switchback climb with sweeping panoramic views of the Bay. Tests anaerobic threshold and leg drive.',
    distanceMeters: 6400,
    elevationGainMeters: 245,
    estimatedDurationSeconds: 2400,
    difficulty: 'HARD',
    activityType: 'RUN',
    city: 'San Francisco',
    region: 'California, USA',
    polyline: [
      { latitude: 37.7602, longitude: -122.4372 },
      { latitude: 37.7570, longitude: -122.4410 },
      { latitude: 37.7544, longitude: -122.4468 },
      { latitude: 37.7525, longitude: -122.4475 },
    ],
    attemptsCount: 298,
    recordHolderName: 'Ridge Runner Apex',
    recordTimeSeconds: 1695, // 28:15
    communityRating: 4.8,
    isSaved: false,
  },
  // New York
  {
    id: 'nyc_centralpark_loop',
    title: 'Central Park Full Loop',
    description: 'The iconic 6-mile perimeter drive with undulating rolling hills, Harlem Hill climb, and Cat Hill descent.',
    distanceMeters: 9800,
    elevationGainMeters: 88,
    estimatedDurationSeconds: 3100,
    difficulty: 'MODERATE',
    activityType: 'RUN',
    city: 'New York',
    region: 'New York, USA',
    polyline: [
      { latitude: 40.7681, longitude: -73.9818 },
      { latitude: 40.7745, longitude: -73.9740 },
      { latitude: 40.7850, longitude: -73.9682 },
      { latitude: 40.7960, longitude: -73.9580 },
      { latitude: 40.8005, longitude: -73.9582 },
      { latitude: 40.7960, longitude: -73.9680 },
      { latitude: 40.7750, longitude: -73.9810 },
      { latitude: 40.7681, longitude: -73.9818 },
    ],
    attemptsCount: 1420,
    recordHolderName: 'Gotham Striders',
    recordTimeSeconds: 2270, // 37:50
    communityRating: 5.0,
    isSaved: true,
  },
  {
    id: 'nyc_brooklyn_bridge',
    title: 'Brooklyn Bridge Sunrise Dash',
    description: 'High-energy pedestrian span connecting Manhattan to Brooklyn over the East River with brisk skyline winds.',
    distanceMeters: 3600,
    elevationGainMeters: 32,
    estimatedDurationSeconds: 1100,
    difficulty: 'EASY',
    activityType: 'RUN',
    city: 'New York',
    region: 'New York, USA',
    polyline: [
      { latitude: 40.7126, longitude: -74.0044 },
      { latitude: 40.7088, longitude: -73.9996 },
      { latitude: 40.7045, longitude: -73.9942 },
      { latitude: 40.7001, longitude: -73.9902 },
    ],
    attemptsCount: 654,
    recordHolderName: 'Empire Pacer',
    recordTimeSeconds: 858, // 14:18
    communityRating: 4.7,
    isSaved: false,
  },
  // London
  {
    id: 'london_thames_path',
    title: 'Thames Southbank Fast Track',
    description: 'Riverside asphalt path passing the London Eye, Tate Modern, and Tower Bridge. Completely flat sprint stretch.',
    distanceMeters: 7200,
    elevationGainMeters: 18,
    estimatedDurationSeconds: 2200,
    difficulty: 'MODERATE',
    activityType: 'RUN',
    city: 'London',
    region: 'Greater London, UK',
    polyline: [
      { latitude: 51.5033, longitude: -0.1195 },
      { latitude: 51.5065, longitude: -0.1130 },
      { latitude: 51.5075, longitude: -0.1030 },
      { latitude: 51.5080, longitude: -0.0920 },
      { latitude: 51.5055, longitude: -0.0754 },
    ],
    attemptsCount: 780,
    recordHolderName: 'Westminster Pacesetter',
    recordTimeSeconds: 1600, // 26:40
    communityRating: 4.8,
    isSaved: false,
  },
  {
    id: 'london_hydepark_5k',
    title: 'Hyde Park Serpentine 5K',
    description: 'Lush park paths tracing around the Serpentine Lake and Diana Memorial. London runner staple circuit.',
    distanceMeters: 5000,
    elevationGainMeters: 22,
    estimatedDurationSeconds: 1500,
    difficulty: 'EASY',
    activityType: 'RUN',
    city: 'London',
    region: 'Greater London, UK',
    polyline: [
      { latitude: 51.5074, longitude: -0.1656 },
      { latitude: 51.5040, longitude: -0.1700 },
      { latitude: 51.5020, longitude: -0.1620 },
      { latitude: 51.5070, longitude: -0.1540 },
      { latitude: 51.5074, longitude: -0.1656 },
    ],
    attemptsCount: 910,
    recordHolderName: 'Royal Park Harriers',
    recordTimeSeconds: 1092, // 18:12
    communityRating: 4.9,
    isSaved: true,
  },
  // Tokyo
  {
    id: 'tokyo_imperial_palace',
    title: 'Imperial Palace Kokyo Loop 5K',
    description: 'Japan\'s premier running mecca. Continuous 5K moat circuit around the Edo Castle grounds with no stoplights.',
    distanceMeters: 5000,
    elevationGainMeters: 28,
    estimatedDurationSeconds: 1450,
    difficulty: 'EASY',
    activityType: 'RUN',
    city: 'Tokyo',
    region: 'Tokyo, Japan',
    polyline: [
      { latitude: 35.6852, longitude: 139.7528 },
      { latitude: 35.6890, longitude: 139.7490 },
      { latitude: 35.6920, longitude: 139.7510 },
      { latitude: 35.6860, longitude: 139.7580 },
      { latitude: 35.6852, longitude: 139.7528 },
    ],
    attemptsCount: 1680,
    recordHolderName: 'Kokyo Runners Syndicate',
    recordTimeSeconds: 1075, // 17:55
    communityRating: 5.0,
    isSaved: true,
  },
  {
    id: 'tokyo_odaiba_coastal',
    title: 'Odaiba Seaside Cycling Highway',
    description: 'Wide futuristic waterfront trail with Tokyo Bay breeze and views of the Rainbow Bridge.',
    distanceMeters: 14500,
    elevationGainMeters: 30,
    estimatedDurationSeconds: 2100,
    difficulty: 'MODERATE',
    activityType: 'CYCLE',
    city: 'Tokyo',
    region: 'Tokyo, Japan',
    polyline: [
      { latitude: 35.6280, longitude: 139.7760 },
      { latitude: 35.6320, longitude: 139.7820 },
      { latitude: 35.6360, longitude: 139.7880 },
      { latitude: 35.6410, longitude: 139.7840 },
    ],
    attemptsCount: 440,
    recordHolderName: 'Tokyo Velo Ghost',
    recordTimeSeconds: 1540,
    communityRating: 4.8,
    isSaved: false,
  },
];

export class RouteService {
  private static instance: RouteService;

  public static getInstance(): RouteService {
    if (!RouteService.instance) {
      RouteService.instance = new RouteService();
    }
    return RouteService.instance;
  }

  /**
   * Retrieves saved route IDs from persistent storage.
   */
  public async getSavedRouteIds(): Promise<string[]> {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_SAVED_ROUTE_IDS_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
      // Seed default saved IDs
      const defaults = DEFAULT_ROUTES.filter((r) => r.isSaved).map((r) => r.id);
      await AsyncStorage.setItem(STORAGE_SAVED_ROUTE_IDS_KEY, JSON.stringify(defaults));
      return defaults;
    } catch {
      return ['sf_embarcadero_5k', 'nyc_centralpark_loop', 'blr_cubbon_park_circuit', 'tokyo_imperial_palace'];
    }
  }

  /**
   * Toggles bookmark/saved status for a route.
   */
  public async toggleSaveRoute(routeId: string): Promise<boolean> {
    try {
      const savedIds = await this.getSavedRouteIds();
      let updatedIds: string[];
      let isSaved: boolean;
      if (savedIds.includes(routeId)) {
        updatedIds = savedIds.filter((id) => id !== routeId);
        isSaved = false;
      } else {
        updatedIds = [routeId, ...savedIds];
        isSaved = true;
      }
      await AsyncStorage.setItem(STORAGE_SAVED_ROUTE_IDS_KEY, JSON.stringify(updatedIds));
      return isSaved;
    } catch (e) {
      console.warn('[RouteService] Failed to toggle saved route:', e);
      return false;
    }
  }

  /**
   * Fetches all routes including persistent user custom created routes and applies saved status.
   */
  public async getAllRoutes(): Promise<RouteItem[]> {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_CUSTOM_ROUTES_KEY);
      const customRoutes: RouteItem[] = stored ? JSON.parse(stored) : [];
      const savedIds = await this.getSavedRouteIds();
      const combined = [...customRoutes, ...DEFAULT_ROUTES];

      return combined.map((r) => ({
        ...r,
        isSaved: savedIds.includes(r.id),
      }));
    } catch (e) {
      console.warn('[RouteService] Failed to load routes:', e);
      return DEFAULT_ROUTES;
    }
  }

  /**
   * Finds a specific route by ID.
   */
  public async getRouteById(id: string): Promise<RouteItem | undefined> {
    const routes = await this.getAllRoutes();
    return routes.find((r) => r.id === id);
  }

  /**
   * Saves a completed activity session as a new community or personal route.
   */
  public async saveActivityAsRoute(
    title: string,
    summary: ActivitySummary,
    description: string = 'Custom athlete created route'
  ): Promise<RouteItem> {
    const newRoute: RouteItem = {
      id: `route_${Date.now()}`,
      title,
      description,
      distanceMeters: summary.distanceMeters,
      elevationGainMeters: summary.elevationGainMeters || 12,
      estimatedDurationSeconds: summary.movingSeconds,
      difficulty: summary.elevationGainMeters > 100 ? 'HARD' : 'MODERATE',
      activityType: summary.type,
      polyline: summary.routeCoordinates,
      attemptsCount: 1,
      recordHolderName: 'You',
      recordTimeSeconds: summary.movingSeconds,
      communityRating: 5.0,
      isSaved: true,
      isCreatedByUser: true,
    };

    try {
      const stored = await AsyncStorage.getItem(STORAGE_CUSTOM_ROUTES_KEY);
      const customRoutes: RouteItem[] = stored ? JSON.parse(stored) : [];
      customRoutes.unshift(newRoute);
      await AsyncStorage.setItem(STORAGE_CUSTOM_ROUTES_KEY, JSON.stringify(customRoutes));
      // Also register as saved
      await this.toggleSaveRoute(newRoute.id);
    } catch (e) {
      console.warn('[RouteService] Failed to save route:', e);
    }

    return newRoute;
  }

  /**
   * Saves a newly drawn custom waypoint route.
   */
  public async createCustomWaypointRoute(data: {
    title: string;
    description: string;
    activityType: ActivityType;
    difficulty: 'EASY' | 'MODERATE' | 'HARD';
    waypoints: { latitude: number; longitude: number }[];
    distanceMeters: number;
    elevationGainMeters: number;
    estimatedDurationSeconds: number;
    city?: string;
    isPrivate?: boolean;
  }): Promise<RouteItem> {
    const newRoute: RouteItem = {
      id: `custom_route_${Date.now()}`,
      title: data.title || 'Custom Track',
      description: data.description || 'Custom athlete-created circuit',
      distanceMeters: Math.max(100, Math.round(data.distanceMeters)),
      elevationGainMeters: Math.max(2, Math.round(data.elevationGainMeters)),
      estimatedDurationSeconds: Math.max(60, Math.round(data.estimatedDurationSeconds)),
      difficulty: data.difficulty,
      activityType: data.activityType,
      city: data.city || 'Custom',
      polyline: data.waypoints,
      attemptsCount: 0,
      recordHolderName: '',
      recordTimeSeconds: 0,
      communityRating: 5.0,
      isSaved: true,
      isCreatedByUser: true,
      isPrivate: !!data.isPrivate,
    };

    try {
      const stored = await AsyncStorage.getItem(STORAGE_CUSTOM_ROUTES_KEY);
      const customRoutes: RouteItem[] = stored ? JSON.parse(stored) : [];
      customRoutes.unshift(newRoute);
      await AsyncStorage.setItem(STORAGE_CUSTOM_ROUTES_KEY, JSON.stringify(customRoutes));
      // Also register as saved
      const savedIds = await this.getSavedRouteIds();
      if (!savedIds.includes(newRoute.id)) {
        await AsyncStorage.setItem(STORAGE_SAVED_ROUTE_IDS_KEY, JSON.stringify([newRoute.id, ...savedIds]));
      }
    } catch (e) {
      console.warn('[RouteService] Failed to save custom waypoint route:', e);
    }

    return newRoute;
  }

  /**
   * Publishes a private custom route to the public community.
   */
  public async publishRoute(routeId: string): Promise<boolean> {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_CUSTOM_ROUTES_KEY);
      if (!stored) return false;
      const customRoutes: RouteItem[] = JSON.parse(stored);
      let updated = false;
      const newRoutes = customRoutes.map((r) => {
        if (r.id === routeId) {
          updated = true;
          return { ...r, isPrivate: false };
        }
        return r;
      });
      if (updated) {
        await AsyncStorage.setItem(STORAGE_CUSTOM_ROUTES_KEY, JSON.stringify(newRoutes));
        return true;
      }
      return false;
    } catch (e) {
      console.warn('[RouteService] Failed to publish route:', e);
      return false;
    }
  }

  /**
   * Generates a high-precision GhostData object from a RouteItem's course record.
   */
  public createGhostFromRoute(route: RouteItem): GhostData {
    const checkpoints: GhostData['checkpoints'] = [];
    const totalDist = route.distanceMeters;
    const totalSec = route.recordTimeSeconds;
    const intervalMeters = 50;
    const numIntervals = Math.max(1, Math.floor(totalDist / intervalMeters));

    for (let i = 1; i <= numIntervals; i++) {
      const dist = i * intervalMeters;
      const frac = dist / totalDist;
      const elapsed = Math.round(totalSec * frac);

      let coord = { latitude: 37.7749, longitude: -122.4194 };
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
      id: `ghost_${route.id}`,
      routeId: route.id,
      activityId: `record_${route.id}`,
      athleteName: route.recordHolderName,
      activityType: route.activityType,
      totalDistanceMeters: totalDist,
      totalDurationSeconds: totalSec,
      checkpoints,
    };
  }
}
