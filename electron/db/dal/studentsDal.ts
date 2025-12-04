import { getDb } from '../connection';

export function listStudents() {
  return getDb().prepare(`
    SELECT s.*, c.name as class_name 
    FROM students s
    LEFT JOIN classes c ON s.class_id = c.id
    WHERE s.is_active = 1
  `).all();
}

export function getStudent(id: number) {
  return getDb().prepare(`
    SELECT s.*, c.name as class_name 
    FROM students s
    LEFT JOIN classes c ON s.class_id = c.id
    WHERE s.id = ? AND s.is_active = 1
  `).get(id);
}

export function createStudent(student: any) {
  const stmt = getDb().prepare(`
    INSERT INTO students (
      name, tc_no, birth_date, gender, blood_type, 
      address, notes, photo_path, class_id, 
      registration_date, status, is_active
    ) VALUES (
      @name, @tc_no, @birth_date, @gender, @blood_type,
      @address, @notes, @photo_path, @class_id,
      @registration_date, @status, 1
    )
  `);
  const info = stmt.run(student);
  return Number(info.lastInsertRowid);
}

export function updateStudent(id: number, student: any) {
  const fields = Object.keys(student).map(key => `${key} = @${key}`).join(', ');
  const stmt = getDb().prepare(`UPDATE students SET ${fields} WHERE id = @id`);
  return stmt.run({ ...student, id });
}

export function deleteStudent(id: number) {
  const stmt = getDb().prepare('UPDATE students SET is_active = 0 WHERE id = ?');
  return stmt.run(id);
}
