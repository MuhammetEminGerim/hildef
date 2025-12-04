import { IpcMain } from 'electron';
import {
  listStaff,
  listAllStaff,
  getStaff,
  createStaff,
  updateStaff,
  deleteStaff,
  getStaffByRole,
  getStaffByDepartment,
} from '../db/dal/staffDal';
import { logActivity } from '../db/dal/activityLogDal';

export function registerStaffIpc(ipcMain: IpcMain, getCurrentUserId: () => number | null) {
  // Personel listesi
  ipcMain.handle('staff:list', () => {
    return listStaff();
  });

  // Tüm personel (aktif olmayanlar dahil)
  ipcMain.handle('staff:list-all', () => {
    return listAllStaff();
  });

  // Personel getir
  ipcMain.handle('staff:get', (_e, id: number) => {
    const staff = getStaff(id);
    if (!staff) throw new Error('Personel bulunamadı');
    return staff;
  });

  // Personel oluştur
  ipcMain.handle('staff:create', (_e, payload) => {
    const id = createStaff(payload);
    logActivity(getCurrentUserId(), 'staff:create', JSON.stringify({ id }));
    return id;
  });

  // Personel güncelle
  ipcMain.handle('staff:update', (_e, id: number, payload) => {
    updateStaff(id, payload);
    logActivity(getCurrentUserId(), 'staff:update', JSON.stringify({ id }));
    return true;
  });

  // Personel sil
  ipcMain.handle('staff:delete', (_e, id: number) => {
    deleteStaff(id);
    logActivity(getCurrentUserId(), 'staff:delete', JSON.stringify({ id }));
    return true;
  });

  // Göreve göre personel getir
  ipcMain.handle('staff:get-by-role', (_e, role: string) => {
    return getStaffByRole(role);
  });

  // Departmana göre personel getir
  ipcMain.handle('staff:get-by-department', (_e, department: string) => {
    return getStaffByDepartment(department);
  });
}

