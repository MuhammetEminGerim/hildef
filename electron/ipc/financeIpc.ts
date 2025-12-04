import { IpcMain, dialog } from 'electron';
import {
  createPayment,
  deletePayment,
  listPaymentsByStudent,
  listAllPayments,
  updatePayment,
  updatePaymentStatus,
  applyPartialPayment,
  getPaymentHistory,
} from '../db/dal/paymentsDal';
import {
  createExpense,
  deleteExpense,
  listExpenses,
  updateExpense,
} from '../db/dal/expensesDal';
import {
  createPaymentPlan,
  deletePaymentPlan,
  generatePaymentsFromPlan,
  getPaymentPlan,
  listPaymentPlansByStudent,
  updatePaymentPlan,
} from '../db/dal/paymentPlansDal';
import {
  createReminder,
  deleteReminder,
  listPendingReminders,
  listRemindersByPayment,
  updateReminderStatus,
} from '../db/dal/paymentRemindersDal';
import { logActivity } from '../db/dal/activityLogDal';
import { getDb } from '../db/connection';
import * as fs from 'fs';
import * as path from 'path';

export type SessionUser = {
  id: number;
  username: string;
  role: 'admin' | 'staff';
};

export function registerFinanceIpc(ipcMain: IpcMain, getCurrentUser: () => SessionUser | null) {
  // Helper to get ID
  const getCurrentUserId = () => getCurrentUser()?.id ?? null;

  // Payments
  ipcMain.handle('payments:list-by-student', (_e, studentId: number | null) => {
    if (studentId === null || studentId === -1) {
      return listAllPayments();
    }
    return listPaymentsByStudent(studentId);
  });

  ipcMain.handle('payments:create', (_e, payload) => {
    const id = createPayment(payload);
    logActivity(getCurrentUserId(), 'payment:create', JSON.stringify({ id }));
    return id;
  });

  ipcMain.handle('payments:update', (_e, id: number, payload) => {
    updatePayment(id, payload);
    logActivity(getCurrentUserId(), 'payment:update', JSON.stringify({ id }));
    return true;
  });

  ipcMain.handle('payments:update-status', (_e, id: number, status: string, paidDate?: string) => {
    updatePaymentStatus(id, status as any, paidDate ?? null);
    logActivity(getCurrentUserId(), 'payment:update-status', JSON.stringify({ id, status }));
    return true;
  });

  ipcMain.handle('payments:delete', (_e, id: number) => {
    const user = getCurrentUser();
    if (!user || user.role !== 'admin') throw new Error('Sadece yönetici ödeme silebilir');

    deletePayment(id);
    logActivity(user.id, 'payment:delete', JSON.stringify({ id }));
    return true;
  });

  // Simple PDF receipt using jsPDF on renderer; here sadece dosya yolu seçimi istenirse kullanılabilir.
  ipcMain.handle('payments:choose-receipt-path', async (_e, suggestedName: string) => {
    const { filePath } = await dialog.showSaveDialog({
      title: 'Makbuzu Kaydet',
      defaultPath: suggestedName,
      filters: [{ name: 'PDF', extensions: ['pdf'] }],
    });
    return filePath ?? null;
  });

  // Expenses
  ipcMain.handle('expenses:list', () => listExpenses());

  ipcMain.handle('expenses:create', (_e, payload) => {
    const id = createExpense(payload);
    logActivity(getCurrentUserId(), 'expense:create', JSON.stringify({ id }));
    return id;
  });

  ipcMain.handle('expenses:update', (_e, id: number, payload) => {
    updateExpense(id, payload);
    logActivity(getCurrentUserId(), 'expense:update', JSON.stringify({ id }));
    return true;
  });

  ipcMain.handle('expenses:delete', (_e, id: number) => {
    const user = getCurrentUser();
    if (!user || user.role !== 'admin') throw new Error('Sadece yönetici gider silebilir');

    deleteExpense(id);
    logActivity(user.id, 'expense:delete', JSON.stringify({ id }));
    return true;
  });

  // Payment Plans
  ipcMain.handle('payment-plans:list-by-student', (_e, studentId: number) => {
    return listPaymentPlansByStudent(studentId);
  });

  ipcMain.handle('payment-plans:get', (_e, id: number) => {
    const plan = getPaymentPlan(id);
    if (!plan) throw new Error('Taksit planı bulunamadı');
    return plan;
  });

  ipcMain.handle('payment-plans:create', (_e, payload) => {
    const id = createPaymentPlan(payload);
    logActivity(getCurrentUserId(), 'payment-plan:create', JSON.stringify({ id }));
    return id;
  });

  ipcMain.handle('payment-plans:update', (_e, id: number, payload) => {
    updatePaymentPlan(id, payload);
    logActivity(getCurrentUserId(), 'payment-plan:update', JSON.stringify({ id }));
    return true;
  });

  ipcMain.handle('payment-plans:delete', (_e, id: number) => {
    const user = getCurrentUser();
    if (!user || user.role !== 'admin') throw new Error('Sadece yönetici plan silebilir');

    deletePaymentPlan(id);
    logActivity(user.id, 'payment-plan:delete', JSON.stringify({ id }));
    return true;
  });

  ipcMain.handle('payment-plans:generate-payments', (_e, planId: number) => {
    const paymentIds = generatePaymentsFromPlan(planId);
    logActivity(getCurrentUserId(), 'payment-plan:generate', JSON.stringify({ planId, count: paymentIds.length }));
    return paymentIds;
  });

  // Payment Reminders
  ipcMain.handle('payment-reminders:list-by-payment', (_e, paymentId: number) => {
    return listRemindersByPayment(paymentId);
  });

  ipcMain.handle('payment-reminders:list-pending', () => {
    return listPendingReminders();
  });

  ipcMain.handle('payment-reminders:create', (_e, payload) => {
    const id = createReminder(payload);
    return id;
  });

  ipcMain.handle('payment-reminders:update-status', (_e, id: number, status: string, sentAt?: string) => {
    updateReminderStatus(id, status as any, sentAt);
    return true;
  });

  ipcMain.handle('payment-reminders:delete', (_e, id: number) => {
    deleteReminder(id);
    return true;
  });

  // Advanced Payment Features
  ipcMain.handle('payments:apply-partial', (_e, paymentId: number, partialAmount: number) => {
    const userId = getCurrentUserId();
    applyPartialPayment(paymentId, partialAmount, userId ?? undefined);
    logActivity(userId, 'payment:partial', JSON.stringify({ paymentId, partialAmount }));
    return true;
  });

  ipcMain.handle('payments:history', (_e, paymentId: number) => {
    return getPaymentHistory(paymentId);
  });

  ipcMain.handle('payments:approve', (_e, paymentId: number) => {
    const user = getCurrentUser();
    if (!user || user.role !== 'admin') throw new Error('Sadece yönetici ödeme onaylayabilir');

    updatePayment(paymentId, {
      requires_approval: 0,
      approved_by: user.id,
      approved_at: new Date().toISOString(),
    });
    logActivity(user.id, 'payment:approve', JSON.stringify({ paymentId }));
    return true;
  });
}


