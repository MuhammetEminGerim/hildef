import { IpcMain, dialog, app, shell } from 'electron';
import * as fs from 'fs';
import * as path from 'path';
import {
  createStudent,
  deleteStudent,
  getStudent,
  listStudents,
  updateStudent,
} from '../db/dal/studentsDal';
import {
  createParent,
  deleteParent,
  getParentsByStudent,
  setPrimaryParent,
  updateParent,
} from '../db/dal/studentParentsDal';
import {
  createOrUpdateHealth,
  deleteHealth,
  getHealthByStudent,
} from '../db/dal/studentHealthDal';
import {
  createVaccination,
  deleteVaccination,
  getVaccinationsByStudent,
  updateVaccination,
} from '../db/dal/studentVaccinationsDal';
import {
  createFile,
  deleteFile,
  getFilesByStudent,
} from '../db/dal/studentFilesDal';
import { logActivity } from '../db/dal/activityLogDal';

export function registerStudentsIpc(ipcMain: IpcMain, getCurrentUserId: () => number | null) {
  // Basic student operations
  ipcMain.handle('students:list', () => {
    return listStudents();
  });

  ipcMain.handle('students:get', (_e, id: number) => {
    const student = getStudent(id);
    if (!student) throw new Error('Öğrenci bulunamadı');
    return student;
  });

  ipcMain.handle('students:create', (_e, payload) => {
    const id = createStudent(payload);
    logActivity(getCurrentUserId(), 'student:create', JSON.stringify({ id }));
    return id;
  });

  ipcMain.handle('students:update', (_e, id: number, payload) => {
    updateStudent(id, payload);
    logActivity(getCurrentUserId(), 'student:update', JSON.stringify({ id }));
    return true;
  });

  ipcMain.handle('students:delete', (_e, id: number) => {
    deleteStudent(id);
    logActivity(getCurrentUserId(), 'student:delete', JSON.stringify({ id }));
    return true;
  });

  // Parents
  ipcMain.handle('students:parents:list', (_e, studentId: number) => {
    return getParentsByStudent(studentId);
  });

  ipcMain.handle('students:parents:create', (_e, payload) => {
    const id = createParent(payload);
    logActivity(getCurrentUserId(), 'student:parent:create', JSON.stringify({ studentId: payload.student_id, id }));
    return id;
  });

  ipcMain.handle('students:parents:update', (_e, id: number, payload) => {
    updateParent(id, payload);
    logActivity(getCurrentUserId(), 'student:parent:update', JSON.stringify({ id }));
    return true;
  });

  ipcMain.handle('students:parents:delete', (_e, id: number) => {
    deleteParent(id);
    logActivity(getCurrentUserId(), 'student:parent:delete', JSON.stringify({ id }));
    return true;
  });

  ipcMain.handle('students:parents:set-primary', (_e, studentId: number, parentId: number) => {
    setPrimaryParent(studentId, parentId);
    return true;
  });

  // Health
  ipcMain.handle('students:health:get', (_e, studentId: number) => {
    return getHealthByStudent(studentId);
  });

  ipcMain.handle('students:health:save', (_e, payload) => {
    createOrUpdateHealth(payload);
    logActivity(getCurrentUserId(), 'student:health:update', JSON.stringify({ studentId: payload.student_id }));
    return true;
  });

  ipcMain.handle('students:health:delete', (_e, studentId: number) => {
    deleteHealth(studentId);
    return true;
  });

  // Vaccinations
  ipcMain.handle('students:vaccinations:list', (_e, studentId: number) => {
    return getVaccinationsByStudent(studentId);
  });

  ipcMain.handle('students:vaccinations:create', (_e, payload) => {
    const id = createVaccination(payload);
    return id;
  });

  ipcMain.handle('students:vaccinations:update', (_e, id: number, payload) => {
    updateVaccination(id, payload);
    return true;
  });

  ipcMain.handle('students:vaccinations:delete', (_e, id: number) => {
    deleteVaccination(id);
    return true;
  });

  // Files
  ipcMain.handle('students:files:list', (_e, studentId: number) => {
    return getFilesByStudent(studentId);
  });

  ipcMain.handle('students:files:create', (_e, payload) => {
    const id = createFile(payload);
    return id;
  });

  ipcMain.handle('students:files:delete', (_e, id: number) => {
    deleteFile(id);
    return true;
  });

  ipcMain.handle('students:files:open', async (_e, filePath: string) => {
    if (!filePath) {
      throw new Error('Dosya yolu belirtilmedi');
    }
    if (!fs.existsSync(filePath)) {
      throw new Error('Dosya bulunamadı');
    }
    const errorMessage = await shell.openPath(filePath);
    if (errorMessage) {
      throw new Error(errorMessage);
    }
    return true;
  });

  // File upload
  ipcMain.handle('students:upload-photo', async (_e, studentId: number) => {
    const { filePaths } = await dialog.showOpenDialog({
      title: 'Öğrenci Fotoğrafı Seç',
      filters: [{ name: 'Resimler', extensions: ['jpg', 'jpeg', 'png', 'gif', 'webp'] }],
      properties: ['openFile'],
    });

    if (!filePaths || filePaths.length === 0) return null;

    const sourcePath = filePaths[0];
    const userDataPath = app.getPath('userData');
    const photosDir = path.join(userDataPath, 'student-photos');

    if (!fs.existsSync(photosDir)) {
      fs.mkdirSync(photosDir, { recursive: true });
    }

    const ext = path.extname(sourcePath);
    const fileName = `student-${studentId}-${Date.now()}${ext}`;
    const destPath = path.join(photosDir, fileName);

    fs.copyFileSync(sourcePath, destPath);
    return destPath;
  });

  // Get photo as base64 for display
  ipcMain.handle('students:get-photo-base64', async (_e, photoPath: string) => {
    try {
      if (!photoPath || !fs.existsSync(photoPath)) return null;
      const imageBuffer = fs.readFileSync(photoPath);
      const base64 = imageBuffer.toString('base64');
      const ext = path.extname(photoPath).toLowerCase().slice(1);
      return `data:image/${ext === 'jpg' ? 'jpeg' : ext};base64,${base64}`;
    } catch (error) {
      console.error('Error reading photo:', error);
      return null;
    }
  });

  ipcMain.handle('students:upload-file', async (_e, studentId: number, fileType: string) => {
    const { filePaths } = await dialog.showOpenDialog({
      title: 'Dosya Seç',
      filters: [
        { name: 'Tüm Dosyalar', extensions: ['*'] },
        { name: 'PDF', extensions: ['pdf'] },
        { name: 'Resimler', extensions: ['jpg', 'jpeg', 'png', 'gif'] },
      ],
      properties: ['openFile'],
    });

    if (!filePaths || filePaths.length === 0) return null;

    const sourcePath = filePaths[0];
    const userDataPath = app.getPath('userData');
    const filesDir = path.join(userDataPath, 'student-files');

    if (!fs.existsSync(filesDir)) {
      fs.mkdirSync(filesDir, { recursive: true });
    }

    const ext = path.extname(sourcePath);
    const fileName = `student-${studentId}-${fileType}-${Date.now()}${ext}`;
    const destPath = path.join(filesDir, fileName);
    const stats = fs.statSync(sourcePath);

    fs.copyFileSync(sourcePath, destPath);
    return {
      file_name: path.basename(sourcePath),
      file_path: destPath,
      file_size: stats.size,
    };
  });
}


