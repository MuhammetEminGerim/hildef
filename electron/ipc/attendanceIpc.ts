import { IpcMain } from 'electron';
import {
  saveAttendance,
  saveBulkAttendance,
  getClassAttendanceByDate,
  getStudentAttendanceHistory,
  getClassAttendanceHistory,
  getTodayAttendanceSummary,
  getClassTodayAttendanceSummary,
  deleteAttendance,
  getStudentAttendanceStats,
  type Attendance,
} from '../db/dal/attendanceDal';
import { logActivity } from '../db/dal/activityLogDal';

export function registerAttendanceIpc(ipcMain: IpcMain, getCurrentUserId: () => number | null) {
  // Yoklama kaydet (tek veya toplu)
  ipcMain.handle('attendance:save', (_e, attendance: Attendance) => {
    const id = saveAttendance(attendance);
    logActivity(getCurrentUserId(), 'attendance:save', JSON.stringify({ id, studentId: attendance.student_id, date: attendance.date }));
    return id;
  });

  // Toplu yoklama kaydet
  ipcMain.handle('attendance:save-bulk', (_e, attendances: Attendance[]) => {
    saveBulkAttendance(attendances);
    logActivity(getCurrentUserId(), 'attendance:save-bulk', JSON.stringify({ count: attendances.length }));
    return true;
  });

  // Sınıf için belirli bir günün yoklamasını getir
  ipcMain.handle('attendance:get-by-date', (_e, classId: number, date: string) => {
    return getClassAttendanceByDate(classId, date);
  });

  // Öğrenci yoklama geçmişi
  ipcMain.handle('attendance:get-student-history', (_e, studentId: number, startDate?: string, endDate?: string) => {
    return getStudentAttendanceHistory(studentId, startDate, endDate);
  });

  // Sınıf yoklama geçmişi
  ipcMain.handle('attendance:get-class-history', (_e, classId: number, startDate?: string, endDate?: string) => {
    return getClassAttendanceHistory(classId, startDate, endDate);
  });

  // Bugünün yoklama özeti (tüm sınıflar)
  ipcMain.handle('attendance:get-today-summary', () => {
    return getTodayAttendanceSummary();
  });

  // Sınıf için bugünün yoklama özeti
  ipcMain.handle('attendance:get-class-today-summary', (_e, classId: number) => {
    return getClassTodayAttendanceSummary(classId);
  });

  // Yoklama kaydı sil
  ipcMain.handle('attendance:delete', (_e, id: number) => {
    deleteAttendance(id);
    logActivity(getCurrentUserId(), 'attendance:delete', JSON.stringify({ id }));
    return true;
  });

  // Öğrenci devamsızlık istatistikleri
  ipcMain.handle('attendance:get-student-stats', (_e, studentId: number, startDate?: string, endDate?: string) => {
    return getStudentAttendanceStats(studentId, startDate, endDate);
  });
}

