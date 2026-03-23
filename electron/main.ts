import path from 'node:path';
import { app, BrowserWindow, ipcMain } from 'electron';
import { DroneController, type DroneStatus } from './drone-controller';

const droneController = new DroneController((status: DroneStatus) => {
  for (const window of BrowserWindow.getAllWindows()) {
    window.webContents.send('drone:status', status);
  }
});

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
}

ipcMain.handle('drone:get-status', () => droneController.getStatus());
ipcMain.handle('drone:connect', () => droneController.connect());
ipcMain.handle('drone:disconnect', () => droneController.disconnect());
ipcMain.handle('drone:stop', () => droneController.stop());

app.whenReady().then(() => {
  createMainWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

app.on('before-quit', () => {
  void droneController.disconnect();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
