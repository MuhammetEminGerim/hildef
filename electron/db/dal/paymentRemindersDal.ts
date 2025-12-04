import { getDb } from '../connection';

export type ReminderType = 'sms' | 'email' | 'in_app';
export type ReminderStatus = 'pending' | 'sent' | 'failed';

export type PaymentReminder = {
  id?: number;
  payment_id: number;
  student_id: number;
  reminder_type: ReminderType;
  reminder_date: string;
  days_before_due: number;
  sent_at?: string | null;
  status?: ReminderStatus;
  message?: string | null;
};

export function listRemindersByPayment(paymentId: number): PaymentReminder[] {
  const db = getDb();
  return db
    .prepare('SELECT * FROM payment_reminders WHERE payment_id = ? ORDER BY reminder_date DESC')
    .all(paymentId) as PaymentReminder[];
}

export function listPendingReminders(): PaymentReminder[] {
  const db = getDb();
  const today = new Date().toISOString().slice(0, 10);
  return db
    .prepare('SELECT * FROM payment_reminders WHERE status = ? AND reminder_date <= ? ORDER BY reminder_date ASC')
    .all('pending', today) as PaymentReminder[];
}

export function createReminder(reminder: PaymentReminder): number {
  const db = getDb();
  const stmt = db.prepare(
    `INSERT INTO payment_reminders
      (payment_id, student_id, reminder_type, reminder_date, days_before_due, status, message)
     VALUES (@payment_id, @student_id, @reminder_type, @reminder_date, @days_before_due, @status, @message)`
  );
  const result = stmt.run({
    ...reminder,
    status: reminder.status || 'pending',
  } as any);
  return Number(result.lastInsertRowid);
}

export function updateReminderStatus(id: number, status: ReminderStatus, sentAt?: string): void {
  const db = getDb();
  db.prepare(
    'UPDATE payment_reminders SET status = ?, sent_at = ? WHERE id = ?'
  ).run(status, sentAt || new Date().toISOString(), id);
}

export function deleteReminder(id: number): void {
  const db = getDb();
  db.prepare('DELETE FROM payment_reminders WHERE id = ?').run(id);
}

