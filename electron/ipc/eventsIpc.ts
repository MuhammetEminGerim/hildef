import { IpcMain } from 'electron';
import {
  listEvents,
  getUpcomingEvents,
  getEvent,
  createEvent,
  updateEvent,
  deleteEvent,
  getEventsByDateRange,
  getEventsByStatus,
} from '../db/dal/eventsDal';
import { logActivity } from '../db/dal/activityLogDal';

export function registerEventsIpc(ipcMain: IpcMain, getCurrentUserId: () => number | null) {
  // Tüm etkinlikleri listele
  ipcMain.handle('events:list', () => {
    return listEvents();
  });

  // Yaklaşan etkinlikleri getir
  ipcMain.handle('events:get-upcoming', (_e, limit?: number) => {
    return getUpcomingEvents(limit);
  });

  // Etkinlik getir
  ipcMain.handle('events:get', (_e, id: number) => {
    const event = getEvent(id);
    if (!event) throw new Error('Etkinlik bulunamadı');
    return event;
  });

  // Etkinlik oluştur
  ipcMain.handle('events:create', (_e, payload) => {
    const id = createEvent({
      ...payload,
      created_by: getCurrentUserId(),
    });
    logActivity(getCurrentUserId(), 'event:create', JSON.stringify({ id }));
    return id;
  });

  // Etkinlik güncelle
  ipcMain.handle('events:update', (_e, id: number, payload) => {
    updateEvent(id, payload);
    logActivity(getCurrentUserId(), 'event:update', JSON.stringify({ id }));
    return true;
  });

  // Etkinlik sil
  ipcMain.handle('events:delete', (_e, id: number) => {
    deleteEvent(id);
    logActivity(getCurrentUserId(), 'event:delete', JSON.stringify({ id }));
    return true;
  });

  // Tarih aralığına göre etkinlikleri getir
  ipcMain.handle('events:get-by-date-range', (_e, startDate: string, endDate: string) => {
    return getEventsByDateRange(startDate, endDate);
  });

  // Duruma göre etkinlikleri getir
  ipcMain.handle('events:get-by-status', (_e, status: string) => {
    return getEventsByStatus(status as any);
  });
}

