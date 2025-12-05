import { app, BrowserWindow, ipcMain, protocol, dialog } from 'electron';
import path from 'path';
import { getDb, closeDb } from './db/connection';
import { registerStudentsIpc } from './ipc/studentsIpc';
import { registerFinanceIpc } from './ipc/financeIpc';
import { registerReportsIpc } from './ipc/reportsIpc';
import { registerAuthBackupIpc, SessionUser } from './ipc/authBackupIpc';
import { registerClassesIpc } from './ipc/classesIpc';
import { registerAttendanceIpc } from './ipc/attendanceIpc';
import { registerEventsIpc } from './ipc/eventsIpc';
import { registerStaffIpc } from './ipc/staffIpc';
import { registerUsersIpc } from './ipc/usersIpc';
import { getSetting } from './db/dal/settingsDal';
import { ensureDefaultAdmin } from './db/dal/authDal';
import * as fs from 'fs';
import { autoUpdater } from 'electron-updater';

let mainWindow: BrowserWindow | null = null;
let currentUser: SessionUser | null = null;
let backupTimer: NodeJS.Timeout | null = null;

// Auto-updater logging
autoUpdater.logger = console;

function getCurrentUser() {
  return currentUser;
}

function getCurrentUserId() {
  return currentUser?.id ?? null;
}

function setCurrentUser(user: SessionUser | null) {
  currentUser = user;
}

function createWindow() {
  const isDev = process.env.NODE_ENV === 'development';

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  if (isDev) {
    // Development mode - try VITE_DEV_SERVER_URL first, fallback to localhost
    const devServerUrl = process.env.VITE_DEV_SERVER_URL || 'http://localhost:5173';
    console.log('Loading dev server:', devServerUrl);
    void mainWindow.loadURL(devServerUrl).catch((err) => {
      console.error('Failed to load dev server:', err);
      // Fallback to built files
      if (mainWindow) {
        const indexPath = path.join(__dirname, '../renderer/index.html');
        console.log('Falling back to:', indexPath);
        void mainWindow.loadFile(indexPath);
      }
    });
    if (mainWindow) {
      mainWindow.webContents.openDevTools();
    }
  } else {
    if (mainWindow) {
      const indexPath = path.join(__dirname, '../renderer/index.html');
      console.log('Loading production file:', indexPath);
      void mainWindow.loadFile(indexPath);
    }
  }

  // Error handling
  if (mainWindow) {
    mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
      console.error('Failed to load:', errorCode, errorDescription);
    });

    mainWindow.webContents.on('console-message', (event, level, message) => {
      console.log(`[Renderer ${level}]:`, message);
    });
  }

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show();
    // Check for updates after window is shown
    if (!isDev) {
      autoUpdater.checkForUpdatesAndNotify();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function registerIpc() {
  // Veritabanının ilk açılışını tetikle
  getDb();
  ensureDefaultAdmin();

  registerStudentsIpc(ipcMain, getCurrentUserId);
  registerFinanceIpc(ipcMain, getCurrentUser);
  registerReportsIpc(ipcMain, getCurrentUserId);
  registerAuthBackupIpc(ipcMain, getCurrentUser, setCurrentUser);
  registerClassesIpc(ipcMain, getCurrentUserId);
  registerAttendanceIpc(ipcMain, getCurrentUserId);
  registerEventsIpc(ipcMain, getCurrentUserId);
  registerStaffIpc(ipcMain, getCurrentUserId);
  registerUsersIpc();

  setupAutoBackup();
}

function setupAutoBackup() {
  if (backupTimer) {
    clearInterval(backupTimer);
    backupTimer = null;
  }

  const interval = getSetting('backup_interval') ?? 'none';
  const folder = getSetting('backup_folder');
  if (!folder || interval === 'none') {
    return;
  }

  const oneDayMs = 24 * 60 * 60 * 1000;
  const periodMs = interval === 'daily' ? oneDayMs : 7 * oneDayMs;

  backupTimer = setInterval(() => {
    try {
      const userDataPath = app.getPath('userData');
      const dbPath = path.join(userDataPath, 'kindergarten.db');
      if (!fs.existsSync(dbPath)) return;
      const target = path.join(
        folder,
        `kindergarten-auto-${Date.now()}.db`
      );
      fs.copyFileSync(dbPath, target);
    } catch (err) {
      // Sessizce yut; ayrıntılı log gerekirse eklenecek
      console.error('Auto-backup error', err);
    }
  }, periodMs);
}

// Auto-updater events
autoUpdater.on('update-available', () => {
  dialog.showMessageBox({
    type: 'info',
    title: 'Güncelleme Mevcut',
    message: 'Yeni bir sürüm bulundu ve arka planda indiriliyor.',
  });
});

autoUpdater.on('update-downloaded', () => {
  dialog.showMessageBox({
    type: 'info',
    title: 'Güncelleme Hazır',
    message: 'Güncelleme indirildi. Uygulama şimdi yeniden başlatılacak.',
    buttons: ['Yeniden Başlat']
  }).then(() => {
    autoUpdater.quitAndInstall();
  });
});

const gotLock = app.requestSingleInstanceLock();

if (!gotLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  app.whenReady().then(() => {
    // Custom protocol for local files (photos, documents)
    protocol.registerFileProtocol('app', (request, callback) => {
      const url = new URL(request.url);
      if (url.hostname === 'local-file') {
        const filePath = decodeURIComponent(url.pathname.slice(1)); // Remove leading /
        try {
          if (fs.existsSync(filePath)) {
            callback({ path: filePath });
          } else {
            callback({ error: -6 }); // FILE_NOT_FOUND
          }
        } catch (error) {
          callback({ error: -2 }); // FAILED
        }
      } else {
        callback({ error: -2 }); // FAILED
      }
    });

    createWindow();
    registerIpc();
  });

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      closeDb();
      app.quit();
    }
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
}
