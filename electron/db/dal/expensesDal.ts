import { getDb } from '../connection';

export function listExpenses() {
  return getDb().prepare(`
    SELECT * FROM expenses 
    WHERE is_active = 1
    ORDER BY expense_date DESC
  `).all();
}

export function createExpense(expense: any) {
  const stmt = getDb().prepare(`
    INSERT INTO expenses (
      category, description, amount, expense_date, 
      is_active
    ) VALUES (
      @category, @description, @amount, @expense_date,
      1
    )
  `);

  const safeExpense = {
    category: expense.category,
    description: expense.description || expense.title, // Handle title mapping
    amount: expense.amount,
    expense_date: expense.expense_date || expense.date // Handle date mapping
  };

  const info = stmt.run(safeExpense);
  return Number(info.lastInsertRowid);
}

export function updateExpense(id: number, expense: any) {
  const fields = Object.keys(expense).map(key => `${key} = @${key}`).join(', ');
  const stmt = getDb().prepare(`UPDATE expenses SET ${fields} WHERE id = @id`);
  return stmt.run({ ...expense, id });
}

export function deleteExpense(id: number) {
  const stmt = getDb().prepare('UPDATE expenses SET is_active = 0 WHERE id = ?');
  return stmt.run(id);
}
