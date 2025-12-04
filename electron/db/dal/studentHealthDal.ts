import { getDb } from '../connection';

export type StudentHealth = {
  id?: number;
  student_id: number;
  chronic_diseases?: string | null; // JSON array
  allergies?: string | null; // JSON array
  medications?: string | null; // JSON array
  doctor_name?: string | null;
  doctor_phone?: string | null;
  insurance_info?: string | null;
  notes?: string | null;
};

export function getHealthByStudent(studentId: number): StudentHealth | undefined {
  const db = getDb();
  return db
    .prepare('SELECT * FROM student_health WHERE student_id = ?')
    .get(studentId) as StudentHealth | undefined;
}

export function createOrUpdateHealth(health: StudentHealth): void {
  const db = getDb();
  const existing = getHealthByStudent(health.student_id);
  
  if (existing) {
    db.prepare(
      `UPDATE student_health SET
        chronic_diseases = @chronic_diseases,
        allergies = @allergies,
        medications = @medications,
        doctor_name = @doctor_name,
        doctor_phone = @doctor_phone,
        insurance_info = @insurance_info,
        notes = @notes,
        updated_at = datetime('now')
       WHERE student_id = @student_id`
    ).run(health as any);
  } else {
    db.prepare(
      `INSERT INTO student_health
        (student_id, chronic_diseases, allergies, medications, doctor_name, doctor_phone, insurance_info, notes)
       VALUES (@student_id, @chronic_diseases, @allergies, @medications, @doctor_name, @doctor_phone, @insurance_info, @notes)`
    ).run(health as any);
  }
}

export function deleteHealth(studentId: number): void {
  const db = getDb();
  db.prepare('DELETE FROM student_health WHERE student_id = ?').run(studentId);
}

