import { getDb } from '../connection';

export type PaymentPlanType = 'monthly' | 'quarterly' | 'semi_annual' | 'annual' | 'custom';

export type PaymentPlan = {
  id?: number;
  student_id: number;
  plan_name: string;
  plan_type: PaymentPlanType;
  start_date: string;
  end_date?: string | null;
  monthly_amount: number;
  total_amount?: number | null;
  discount_amount?: number;
  discount_percent?: number;
  is_active?: number;
};

export function listPaymentPlansByStudent(studentId: number): PaymentPlan[] {
  const db = getDb();
  return db
    .prepare('SELECT * FROM payment_plans WHERE student_id = ? AND is_active = 1 ORDER BY start_date DESC')
    .all(studentId) as PaymentPlan[];
}

export function getPaymentPlan(id: number): PaymentPlan | undefined {
  const db = getDb();
  return db
    .prepare('SELECT * FROM payment_plans WHERE id = ? AND is_active = 1')
    .get(id) as PaymentPlan | undefined;
}

export function createPaymentPlan(plan: PaymentPlan): number {
  const db = getDb();
  const stmt = db.prepare(
    `INSERT INTO payment_plans
      (student_id, plan_name, plan_type, start_date, end_date, monthly_amount, total_amount, discount_amount, discount_percent, is_active)
     VALUES (@student_id, @plan_name, @plan_type, @start_date, @end_date, @monthly_amount, @total_amount, @discount_amount, @discount_percent, @is_active)`
  );
  const result = stmt.run({
    ...plan,
    is_active: plan.is_active ?? 1,
    discount_amount: plan.discount_amount ?? 0,
    discount_percent: plan.discount_percent ?? 0,
  } as any);
  return Number(result.lastInsertRowid);
}

export function updatePaymentPlan(id: number, plan: Partial<PaymentPlan>): void {
  const db = getDb();
  const existing = getPaymentPlan(id);
  if (!existing) throw new Error('Taksit planı bulunamadı');

  const merged: PaymentPlan = { ...existing, ...plan };
  db.prepare(
    `UPDATE payment_plans SET
      plan_name = @plan_name,
      plan_type = @plan_type,
      start_date = @start_date,
      end_date = @end_date,
      monthly_amount = @monthly_amount,
      total_amount = @total_amount,
      discount_amount = @discount_amount,
      discount_percent = @discount_percent,
      is_active = @is_active
     WHERE id = @id`
  ).run({ ...merged, id } as any);
}

export function deletePaymentPlan(id: number): void {
  const db = getDb();
  db.prepare('UPDATE payment_plans SET is_active = 0 WHERE id = ?').run(id);
}

export function generatePaymentsFromPlan(planId: number): number[] {
  const db = getDb();
  const plan = getPaymentPlan(planId);
  if (!plan) throw new Error('Taksit planı bulunamadı');

  const paymentIds: number[] = [];
  const startDate = new Date(plan.start_date);
  let currentDate = new Date(startDate);

  let months = 12; // Default annual
  if (plan.plan_type === 'monthly') months = 1;
  else if (plan.plan_type === 'quarterly') months = 3;
  else if (plan.plan_type === 'semi_annual') months = 6;
  else if (plan.plan_type === 'annual') months = 12;

  const endDate = plan.end_date ? new Date(plan.end_date) : null;
  const maxPayments = endDate
    ? Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 30))
    : months;

  for (let i = 0; i < maxPayments; i++) {
    const dueDate = new Date(currentDate);
    dueDate.setMonth(dueDate.getMonth() + i);

    const amount = plan.monthly_amount;
    const discountAmount = plan.discount_amount || 0;
    const finalAmount = amount - discountAmount;

    const paymentId = db
      .prepare(
        `INSERT INTO payments
          (student_id, payment_plan_id, amount, original_amount, discount_amount, due_date, status)
         VALUES (?, ?, ?, ?, ?, ?, 'Pending')`
      )
      .run(
        plan.student_id,
        planId,
        finalAmount,
        amount,
        discountAmount,
        dueDate.toISOString().slice(0, 10)
      ).lastInsertRowid;

    paymentIds.push(Number(paymentId));
  }

  return paymentIds;
}

