import { contextBridge, ipcRenderer } from 'electron';

type DronePhase = 'idle' | 'connecting' | 'connected' | 'error';
type DronePosture = 'standing' | 'jumper' | 'kicker' | 'stuck' | 'unknown' | null;
type DroneDriveCommand = 'forward' | 'backward' | 'left' | 'right';

export interface DroneStatus {
  phase: DronePhase;
  connected: boolean;
  battery: number | null;
  posture: DronePosture;
  activeCommand: DroneDriveCommand | null;
  lastEvent: string | null;
  lastError: string | null;
  updatedAt: string | null;
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
  },
});
