import { getDb } from '../connection';

export function listClasses() {
  return getDb().prepare('SELECT * FROM classes WHERE is_active = 1').all();
}

export function listAllClasses() {
  return getDb().prepare('SELECT * FROM classes').all();
}

export function getClass(id: number) {
  return getDb().prepare('SELECT * FROM classes WHERE id = ? AND is_active = 1').get(id);
}

export function createClass(classData: any) {
  const stmt = getDb().prepare(`
    INSERT INTO classes (name, capacity, age_group, teacher_id, is_active)
    VALUES (@name, @capacity, @age_group, @teacher_id, 1)
  `);
  const info = stmt.run(classData);
  return Number(info.lastInsertRowid);
}

export function updateClass(id: number, classData: any) {
  const fields = Object.keys(classData).map(key => `${key} = @${key}`).join(', ');
  const stmt = getDb().prepare(`UPDATE classes SET ${fields} WHERE id = @id`);
  return stmt.run({ ...classData, id });
}

export function deleteClass(id: number) {
  const db = getDb();
  const transaction = db.transaction(() => {
    // Soft delete the class
    db.prepare('UPDATE classes SET is_active = 0 WHERE id = ?').run(id);

    // Soft delete class_students associations
    db.prepare('UPDATE class_students SET is_active = 0 WHERE class_id = ?').run(id);

    // Remove class_id from students (set to NULL)
    db.prepare('UPDATE students SET class_id = NULL WHERE class_id = ?').run(id);
  });

  return transaction();
}

export function addStudentToClass(classId: number, studentId: number, enrollmentDate: string = new Date().toISOString().slice(0, 10)) {
  const db = getDb();

  // 1. Check if student is already in a class (Single Class Rule)
  const student = db.prepare('SELECT class_id FROM students WHERE id = ?').get(studentId) as { class_id: number | null };
  if (student && student.class_id) {
    throw new Error('Öğrenci zaten bir sınıfa kayıtlı. Önce mevcut sınıftan çıkarılmalıdır.');
  }

  // 2. Check Class Capacity
  const classInfo = db.prepare('SELECT capacity FROM classes WHERE id = ?').get(classId) as { capacity: number | null };
  if (classInfo && classInfo.capacity) {
    const currentCount = db.prepare('SELECT COUNT(*) as count FROM class_students WHERE class_id = ? AND is_active = 1').get(classId) as { count: number };
    if (currentCount.count >= classInfo.capacity) {
      throw new Error(`Sınıf kapasitesi dolu (${classInfo.capacity} öğrenci).`);
    }
  }

  // Insert into class_students
  const stmt = db.prepare(`
    INSERT INTO class_students (class_id, student_id, enrollment_date, is_active)
    VALUES (?, ?, ?, 1)
  `);
  const info = stmt.run(classId, studentId, enrollmentDate);

  // Also update student's class_id in students table for easier access
  db.prepare('UPDATE students SET class_id = ? WHERE id = ?').run(classId, studentId);

  return Number(info.lastInsertRowid);
}

export function removeStudentFromClass(classId: number, studentId: number) {
  const stmt = getDb().prepare(`
    UPDATE class_students 
    SET is_active = 0 
    WHERE class_id = ? AND student_id = ?
  `);
  stmt.run(classId, studentId);

  // Remove class_id from students table
  getDb().prepare('UPDATE students SET class_id = NULL WHERE id = ? AND class_id = ?').run(studentId, classId);
}

export function getClassStudents(classId: number) {
  return getDb().prepare(`
    SELECT s.*, cs.enrollment_date
    FROM students s
    JOIN class_students cs ON s.id = cs.student_id
    WHERE cs.class_id = ? AND cs.is_active = 1 AND s.is_active = 1
  `).all(classId);
}

export function getStudentClass(studentId: number) {
  return getDb().prepare(`
    SELECT c.*, cs.enrollment_date
    FROM classes c
    JOIN class_students cs ON c.id = cs.class_id
    WHERE cs.student_id = ? AND cs.is_active = 1 AND c.is_active = 1
  `).get(studentId);
}

export function getClassStudentCount(classId: number) {
  const result = getDb().prepare(`
    SELECT COUNT(*) as count
    FROM class_students
    WHERE class_id = ? AND is_active = 1
  `).get(classId) as { count: number };
  return result.count;
}
