import { getDb } from '../connection';

export type MonthlySummary = {
  ym: string;
  income: number;
  expenses: number;
};

export function getDashboardSummary() {
  const db = getDb();

  const totalStudentsRow = db
    .prepare('SELECT COUNT(*) as count FROM students WHERE is_active = 1')
    .get() as { count: number };

  const currentMonthIncomeRow = db
    .prepare(
      `SELECT IFNULL(SUM(amount),0) as total
       FROM payments
       WHERE status = 'Paid'
         AND strftime('%Y-%m', paid_date) = strftime('%Y-%m','now')
         AND is_active = 1`
    )
    .get() as { total: number };

  const currentMonthExpensesRow = db
    .prepare(
      `SELECT IFNULL(SUM(amount),0) as total
       FROM expenses
       WHERE strftime('%Y-%m', expense_date) = strftime('%Y-%m','now')
         AND is_active = 1`
    )
    .get() as { total: number };

  const incomeSeries = db
    .prepare(
      `SELECT strftime('%Y-%m', paid_date) AS ym,
              SUM(amount) as total
       FROM payments
       WHERE status = 'Paid'
         AND paid_date >= date('now','-6 months')
         AND paid_date IS NOT NULL
         AND is_active = 1
       GROUP BY ym
       ORDER BY ym`
    )
    .all() as { ym: string; total: number }[];

  const expenseSeries = db
    .prepare(
      `SELECT strftime('%Y-%m', expense_date) AS ym,
              SUM(amount) as total
       FROM expenses
       WHERE expense_date >= date('now','-6 months')
         AND is_active = 1
       GROUP BY ym
       ORDER BY ym`
    )
    .all() as { ym: string; total: number }[];

  const currentMonthIncome = currentMonthIncomeRow.total;
  const currentMonthExpenses = currentMonthExpensesRow.total;

  return {
    totalStudents: totalStudentsRow.count,
    currentMonthIncome,
    currentMonthExpenses,
    netProfit: currentMonthIncome - currentMonthExpenses,
    incomeSeries,
    expenseSeries,
  };
}

export function getMonthlyFinancialReport(ym: string) {
  const db = getDb();

  const incomeRows = db
    .prepare(
      `SELECT p.id,
              s.name as student_name,
              p.amount,
              p.status,
              p.due_date,
              p.paid_date
       FROM payments p
       JOIN students s ON s.id = p.student_id
       WHERE strftime('%Y-%m', COALESCE(p.paid_date, p.due_date)) = ?
         AND p.is_active = 1`
    )
    .all(ym);

  const expenseRows = db
    .prepare(
      `SELECT id, category, description, amount, expense_date
       FROM expenses
       WHERE strftime('%Y-%m', expense_date) = ?
         AND is_active = 1`
    )
    .all(ym);

  return { incomeRows, expenseRows };
}

export function getYearlyFinancialReport(year: number) {
  const db = getDb();

  const incomeRows = db
    .prepare(
      `SELECT p.id,
              s.name as student_name,
              p.amount,
              p.status,
              p.due_date,
              p.paid_date
       FROM payments p
       JOIN students s ON s.id = p.student_id
       WHERE strftime('%Y', COALESCE(p.paid_date, p.due_date)) = ?
         AND p.is_active = 1`
    )
    .all(String(year));

  const expenseRows = db
    .prepare(
      `SELECT id, category, description, amount, expense_date
       FROM expenses
       WHERE strftime('%Y', expense_date) = ?
         AND is_active = 1`
    )
    .all(String(year));

  return { incomeRows, expenseRows };
}

export function getYearlyFinancialSeries(year: number) {
  const db = getDb();

  const incomeSeries = db
    .prepare(
      `SELECT strftime('%Y-%m', paid_date) AS ym,
              SUM(amount) as total
       FROM payments
       WHERE status = 'Paid'
         AND strftime('%Y', paid_date) = ?
         AND paid_date IS NOT NULL
         AND is_active = 1
       GROUP BY ym
       ORDER BY ym`
    )
    .all(String(year)) as { ym: string; total: number }[];

  const expenseSeries = db
    .prepare(
      `SELECT strftime('%Y-%m', expense_date) AS ym,
              SUM(amount) as total
       FROM expenses
       WHERE strftime('%Y', expense_date) = ?
         AND is_active = 1
       GROUP BY ym
       ORDER BY ym`
    )
    .all(String(year)) as { ym: string; total: number }[];

  return { incomeSeries, expenseSeries };
}

export function getYearlyExpectedCollection(year: number) {
  const db = getDb();

  const expectedCollection = db
    .prepare(
      `SELECT SUM(amount) as total
       FROM payments
       WHERE status != 'Paid'
         AND strftime('%Y', due_date) = ?
         AND due_date IS NOT NULL
         AND is_active = 1`
    )
    .get(String(year)) as { total: number } | undefined;

  return expectedCollection?.total || 0;
}

export function getExpenseCategoriesByMonth(ym: string) {
  const db = getDb();

  const categories = db
    .prepare(
      `SELECT category,
              SUM(amount) as total
       FROM expenses
       WHERE strftime('%Y-%m', expense_date) = ?
         AND is_active = 1
       GROUP BY category
       ORDER BY total DESC`
    )
    .all(ym) as { category: string; total: number }[];

  return categories;
}

export function buildCsvFromRows(headers: string[], rows: any[]): string {
  const escape = (value: any) => {
    if (value == null) return '';
    const str = String(value);
    if (/[",\n]/.test(str)) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const lines = [headers.map(escape).join(',')];
  for (const row of rows) {
    const values = headers.map((h) => escape((row as any)[h]));
    lines.push(values.join(','));
  }
  return lines.join('\n');
}


