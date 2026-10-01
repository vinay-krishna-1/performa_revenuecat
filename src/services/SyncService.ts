import AsyncStorage from '@react-native-async-storage/async-storage';
import { ActivitySummary } from '../types';
import { SupabaseService, isSupabaseConfigured } from './supabase';

export type SyncState = 'IDLE' | 'SYNCING' | 'SYNCED' | 'OFFLINE' | 'ERROR';

export interface SyncStatusInfo {
  state: SyncState;
  pendingCount: number;
  lastSyncTime: number | null;
  errorMessage?: string;
}

type SyncListener = (info: SyncStatusInfo) => void;

const STORAGE_QUEUE_KEY = '@performa_activities_queue';
const STORAGE_PERMANENT_KEY = '@performa_all_activities';
const STORAGE_SYNCED_IDS_KEY = '@performa_synced_ids';
const STORAGE_LAST_SYNC_KEY = '@performa_last_sync_time';

export class SyncService {
  private static instance: SyncService;
  private state: SyncState = 'IDLE';
  private pendingCount: number = 0;
  private lastSyncTime: number | null = null;
  private errorMessage?: string;
  private listeners: Set<SyncListener> = new Set();
  private isProcessing: boolean = false;

  private constructor() {
    this.initialize();
  }

  public static getInstance(): SyncService {
    if (!SyncService.instance) {
      SyncService.instance = new SyncService();
    }
    return SyncService.instance;
  }

  private async initialize() {
    try {
      const [queueData, lastSyncData] = await Promise.all([
        AsyncStorage.getItem(STORAGE_QUEUE_KEY),
        AsyncStorage.getItem(STORAGE_LAST_SYNC_KEY),
      ]);

      const queue: ActivitySummary[] = queueData ? JSON.parse(queueData) : [];
      this.pendingCount = queue.length;
      this.lastSyncTime = lastSyncData ? parseInt(lastSyncData, 10) : null;

      if (!isSupabaseConfigured()) {
        this.state = 'OFFLINE';
      } else {
        this.state = this.pendingCount === 0 ? 'SYNCED' : 'IDLE';
      }

      this.notifyListeners();

      // Automatically attempt initial drain if configured and items pending
      if (isSupabaseConfigured() && this.pendingCount > 0) {
        this.syncPending();
      }
    } catch (e) {
      console.warn('[SyncService] Failed to initialize queue status:', e);
    }
  }

  public getStatusInfo(): SyncStatusInfo {
    return {
      state: this.state,
      pendingCount: this.pendingCount,
      lastSyncTime: this.lastSyncTime,
      errorMessage: this.errorMessage,
    };
  }

