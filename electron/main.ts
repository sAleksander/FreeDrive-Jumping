import path from 'node:path';
import { app, BrowserWindow, ipcMain } from 'electron';
import { SessionLogger } from './diagnostics/session-logger';
import {
  DroneController,
  type DroneDriveState,
  type DroneJumpType,
  type DroneStatus,
  type DroneVideoMetrics,
} from './drone-controller/drone-controller';
import { AppSettingsStore } from './settings/app-settings';

const sessionLogger = new SessionLogger();
const appSettingsStore = new AppSettingsStore();

const droneController = new DroneController(
  (status: DroneStatus) => {
    for (const window of BrowserWindow.getAllWindows()) {
      window.webContents.send('drone:status', status);
    }

    sessionLogger.log('drone.status', status);
  },
  (frame: Buffer) => {
    const payload = new Uint8Array(
      frame.buffer,
      frame.byteOffset,
      frame.byteLength,
    );

    for (const window of BrowserWindow.getAllWindows()) {
      window.webContents.send('drone:video-frame', payload);
    }
  },
  (metrics: DroneVideoMetrics) => {
    for (const window of BrowserWindow.getAllWindows()) {
      window.webContents.send('drone:video-metrics', metrics);
    }

    sessionLogger.log('video.metrics.backend', metrics);
  },
  (event: string, data?: unknown) => {
    sessionLogger.log(event, data);
  },
);

function createMainWindow() {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 960,
    minHeight: 640,
    backgroundColor: '#0b1220',
    title: 'FreeDrive Jumping',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  const devServerUrl = process.env.VITE_DEV_SERVER_URL;

  if (devServerUrl) {
    void mainWindow.loadURL(devServerUrl);
  } else {
    void mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  }

  return mainWindow;
}

ipcMain.handle('drone:get-status', () => droneController.getStatus());
ipcMain.handle('drone:connect', async () => {
  sessionLogger.log('command.connect.request');

  try {
    const { virtualDrone } = appSettingsStore.getSettings();
    let status = await droneController.connect({ virtual: virtualDrone === 1 });

    if (status.connected && appSettingsStore.getSettings().armOnStartup === 1) {
      try {
        status = await droneController.setArmed(true);
        sessionLogger.log('command.connect.auto-arm.success', status);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        sessionLogger.log('command.connect.auto-arm.error', { message });
      }
    }

    sessionLogger.log('command.connect.success', status);
    return status;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    sessionLogger.log('command.connect.error', { message });
    throw error;
  }
});
ipcMain.handle('drone:disconnect', async () => {
  sessionLogger.log('command.disconnect.request');

  try {
    const status = await droneController.disconnect();
    sessionLogger.log('command.disconnect.success', status);
    return status;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    sessionLogger.log('command.disconnect.error', { message });
    throw error;
  }
});
ipcMain.handle('drone:set-drive-state', (_event, driveState: DroneDriveState) =>
  {
    sessionLogger.log('command.set-drive-state', driveState);
    return droneController.setDriveState(driveState);
  },
);
ipcMain.handle('drone:set-armed', (_event, armed: boolean) => {
  sessionLogger.log('command.set-armed', { armed });
  return droneController.setArmed(armed);
});
ipcMain.handle('drone:drive', (_event, command: 'forward' | 'backward' | 'left' | 'right') => {
  sessionLogger.log('command.drive', { command });
  return droneController.drive(command);
});
ipcMain.handle('drone:stop', async () => {
  sessionLogger.log('command.stop.request');
  return droneController.stop();
});
ipcMain.handle('drone:jump', (_event, type: DroneJumpType) => {
  sessionLogger.log('command.jump', { type });
  return droneController.jump(type);
});
ipcMain.handle('settings:get', () => appSettingsStore.getSettings());
ipcMain.handle('settings:update', async (_event, patch) => {
  sessionLogger.log('settings.update.request', patch);
  const settings = await appSettingsStore.updateSettings(patch ?? {});
  sessionLogger.log('settings.update.success', settings);
  return settings;
});
ipcMain.handle('diagnostics:export-log', async () => {
  sessionLogger.log('diagnostics.export.request');
  return sessionLogger.exportCurrentLog();
});
ipcMain.on('diagnostics:video-renderer', (_event, diagnostics) => {
  sessionLogger.log('video.metrics.renderer', diagnostics);
});

app.whenReady().then(async () => {
  await appSettingsStore.initialize();
  await sessionLogger.initialize();
  sessionLogger.log('settings.loaded', appSettingsStore.getSettings());
  createMainWindow().on('blur', () => {
    sessionLogger.log('window.blur');
    void droneController.stop();
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow().on('blur', () => {
        sessionLogger.log('window.blur');
        void droneController.stop();
      });
    }
  });
});

app.on('before-quit', () => {
  sessionLogger.log('app.before-quit');
  void droneController.disconnect();
});

app.on('will-quit', () => {
  void sessionLogger.shutdown();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
