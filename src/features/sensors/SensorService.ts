import { create } from 'zustand';

export interface ConnectedDevice {
  id: string;
  name: string;
  type: 'HEART_RATE' | 'CADENCE' | 'POWER' | 'SMARTWATCH';
  protocol: 'BLE' | 'ANT+' | 'WEARABLE';
  batteryPercent: number;
  isConnected: boolean;
  liveBpm?: number;
  liveCadence?: number;
}

export interface SensorStoreState {
  isScanning: boolean;
  connectedDevices: ConnectedDevice[];
  activeHeartRate: number | null;
  activeCadence: number | null;
  isSimulatingSensors: boolean;
  startScanning: () => void;
  stopScanning: () => void;
  connectDevice: (deviceId: string) => void;
  disconnectDevice: (deviceId: string) => void;
  setHeartRate: (bpm: number | null) => void;
  setCadence: (cadence: number | null) => void;
  toggleSimulation: () => void;
}

const AVAILABLE_SAMPLE_DEVICES: ConnectedDevice[] = [
  {
    id: 'dev_polar_h10',
    name: 'Polar H10 (BLE)',
    type: 'HEART_RATE',
    protocol: 'BLE',
    batteryPercent: 94,
    isConnected: false,
    liveBpm: 142,
  },
  {
    id: 'dev_garmin_hrm',
    name: 'Garmin HRM-Pro Plus',
    type: 'HEART_RATE',
    protocol: 'ANT+',
    batteryPercent: 88,
    isConnected: false,
    liveBpm: 145,
  },
  {
    id: 'dev_apple_watch',
    name: 'Apple Watch / WearOS Sync',
    type: 'SMARTWATCH',
    protocol: 'WEARABLE',
    batteryPercent: 78,
    isConnected: false,
    liveBpm: 139,
  },
  {
    id: 'dev_wahoo_tickr',
    name: 'Wahoo TICKR X',
    type: 'HEART_RATE',
    protocol: 'BLE',
    batteryPercent: 90,
    isConnected: false,
    liveBpm: 144,
  },
  {
    id: 'dev_stryd_cadence',
    name: 'Stryd Footpod (Cadence)',
    type: 'CADENCE',
    protocol: 'BLE',
    batteryPercent: 95,
    isConnected: false,
    liveCadence: 172,
  },
];

export const useSensorStore = create<SensorStoreState>((set, get) => ({
  isScanning: false,
  connectedDevices: AVAILABLE_SAMPLE_DEVICES,
  activeHeartRate: null,
  activeCadence: null,
  isSimulatingSensors: false,

  startScanning: () => {
    set({ isScanning: true });
    setTimeout(() => {
      set({ isScanning: false });
    }, 2500);
  },

  stopScanning: () => {
    set({ isScanning: false });
  },

  connectDevice: (deviceId: string) => {
    const devices = get().connectedDevices.map((d) => {
      if (d.id === deviceId) {
        return { ...d, isConnected: true };
      }
      return d;
    });

    const target = devices.find((d) => d.id === deviceId);
    set({
      connectedDevices: devices,
      activeHeartRate: target?.liveBpm || 142,
      activeCadence: target?.liveCadence || (target?.type === 'CADENCE' ? 172 : get().activeCadence),
    });
  },

  disconnectDevice: (deviceId: string) => {
    const devices = get().connectedDevices.map((d) => {
      if (d.id === deviceId) {
        return { ...d, isConnected: false };
      }
      return d;
    });

    const anyConnectedHr = devices.some((d) => d.isConnected && d.type === 'HEART_RATE');
    const anyConnectedCadence = devices.some((d) => d.isConnected && d.type === 'CADENCE');

    set({
      connectedDevices: devices,
      activeHeartRate: anyConnectedHr ? get().activeHeartRate : null,
      activeCadence: anyConnectedCadence ? get().activeCadence : null,
    });
  },

  setHeartRate: (bpm: number | null) => set({ activeHeartRate: bpm }),
  setCadence: (cadence: number | null) => set({ activeCadence: cadence }),

  toggleSimulation: () => {
    const current = get().isSimulatingSensors;
    if (!current) {
      // Connect Polar H10 by default
      const devices = get().connectedDevices.map((d) =>
        d.id === 'dev_polar_h10' ? { ...d, isConnected: true } : d
      );
      set({
        isSimulatingSensors: true,
        connectedDevices: devices,
        activeHeartRate: 144,
        activeCadence: 170,
      });
    } else {
      const devices = get().connectedDevices.map((d) => ({ ...d, isConnected: false }));
      set({
        isSimulatingSensors: false,
        connectedDevices: devices,
        activeHeartRate: null,
        activeCadence: null,
      });
    }
  },
}));

/**
 * Helper to compute Heart Rate Zone from BPM
 */
export function getHeartRateZone(bpm: number): {
  zone: 'Z1' | 'Z2' | 'Z3' | 'Z4' | 'Z5';
  name: string;
  color: string;
  description: string;
} {
  if (bpm < 120) {
    return { zone: 'Z1', name: 'Recovery', color: '#00E5FF', description: 'Active Recovery & Warmup' };
  } else if (bpm < 140) {
    return { zone: 'Z2', name: 'Aerobic Base', color: '#20E3A2', description: 'Fat Oxidation & Base Endurance' };
  } else if (bpm < 160) {
    return { zone: 'Z3', name: 'Tempo', color: '#CCFF00', description: 'Aerobic Fitness & Glycogen Delivery' };
  } else if (bpm < 175) {
    return { zone: 'Z4', name: 'Threshold', color: '#FFB84D', description: 'Lactate Clearance & Speed Endurance' };
  } else {
    return { zone: 'Z5', name: 'Anaerobic', color: '#FF5C6C', description: 'Maximum Neuromuscular Power' };
  }
}
