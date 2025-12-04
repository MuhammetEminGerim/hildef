import { getDb } from '../connection';

export type StudentFile = {
  id?: number;
  student_id: number;
  file_name: string;
  file_path: string;
  file_type: 'health_report' | 'identity' | 'contract' | 'other';
  file_size?: number | null;
};

export function getFilesByStudent(studentId: number): StudentFile[] {
  const db = getDb();
  return db
    .prepare('SELECT * FROM student_files WHERE student_id = ? ORDER BY uploaded_at DESC')
    .all(studentId) as StudentFile[];
}

export function createFile(file: StudentFile): number {
  const db = getDb();
  const stmt = db.prepare(
    `INSERT INTO student_files
      (student_id, file_name, file_path, file_type, file_size)
     VALUES (@student_id, @file_name, @file_path, @file_type, @file_size)`
  );
  const result = stmt.run(file as any);
  return Number(result.lastInsertRowid);
}

export function deleteFile(id: number): void {
  const db = getDb();
  db.prepare('DELETE FROM student_files WHERE id = ?').run(id);
}

export function getFile(id: number): StudentFile | undefined {
  const db = getDb();
  return db
    .prepare('SELECT * FROM student_files WHERE id = ?')
    .get(id) as StudentFile | undefined;
}

