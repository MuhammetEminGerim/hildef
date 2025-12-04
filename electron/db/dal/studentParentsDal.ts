import { getDb } from '../connection';

export type StudentParent = {
  id?: number;
  student_id: number;
  name: string;
  relationship: 'mother' | 'father' | 'guardian';
  phone: string;
  email?: string | null;
  photo_path?: string | null;
  contact_preference?: 'sms' | 'email' | 'phone' | null;
  is_primary?: number;
};

export function getParentsByStudent(studentId: number): StudentParent[] {
  const db = getDb();
  return db
    .prepare('SELECT * FROM student_parents WHERE student_id = ? ORDER BY is_primary DESC, name')
    .all(studentId) as StudentParent[];
}

export function createParent(parent: StudentParent): number {
  const db = getDb();
  const stmt = db.prepare(
    `INSERT INTO student_parents
      (student_id, name, relationship, phone, email, photo_path, contact_preference, is_primary)
     VALUES (@student_id, @name, @relationship, @phone, @email, @photo_path, @contact_preference, @is_primary)`
  );
  const result = stmt.run({
    student_id: parent.student_id,
    name: parent.name,
    relationship: parent.relationship,
    phone: parent.phone,
    email: parent.email ?? null,
    photo_path: parent.photo_path ?? null,
    contact_preference: parent.contact_preference ?? null,
    is_primary: parent.is_primary ?? 0,
  });
  return Number(result.lastInsertRowid);
}

export function updateParent(id: number, parent: Partial<StudentParent>): void {
  const db = getDb();
  const existing = db
    .prepare('SELECT * FROM student_parents WHERE id = ?')
    .get(id) as StudentParent | undefined;
  if (!existing) throw new Error('Veli bulunamadı');

  const merged: StudentParent = { ...existing, ...parent };
  db.prepare(
    `UPDATE student_parents SET
      name = @name,
      relationship = @relationship,
      phone = @phone,
      email = @email,
      photo_path = @photo_path,
      contact_preference = @contact_preference,
      is_primary = @is_primary
     WHERE id = @id`
  ).run({
    id: id,
    name: merged.name,
    relationship: merged.relationship,
    phone: merged.phone,
    email: merged.email ?? null,
    photo_path: merged.photo_path ?? null,
    contact_preference: merged.contact_preference ?? null,
    is_primary: merged.is_primary ?? 0,
  });
}

export function deleteParent(id: number): void {
  const db = getDb();
  db.prepare('DELETE FROM student_parents WHERE id = ?').run(id);
}

export function setPrimaryParent(studentId: number, parentId: number): void {
  const db = getDb();
  db.transaction(() => {
    // Tüm velileri primary olmayan yap
    db.prepare('UPDATE student_parents SET is_primary = 0 WHERE student_id = ?').run(studentId);
    // Seçileni primary yap
    db.prepare('UPDATE student_parents SET is_primary = 1 WHERE id = ?').run(parentId);
  })();
}

