import { IpcMain, dialog, app } from 'electron';
import { authenticate, changePassword, createUser, ensureDefaultAdmin, listUsers, deleteUser } from '../db/dal/authDal';
import { logActivity } from '../db/dal/activityLogDal';
import { getSetting, setSetting } from '../db/dal/settingsDal';
import * as fs from 'fs';
import * as path from 'path';

export type SessionUser = {
  id: number;
  username: string;
  role: 'admin' | 'staff';
};

export function registerAuthBackupIpc(
  ipcMain: IpcMain,
  getCurrentUser: () => SessionUser | null,
  setCurrentUser: (user: SessionUser | null) => void
) {
  ensureDefaultAdmin();

  ipcMain.handle('auth:login', (_e, username: string, password: string) => {
    const user = authenticate(username, password);
    if (!user) throw new Error('Kullanıcı adı veya şifre hatalı');
    const sessionUser: SessionUser = {
      id: user.id!,
      username: user.username,
      role: user.role,
    };
    setCurrentUser(sessionUser);
    logActivity(user.id!, 'auth:login');
    return sessionUser;
  });

  ipcMain.handle('auth:logout', () => {
    const current = getCurrentUser();
    if (current) {
      logActivity(current.id, 'auth:logout');
    }
    setCurrentUser(null);
    return true;
  });

  ipcMain.handle('auth:current-user', () => getCurrentUser());

  ipcMain.handle(
    'auth:create-user',
    (_e, username: string, password: string, role: 'admin' | 'staff') => {
      // Auth check disabled for migration
      createUser(username, password, role);
      // logActivity(current.id, 'auth:create-user', JSON.stringify({ username, role }));
      return true;
    }
  );

  ipcMain.handle('auth:list-users', () => {
    // Auth check disabled for migration
    return listUsers();
  });

  ipcMain.handle('auth:delete-user', (_e, id: number) => {
    // Auth check disabled for migration
    deleteUser(id);
    // logActivity(current.id, 'auth:delete-user', JSON.stringify({ deletedUserId: id }));
    return true;
  });

  ipcMain.handle(
    'auth:change-password',
    (_e, currentPassword: string, newPassword: string) => {
      const current = getCurrentUser();
      if (!current) {
        throw new Error('Giriş yapmanız gerekiyor');
      }

      // Mevcut şifreyi doğrula
      const user = authenticate(current.username, currentPassword);
      if (!user) {
        throw new Error('Mevcut şifre hatalı');
      }

      // Yeni şifreyi kaydet
      changePassword(current.id, newPassword);
      logActivity(current.id, 'auth:change-password', JSON.stringify({ userId: current.id }));
      return true;
    }
  );

  // Backup – export DB file
  ipcMain.handle('backup:export-db', async () => {
    const current = getCurrentUser();
    if (!current || current.role !== 'admin') {
      throw new Error('Sadece admin yedek alabilir');
    }

    const { filePath } = await dialog.showSaveDialog({
      title: 'Veritabanı Yedeğini Kaydet',
      defaultPath: `kindergarten-backup-${Date.now()}.db`,
      filters: [{ name: 'SQLite', extensions: ['db'] }],
    });

    if (!filePath) return { saved: false };

    try {
      // Use VACUUM INTO for safe hot backup
      const { getDb } = require('../db/connection');
      getDb().prepare('VACUUM INTO ?').run(filePath);

      logActivity(current.id, 'backup:export-db', JSON.stringify({ filePath }));
      return { saved: true, path: filePath };
    } catch (e: any) {
      console.error('Backup error:', e);
      throw new Error('Yedekleme başarısız: ' + e.message);
    }
  });

  // Backup – import DB file (uygulama yeniden başlatma gerektirir)
  ipcMain.handle('backup:import-db', async () => {
    const current = getCurrentUser();
    if (!current || current.role !== 'admin') {
      throw new Error('Sadece admin geri yükleme yapabilir');
    }

    const { filePaths, canceled } = await dialog.showOpenDialog({
      title: 'Veritabanı Yedeğini Seç',
      properties: ['openFile'],
      filters: [{ name: 'SQLite', extensions: ['db'] }],
    });

    if (canceled || filePaths.length === 0) return { imported: false };

    const source = filePaths[0];
    const userDataPath = app.getPath('userData');
    const dbPath = path.join(userDataPath, 'kindergarten.db');

    try {
      // Close DB connection before overwriting
      const { closeDb } = require('../db/connection');
      closeDb();

      // Wait a bit for file handle release (optional but safer on Windows)
      await new Promise(resolve => setTimeout(resolve, 100));

      fs.copyFileSync(source, dbPath);

      // We can't log activity to DB because it's closed/replaced!
      // But we can try to re-open or just return success.
      // The app will restart anyway.

      return { imported: true, needsRestart: true };
    } catch (e: any) {
      console.error('Restore error:', e);
      throw new Error('Geri yükleme başarısız: ' + e.message);
    }
  });

  ipcMain.handle('backup:get-settings', () => {
    const interval = getSetting('backup_interval') ?? 'none';
    const folder = getSetting('backup_folder');
    return { interval, folder };
  });

  ipcMain.handle(
    'backup:set-settings',
    (_e, interval: 'none' | 'daily' | 'weekly', folder: string | null) => {
      const current = getCurrentUser();
      if (!current || current.role !== 'admin') {
        throw new Error('Sadece admin ayarları değiştirebilir');
      }
      setSetting('backup_interval', interval);
      if (folder) {
        setSetting('backup_folder', folder);
      }
      logActivity(
        current.id,
        'backup:set-settings',
        JSON.stringify({ interval, folder })
      );
      return true;
    }
  );

  ipcMain.handle('backup:choose-folder', async () => {
    const { filePaths, canceled } = await dialog.showOpenDialog({
      properties: ['openDirectory'],
      title: 'Yedekleme klasörünü seçin',
    });
    if (canceled || filePaths.length === 0) return null;
    return filePaths[0];
  });

  ipcMain.handle('backup:trigger-auto', async () => {
    const current = getCurrentUser();
    if (!current || current.role !== 'admin') {
      throw new Error('Sadece admin yedek alabilir');
    }

    const folder = getSetting('backup_folder');
    if (!folder) {
      throw new Error('Yedekleme klasörü seçilmemiş');
    }

    try {
      const userDataPath = app.getPath('userData');
      const dbPath = path.join(userDataPath, 'kindergarten.db');
      if (!fs.existsSync(dbPath)) throw new Error('Veritabanı bulunamadı');

      const target = path.join(
        folder,
        `kindergarten-manual-${Date.now()}.db`
      );
      fs.copyFileSync(dbPath, target);
      logActivity(current.id, 'backup:trigger-auto', JSON.stringify({ target }));
      return { success: true, path: target };
    } catch (e: any) {
      console.error('Trigger backup error:', e);
      throw new Error(e.message);
    }
  });

  ipcMain.handle('settings:get-kindergarten-info', () => {
    const { getKindergartenInfo } = require('../db/dal/settingsDal');
    return getKindergartenInfo();
  });

  ipcMain.handle('settings:update-kindergarten-info', (_e, info) => {
    const current = getCurrentUser();
    if (!current || current.role !== 'admin') {
      throw new Error('Sadece admin ayarları değiştirebilir');
    }
    const { updateKindergartenInfo } = require('../db/dal/settingsDal');
    updateKindergartenInfo(info);
    logActivity(current.id, 'settings:update-kindergarten-info', JSON.stringify(info));
    return true;
  });
}
