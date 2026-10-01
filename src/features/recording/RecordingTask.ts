import * as TaskManager from 'expo-task-manager';
import * as Location from 'expo-location';
import { RecordingService } from './RecordingService';

export const PERFORMA_BACKGROUND_LOCATION_TASK = 'PERFORMA_BACKGROUND_LOCATION_TASK';

// Register background task at module scope so it is available on cold boot / OS wakeup
try {
  TaskManager.defineTask(PERFORMA_BACKGROUND_LOCATION_TASK, async ({ data, error }) => {
    if (error) {
      console.warn('[RecordingTask] Background location task error:', error.message);
      return;
    }

    if (data) {
      const { locations } = data as { locations: Location.LocationObject[] };
      if (locations && locations.length > 0) {
        RecordingService.getInstance().handleBackgroundLocations(locations);
      }
    }
  });
} catch (e) {
  console.warn('[RecordingTask] TaskManager.defineTask caught error:', e);
}
