/// <reference types="vite/client" />

declare global {
  type DronePhase = 'idle' | 'connecting' | 'connected' | 'error';
  type DronePosture = 'standing' | 'jumper' | 'kicker' | 'stuck' | 'unknown' | null;

  interface DroneStatus {
    phase: DronePhase;
    connected: boolean;
    battery: number | null;
    posture: DronePosture;
    lastEvent: string | null;
    lastError: string | null;
    updatedAt: string | null;
  }

  interface Window {
    electronAPI?: {
      platform: string;
      versions: {
        chrome: string;
        electron: string;
        node: string;
      };
      drone: {
        getStatus: () => Promise<DroneStatus>;
        connect: () => Promise<DroneStatus>;
        disconnect: () => Promise<DroneStatus>;
        stop: () => Promise<DroneStatus>;
        onStatus: (listener: (status: DroneStatus) => void) => () => void;
      };
    };
  }
}

export {};
