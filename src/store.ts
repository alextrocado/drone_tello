import { create } from 'zustand';

export type DroneState = {
  x: number;
  y: number;
  z: number; // height
  yaw: number; // rotation in degrees
  battery: number;
  isFlying: boolean;
  speedSetting: number; // cm/s
  path: { x: number; y: number; z: number }[];
  history: { time: number; height: number; battery: number; speed: number }[];
  trailSettings: {
    color: string;
    width: number;
    show: boolean;
  };
  environmentSettings: {
    preset: 'city' | 'park' | 'studio' | 'sunset' | 'night' | 'forest' | 'apartment';
    showGrid: boolean;
    backgroundColor: string;
  };
  // Physics state
  velocity: { x: number; y: number; z: number };
  target: { x: number; y: number; z: number; yaw: number };
  tilt: { pitch: number; roll: number };
};

type DroneStore = {
  drone: DroneState;
  logs: string[];
  resetDrone: () => void;
  updateDrone: (updates: Partial<DroneState>) => void;
  updateTrailSettings: (settings: Partial<DroneState['trailSettings']>) => void;
  updateEnvironmentSettings: (settings: Partial<DroneState['environmentSettings']>) => void;
  setPath: (path: { x: number; y: number; z: number }[]) => void;
  addLog: (message: string) => void;
  clearLogs: () => void;
};

const INITIAL_STATE: DroneState = {
  x: 0,
  y: 0,
  z: 0,
  yaw: 0,
  battery: 100,
  isFlying: false,
  speedSetting: 60, // Default Tello speed (approx)
  path: [{ x: 0, y: 0, z: 0 }],
  history: [],
  trailSettings: {
    color: '#00ffff', // Cyan
    width: 2,
    show: true,
  },
  environmentSettings: {
    preset: 'city',
    showGrid: true,
    backgroundColor: '#0f172a', // slate-900
  },
  velocity: { x: 0, y: 0, z: 0 },
  target: { x: 0, y: 0, z: 0, yaw: 0 },
  tilt: { pitch: 0, roll: 0 },
};

export const useDroneStore = create<DroneStore>((set) => ({
  drone: INITIAL_STATE,
  logs: [],
  resetDrone: () => set((state) => ({ 
      drone: {
          ...INITIAL_STATE,
          // Preserve settings
          trailSettings: state.drone.trailSettings,
          environmentSettings: state.drone.environmentSettings
      }, 
      logs: [] 
  })),
  updateDrone: (updates) =>
    set((state) => {
      const newDrone = { ...state.drone, ...updates };
      
      // If position changed, check if we should add to path
      if (updates.x !== undefined || updates.y !== undefined || updates.z !== undefined) {
        const lastPoint = state.drone.path[state.drone.path.length - 1];
        if (lastPoint) {
            const dist = Math.sqrt(
                Math.pow(newDrone.x - lastPoint.x, 2) + 
                Math.pow(newDrone.y - lastPoint.y, 2) + 
                Math.pow(newDrone.z - lastPoint.z, 2)
            );
            // Only add if moved more than 2cm to avoid noise
            if (dist > 2) {
                newDrone.path = [...state.drone.path, { x: newDrone.x, y: newDrone.y, z: newDrone.z }];
            }
        } else {
            newDrone.path = [{ x: newDrone.x, y: newDrone.y, z: newDrone.z }];
        }
      }
      
      // Add to history (throttled)
      const time = Date.now();
      const lastHistory = state.drone.history[state.drone.history.length - 1];
      
      // Only update history if 100ms has passed or it's the first entry
      if (!lastHistory || time - lastHistory.time > 100) {
          // Calculate speed from velocity vector
          let speed = 0;
          if (newDrone.velocity) {
             speed = Math.sqrt(
                Math.pow(newDrone.velocity.x, 2) + 
                Math.pow(newDrone.velocity.y, 2) + 
                Math.pow(newDrone.velocity.z, 2)
             );
          }

          newDrone.history = [...state.drone.history, { 
              time, 
              height: newDrone.z, 
              battery: newDrone.battery,
              speed 
          }].slice(-100);
      } else {
          // Keep existing history
          newDrone.history = state.drone.history;
      }

      return { drone: newDrone };
    }),
  updateTrailSettings: (settings) =>
    set((state) => ({
      drone: {
        ...state.drone,
        trailSettings: { ...state.drone.trailSettings, ...settings },
      },
    })),
  updateEnvironmentSettings: (settings) =>
    set((state) => ({
      drone: {
        ...state.drone,
        environmentSettings: { ...state.drone.environmentSettings, ...settings },
      },
    })),
  setPath: (path) => set((state) => ({ drone: { ...state.drone, path } })),
  addLog: (message) => set((state) => ({ logs: [...state.logs, `[${new Date().toLocaleTimeString()}] ${message}`] })),
  clearLogs: () => set({ logs: [] }),
}));
