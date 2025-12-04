import { IpcMain, dialog } from 'electron';
import {
  getDashboardSummary,
  getMonthlyFinancialReport,
  getYearlyFinancialReport,
  getYearlyFinancialSeries,
  getYearlyExpectedCollection,
  getExpenseCategoriesByMonth,
  buildCsvFromRows,
} from '../db/dal/reportsDal';
import { logActivity } from '../db/dal/activityLogDal';
import * as fs from 'fs';

export function registerReportsIpc(ipcMain: IpcMain, getCurrentUserId: () => number | null) {
  ipcMain.handle('dashboard:get-summary', () => {
    return getDashboardSummary();
  });

  ipcMain.handle('reports:get-monthly', (_e, ym: string) => {
    return getMonthlyFinancialReport(ym);
  });

  ipcMain.handle('reports:get-yearly', (_e, year: number) => {
    return getYearlyFinancialReport(year);
  });

  ipcMain.handle('reports:get-yearly-series', (_e, year: number) => {
    return getYearlyFinancialSeries(year);
  });

  ipcMain.handle('reports:get-yearly-expected-collection', (_e, year: number) => {
    return getYearlyExpectedCollection(year);
  });

  ipcMain.handle('reports:get-expense-categories', (_e, ym: string) => {
    return getExpenseCategoriesByMonth(ym);
  });

  ipcMain.handle('reports:export-monthly-csv', async (_e, ym: string) => {
    const { incomeRows, expenseRows } = getMonthlyFinancialReport(ym);
    const incomeCsv = buildCsvFromRows(
      ['id', 'student_name', 'amount', 'status', 'due_date', 'paid_date'],
      incomeRows
    );
    const expenseCsv = buildCsvFromRows(
      ['id', 'category', 'description', 'amount', 'expense_date'],
      expenseRows
    );

    const combined = [
      '# Income',
      incomeCsv,
      '',
      '# Expenses',
      expenseCsv,
    ].join('\n');

    const { filePath } = await dialog.showSaveDialog({
      title: 'Aylık Raporu Kaydet',
      defaultPath: `report-${ym}.csv`,
      filters: [{ name: 'CSV', extensions: ['csv'] }],
    });

    if (!filePath) return { saved: false };
    fs.writeFileSync(filePath, combined, 'utf-8');
    logActivity(getCurrentUserId(), 'report:export-csv', JSON.stringify({ ym, filePath }));
    return { saved: true, path: filePath };
  });
}


