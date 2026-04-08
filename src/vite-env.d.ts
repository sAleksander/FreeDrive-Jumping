/// <reference types="vite/client" />

declare global {
  type DronePhase = 'idle' | 'connecting' | 'connected' | 'error';
  type DronePosture = 'standing' | 'jumper' | 'kicker' | 'stuck' | 'unknown' | null;
  type DroneDriveCommand = 'forward' | 'backward' | 'left' | 'right';
  type DroneDriveState = Record<DroneDriveCommand, boolean> & { speed: number };

  interface DroneStatus {
    phase: DronePhase;
    connected: boolean;
    armed: boolean;
    battery: number | null;
    posture: DronePosture;
    activeCommands: DroneDriveCommand[];
    lastEvent: string | null;
    lastError: string | null;
    updatedAt: string | null;
  }

  interface DroneVideoMetrics {
    sourceFps: number;
    deliveredFps: number;
    restartCount: number;
    lastFrameAgeMs: number | null;
    receivedFragments: number;
    incompleteFrames: number;
    missingFragments: number;
  }

  interface ExportedDiagnosticsLog {
    path: string;
  }

  interface RendererVideoDiagnostics {
    sourceFps: number;
    deliveredFps: number;
    renderedFps: number;
    restartCount: number;
    lastFrameAgeMs: number | null;
    streamState: string;
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
        setArmed: (armed: boolean) => Promise<DroneStatus>;
        setDriveState: (driveState: DroneDriveState) => Promise<DroneStatus>;
        drive: (command: DroneDriveCommand) => Promise<DroneStatus>;
        stop: () => Promise<DroneStatus>;
        onStatus: (listener: (status: DroneStatus) => void) => () => void;
        onVideoFrame: (listener: (frame: Uint8Array) => void) => () => void;
        onVideoMetrics: (
          listener: (metrics: DroneVideoMetrics) => void,
        ) => () => void;
      };
      diagnostics: {
        exportLog: () => Promise<ExportedDiagnosticsLog>;
        reportVideoDiagnostics: (diagnostics: RendererVideoDiagnostics) => void;
      };
    };
  }
}

export {};