  public subscribe(listener: SyncListener): () => void {
    this.listeners.add(listener);
    // Immediately invoke with current state
    listener(this.getStatusInfo());
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners() {
    const info = this.getStatusInfo();
    this.listeners.forEach((listener) => {
      try {
        listener(info);
      } catch (err) {
        console.warn('[SyncService] Listener notification error:', err);
      }
    });
  }

  /**
   * Adds a newly completed activity to the local offline queue and triggers sync.
   */
  public async enqueueActivity(activity: ActivitySummary): Promise<void> {
    try {
      // 1. Permanently store in local archive so it is never lost
      const existingAllStr = await AsyncStorage.getItem(STORAGE_PERMANENT_KEY);
      const allActivities: ActivitySummary[] = existingAllStr ? JSON.parse(existingAllStr) : [];
      if (!allActivities.some((item) => item.id === activity.id)) {
        allActivities.unshift(activity);
        await AsyncStorage.setItem(STORAGE_PERMANENT_KEY, JSON.stringify(allActivities));
      }

      // 2. Queue for Supabase cloud sync
      const existingQueueStr = await AsyncStorage.getItem(STORAGE_QUEUE_KEY);
      const queue: ActivitySummary[] = existingQueueStr ? JSON.parse(existingQueueStr) : [];

      const exists = queue.some((item) => item.id === activity.id);
      if (!exists) {
        queue.unshift(activity);
        await AsyncStorage.setItem(STORAGE_QUEUE_KEY, JSON.stringify(queue));
      }

      this.pendingCount = queue.length;
      this.notifyListeners();

      // Trigger background sync attempt
      this.syncPending();
    } catch (e: any) {
      console.error('[SyncService] Error enqueuing activity:', e);
    }
  }

  /**
   * Returns all activities: merges local permanent storage with Supabase cloud activities.
   */
  public async getAllActivities(userId?: string): Promise<ActivitySummary[]> {
    try {
      const localStr = await AsyncStorage.getItem(STORAGE_PERMANENT_KEY);
      let activities: ActivitySummary[] = localStr ? JSON.parse(localStr) : [];

      // If Supabase is configured, fetch latest from cloud and merge
      if (isSupabaseConfigured()) {
        try {
          const cloudActivities = await SupabaseService.getInstance().fetchUserActivities(userId);
          if (cloudActivities.length > 0) {
            const map = new Map<string, ActivitySummary>();
            // Add cloud activities
            cloudActivities.forEach((act) => map.set(act.id, act));
            // Add local activities (preserves newly saved or unsynced sessions)
            activities.forEach((act) => map.set(act.id, act));
            activities = Array.from(map.values()).sort((a, b) => b.startTime - a.startTime);
            await AsyncStorage.setItem(STORAGE_PERMANENT_KEY, JSON.stringify(activities));
          }
        } catch (cloudErr) {
          console.warn('[SyncService] Cloud fetch failed, using local activities:', cloudErr);
        }
      }

      return activities;
    } catch (e) {
      console.warn('[SyncService] Error retrieving all activities:', e);
      return [];
    }
  }

  /**
   * Processes all pending activities in the local queue and syncs them to Supabase.
   */
  public async syncPending(): Promise<{ syncedCount: number; errors: string[] }> {
    if (this.isProcessing) {
      return { syncedCount: 0, errors: ['Sync already in progress'] };
    }

    if (!isSupabaseConfigured()) {
      this.state = 'OFFLINE';
      this.notifyListeners();
      return { syncedCount: 0, errors: ['Supabase not configured (Local Mode)'] };
    }

    this.isProcessing = true;
    this.state = 'SYNCING';
    this.errorMessage = undefined;
    this.notifyListeners();

    let syncedCount = 0;
    const errors: string[] = [];

    try {
      const queueStr = await AsyncStorage.getItem(STORAGE_QUEUE_KEY);
      let queue: ActivitySummary[] = queueStr ? JSON.parse(queueStr) : [];

      const syncedIdsStr = await AsyncStorage.getItem(STORAGE_SYNCED_IDS_KEY);
      const syncedIds: string[] = syncedIdsStr ? JSON.parse(syncedIdsStr) : [];

      const remainingQueue: ActivitySummary[] = [];

      for (const activity of queue) {
        const result = await SupabaseService.getInstance().syncActivity(activity, activity.userId);

        if (result.success) {
          syncedCount++;
          if (!syncedIds.includes(activity.id)) {
            syncedIds.push(activity.id);
          }
        } else {
          // Keep in queue for next sync attempt
          remainingQueue.push(activity);
          if (result.error) errors.push(result.error);
        }
      }

      await Promise.all([
        AsyncStorage.setItem(STORAGE_QUEUE_KEY, JSON.stringify(remainingQueue)),
        AsyncStorage.setItem(STORAGE_SYNCED_IDS_KEY, JSON.stringify(syncedIds)),
      ]);

      this.pendingCount = remainingQueue.length;
      this.lastSyncTime = Date.now();
      await AsyncStorage.setItem(STORAGE_LAST_SYNC_KEY, this.lastSyncTime.toString());

      if (remainingQueue.length === 0) {
        this.state = 'SYNCED';
      } else {
        this.state = errors.length > 0 ? 'ERROR' : 'OFFLINE';
        this.errorMessage = errors[0];
      }
    } catch (e: any) {
      console.warn('[SyncService] Sync failure:', e);
      this.state = 'ERROR';
      this.errorMessage = e.message || 'Network sync error';
      errors.push(this.errorMessage!);
    } finally {
      this.isProcessing = false;
      this.notifyListeners();
    }

    return { syncedCount, errors };
  }

  /**
   * Checks whether a specific activity ID is already marked as synced to Supabase.
   */
  public async isActivitySynced(activityId: string): Promise<boolean> {
    try {
      const syncedIdsStr = await AsyncStorage.getItem(STORAGE_SYNCED_IDS_KEY);
      if (!syncedIdsStr) return false;
      const ids: string[] = JSON.parse(syncedIdsStr);
      return ids.includes(activityId);
    } catch {
      return false;
    }
  }

  /**
   * Deletes an activity permanently from local storage and Supabase cloud.
   */
  public async deleteActivity(activityId: string): Promise<boolean> {
    try {
      // 1. Remove from permanent local storage
      const localStr = await AsyncStorage.getItem(STORAGE_PERMANENT_KEY);
      if (localStr) {
        const activities: ActivitySummary[] = JSON.parse(localStr);
        const filtered = activities.filter((act) => act.id !== activityId);
        await AsyncStorage.setItem(STORAGE_PERMANENT_KEY, JSON.stringify(filtered));
      }

      // 2. Remove from pending queue if present
      const queueStr = await AsyncStorage.getItem(STORAGE_QUEUE_KEY);
      if (queueStr) {
        const queue: ActivitySummary[] = JSON.parse(queueStr);
        const filteredQueue = queue.filter((act) => act.id !== activityId);
        await AsyncStorage.setItem(STORAGE_QUEUE_KEY, JSON.stringify(filteredQueue));
        this.pendingCount = filteredQueue.length;
      }

      // 3. Remove from synced IDs list
      const syncedIdsStr = await AsyncStorage.getItem(STORAGE_SYNCED_IDS_KEY);
      if (syncedIdsStr) {
        const syncedIds: string[] = JSON.parse(syncedIdsStr);
        const filteredIds = syncedIds.filter((id) => id !== activityId);
        await AsyncStorage.setItem(STORAGE_SYNCED_IDS_KEY, JSON.stringify(filteredIds));
      }

      // 4. Delete from Supabase cloud if online
      if (isSupabaseConfigured()) {
        await SupabaseService.getInstance().deleteUserActivity(activityId);
      }

      this.notifyListeners();
      return true;
    } catch (e) {
      console.error('[SyncService] Error deleting activity:', e);
      return false;
    }
  }

  /**
   * Updates an existing activity (e.g. title, description).
   */
  public async updateActivity(activityId: string, updates: Partial<ActivitySummary>): Promise<boolean> {
    try {
      const localStr = await AsyncStorage.getItem(STORAGE_PERMANENT_KEY);
      if (localStr) {
        const activities: ActivitySummary[] = JSON.parse(localStr);
        const updated = activities.map((act) =>
          act.id === activityId ? { ...act, ...updates } : act
        );
        await AsyncStorage.setItem(STORAGE_PERMANENT_KEY, JSON.stringify(updated));
      }
      this.notifyListeners();
      return true;
    } catch (e) {
      console.error('[SyncService] Error updating activity:', e);
      return false;
    }
  }

  /**
   * Returns all pending activities currently queued in local storage.
   */
  public async getPendingActivities(): Promise<ActivitySummary[]> {
    try {
      const queueStr = await AsyncStorage.getItem(STORAGE_QUEUE_KEY);
      return queueStr ? JSON.parse(queueStr) : [];
    } catch {
      return [];
    }
  }

  /**
   * Manually re-attempt synchronization.
   */
  public retrySync(): Promise<{ syncedCount: number; errors: string[] }> {
    return this.syncPending();
  }
}
