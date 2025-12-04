import { IpcMain } from 'electron';
import {
  listClasses,
  listAllClasses,
  getClass,
  createClass,
  updateClass,
  deleteClass,
  addStudentToClass,
  removeStudentFromClass,
  getClassStudents,
  getStudentClass,
  getClassStudentCount,
} from '../db/dal/classesDal';
import { logActivity } from '../db/dal/activityLogDal';

export function registerClassesIpc(ipcMain: IpcMain, getCurrentUserId: () => number | null) {
  // Sınıf listesi
  ipcMain.handle('classes:list', () => {
    return listClasses();
  });

  // Tüm sınıflar (aktif olmayanlar dahil)
  ipcMain.handle('classes:list-all', () => {
    return listAllClasses();
  });

  // Sınıf getir
  ipcMain.handle('classes:get', (_e, id: number) => {
    const cls = getClass(id);
    if (!cls) throw new Error('Sınıf bulunamadı');
    return cls;
  });

  // Sınıf oluştur
  ipcMain.handle('classes:create', (_e, payload) => {
    const id = createClass(payload);
    logActivity(getCurrentUserId(), 'class:create', JSON.stringify({ id }));
    return id;
  });

  // Sınıf güncelle
  ipcMain.handle('classes:update', (_e, id: number, payload) => {
    updateClass(id, payload);
    logActivity(getCurrentUserId(), 'class:update', JSON.stringify({ id }));
    return true;
  });

  // Sınıf sil
  ipcMain.handle('classes:delete', (_e, id: number) => {
    deleteClass(id);
    logActivity(getCurrentUserId(), 'class:delete', JSON.stringify({ id }));
    return true;
  });

  // Sınıfa öğrenci ekle
  ipcMain.handle('classes:add-student', (_e, classId: number, studentId: number, enrollmentDate?: string) => {
    const id = addStudentToClass(classId, studentId, enrollmentDate);
    logActivity(getCurrentUserId(), 'class:add-student', JSON.stringify({ classId, studentId }));
    return id;
  });

  // Sınıftan öğrenci çıkar
  ipcMain.handle('classes:remove-student', (_e, classId: number, studentId: number) => {
    removeStudentFromClass(classId, studentId);
    logActivity(getCurrentUserId(), 'class:remove-student', JSON.stringify({ classId, studentId }));
    return true;
  });

  // Sınıf öğrencilerini getir
  ipcMain.handle('classes:get-students', (_e, classId: number) => {
    return getClassStudents(classId);
  });

  // Öğrencinin sınıfını getir
  ipcMain.handle('classes:get-student-class', (_e, studentId: number) => {
    return getStudentClass(studentId);
  });

  // Sınıf öğrenci sayısı
  ipcMain.handle('classes:get-student-count', (_e, classId: number) => {
    return getClassStudentCount(classId);
  });
}

