import { contextBridge, ipcRenderer } from 'electron';

type DronePhase = 'idle' | 'connecting' | 'connected' | 'error';
type DroneModel = 'sumo' | 'race' | 'night' | 'unknown';
type DronePosture = 'standing' | 'jumper' | 'kicker' | 'stuck' | 'unknown' | null;
type DroneDriveCommand = 'forward' | 'backward' | 'left' | 'right';
type DroneDriveState = Record<DroneDriveCommand, boolean> & { speed: number };

export interface DroneStatus {
  phase: DronePhase;
  connected: boolean;
  armed: boolean;
  battery: number | null;
  posture: DronePosture;
  model: DroneModel;
  activeCommands: DroneDriveCommand[];
  lastEvent: string | null;
  lastError: string | null;
  updatedAt: string | null;
}

export interface DroneVideoMetrics {
  sourceFps: number;
  deliveredFps: number;
  restartCount: number;
  lastFrameAgeMs: number | null;
  receivedFragments: number;
  incompleteFrames: number;
  missingFragments: number;
}

export interface ExportedDiagnosticsLog {
  path: string;
}

export interface AppSettings {
  armOnStartup: 0 | 1;
  virtualDrone: 0 | 1;
  showVideoDiagnostics: 0 | 1;
  sneakSpeed: number;
  regularSpeed: number;
  runSpeed: number;
}

export interface RendererVideoDiagnostics {
  sourceFps: number;
  deliveredFps: number;
  renderedFps: number;
  restartCount: number;
  lastFrameAgeMs: number | null;
  streamState: string;
}

contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform,
  versions: {
    chrome: process.versions.chrome,
    electron: process.versions.electron,
    node: process.versions.node,
  },
  drone: {
    getStatus: () => ipcRenderer.invoke('drone:get-status') as Promise<DroneStatus>,
    connect: () => ipcRenderer.invoke('drone:connect') as Promise<DroneStatus>,
    disconnect: () => ipcRenderer.invoke('drone:disconnect') as Promise<DroneStatus>,
    setArmed: (armed: boolean) =>
      ipcRenderer.invoke('drone:set-armed', armed) as Promise<DroneStatus>,
    setDriveState: (driveState: DroneDriveState) =>
      ipcRenderer.invoke('drone:set-drive-state', driveState) as Promise<DroneStatus>,
    drive: (command: DroneDriveCommand) =>
      ipcRenderer.invoke('drone:drive', command) as Promise<DroneStatus>,
    stop: () => ipcRenderer.invoke('drone:stop') as Promise<DroneStatus>,
    onStatus: (listener: (status: DroneStatus) => void) => {
      const subscription = (
        _event: Electron.IpcRendererEvent,
        status: DroneStatus,
      ) => {
        listener(status);
      };

      ipcRenderer.on('drone:status', subscription);
      return () => {
        ipcRenderer.removeListener('drone:status', subscription);
      };
    },
    onVideoFrame: (listener: (frame: Uint8Array) => void) => {
      const subscription = (
        _event: Electron.IpcRendererEvent,
        frame: ArrayBuffer | Uint8Array,
      ) => {
        if (frame instanceof ArrayBuffer) {
          listener(new Uint8Array(frame));
          return;
        }

        listener(
          new Uint8Array(frame.buffer, frame.byteOffset, frame.byteLength),
        );
      };

      ipcRenderer.on('drone:video-frame', subscription);
      return () => {
        ipcRenderer.removeListener('drone:video-frame', subscription);
      };
    },
    onVideoMetrics: (listener: (metrics: DroneVideoMetrics) => void) => {
      const subscription = (
        _event: Electron.IpcRendererEvent,
        metrics: DroneVideoMetrics,
      ) => {
        listener(metrics);
      };

      ipcRenderer.on('drone:video-metrics', subscription);
      return () => {
        ipcRenderer.removeListener('drone:video-metrics', subscription);
      };
    },
    jump: (type: 'long' | 'high') =>
      ipcRenderer.invoke('drone:jump', type) as Promise<DroneStatus>,
  },
  settings: {
    get: () => ipcRenderer.invoke('settings:get') as Promise<AppSettings>,
    update: (patch: Partial<AppSettings>) =>
      ipcRenderer.invoke('settings:update', patch) as Promise<AppSettings>,
  },
  diagnostics: {
    exportLog: () =>
      ipcRenderer.invoke('diagnostics:export-log') as Promise<ExportedDiagnosticsLog>,
    reportVideoDiagnostics: (diagnostics: RendererVideoDiagnostics) => {
      ipcRenderer.send('diagnostics:video-renderer', diagnostics);
    },
  },
});
