export const initialDroneStatus: DroneStatus = {
  phase: 'idle',
  connected: false,
  armed: false,
  battery: null,
  posture: null,
  activeCommands: [],
  lastEvent: null,
  lastError: null,
  updatedAt: null,
};
