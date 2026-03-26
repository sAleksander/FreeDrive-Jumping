/// <reference types="vite/client" />

declare global {
  type DronePhase = 'idle' | 'connecting' | 'connected' | 'error';
  type DronePosture = 'standing' | 'jumper' | 'kicker' | 'stuck' | 'unknown' | null;
  type DroneDriveCommand = 'forward' | 'backward' | 'left' | 'right';
  type DroneDriveState = Record<DroneDriveCommand, boolean>;

  interface DroneStatus {
    phase: DronePhase;
    connected: boolean;
    battery: number | null;
    posture: DronePosture;
    activeCommands: DroneDriveCommand[];
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
        setDriveState: (driveState: DroneDriveState) => Promise<DroneStatus>;
        drive: (command: DroneDriveCommand) => Promise<DroneStatus>;
        stop: () => Promise<DroneStatus>;
        onStatus: (listener: (status: DroneStatus) => void) => () => void;
      };
    };
  }
}

export {};
