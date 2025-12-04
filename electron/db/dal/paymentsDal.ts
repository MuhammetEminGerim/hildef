import { getDb } from '../connection';

export function listAllPayments() {
    return getDb().prepare(`
    SELECT p.*, s.name as student_name 
    FROM payments p
    LEFT JOIN students s ON p.student_id = s.id
    WHERE p.is_active = 1
    ORDER BY p.due_date DESC
  `).all();
}

export function listPaymentsByStudent(studentId: number) {
    return getDb().prepare(`
    SELECT * FROM payments 
    WHERE student_id = ? AND is_active = 1
    ORDER BY due_date DESC
  `).all(studentId);
}

export function createPayment(payment: any) {
    const stmt = getDb().prepare(`
    INSERT INTO payments (
      student_id, amount, due_date, status, 
      type, description, is_active
    ) VALUES (
      @student_id, @amount, @due_date, @status,
      @type, @description, 1
    )
  `);
    const info = stmt.run(payment);
    return Number(info.lastInsertRowid);
}

export function updatePayment(id: number, payment: any) {
    const fields = Object.keys(payment).map(key => `${key} = @${key}`).join(', ');
    const stmt = getDb().prepare(`UPDATE payments SET ${fields} WHERE id = @id`);
    return stmt.run({ ...payment, id });
}

export function updatePaymentStatus(id: number, status: string, paidDate: string | null) {
    const stmt = getDb().prepare(`
    UPDATE payments 
    SET status = ?, paid_date = ? 
    WHERE id = ?
  `);
    return stmt.run(status, paidDate, id);
}

export function deletePayment(id: number) {
    const stmt = getDb().prepare('UPDATE payments SET is_active = 0 WHERE id = ?');
    return stmt.run(id);
}

export function applyPartialPayment(paymentId: number, amount: number, userId?: number) {
    // Transaction for partial payment
    const payment = getDb().prepare('SELECT * FROM payments WHERE id = ?').get(paymentId) as any;
    if (!payment) throw new Error('Payment not found');

    const newPaidAmount = (payment.paid_amount || 0) + amount;
    let newStatus = payment.status;

    if (newPaidAmount >= payment.amount) {
        newStatus = 'paid';
    } else {
        newStatus = 'partial';
    }

    const stmt = getDb().prepare(`
    UPDATE payments 
    SET paid_amount = ?, status = ?, paid_date = CURRENT_DATE
    WHERE id = ?
  `);
    stmt.run(newPaidAmount, newStatus, paymentId);

    // Log history
    const historyStmt = getDb().prepare(`
    INSERT INTO payment_history (payment_id, amount, created_by, created_at)
    VALUES (?, ?, ?, CURRENT_TIMESTAMP)
  `);
    historyStmt.run(paymentId, amount, userId || null);
}

export function getPaymentHistory(paymentId: number) {
    return getDb().prepare(`
    SELECT ph.*, u.username as created_by_name
    FROM payment_history ph
    LEFT JOIN users u ON ph.created_by = u.id
    WHERE ph.payment_id = ?
    ORDER BY ph.created_at DESC
  `).all(paymentId);
}
