import { getDb } from '../connection';

export type StudentVaccination = {
  id?: number;
  student_id: number;
  vaccine_name: string;
  vaccine_date: string;
  next_dose_date?: string | null;
  notes?: string | null;
};

export function getVaccinationsByStudent(studentId: number): StudentVaccination[] {
  const db = getDb();
  return db
    .prepare('SELECT * FROM student_vaccinations WHERE student_id = ? ORDER BY vaccine_date DESC')
    .all(studentId) as StudentVaccination[];
}

export function createVaccination(vaccination: StudentVaccination): number {
  const db = getDb();
  const stmt = db.prepare(
    `INSERT INTO student_vaccinations
      (student_id, vaccine_name, vaccine_date, next_dose_date, notes)
     VALUES (@student_id, @vaccine_name, @vaccine_date, @next_dose_date, @notes)`
  );
  const result = stmt.run(vaccination as any);
  return Number(result.lastInsertRowid);
}

export function updateVaccination(id: number, vaccination: Partial<StudentVaccination>): void {
  const db = getDb();
  const existing = db
    .prepare('SELECT * FROM student_vaccinations WHERE id = ?')
    .get(id) as StudentVaccination | undefined;
  if (!existing) throw new Error('Aşı kaydı bulunamadı');

  const merged: StudentVaccination = { ...existing, ...vaccination };
  db.prepare(
    `UPDATE student_vaccinations SET
      vaccine_name = @vaccine_name,
      vaccine_date = @vaccine_date,
      next_dose_date = @next_dose_date,
      notes = @notes
     WHERE id = @id`
  ).run({ ...merged, id } as any);
}

export function deleteVaccination(id: number): void {
  const db = getDb();
  db.prepare('DELETE FROM student_vaccinations WHERE id = ?').run(id);
}

