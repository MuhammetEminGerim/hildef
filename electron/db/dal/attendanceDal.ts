import { getDb } from '../connection';

export type AttendanceStatus = 'present' | 'absent' | 'late' | 'early_leave';
export type AbsenceReason = 'illness' | 'permission' | 'other';

export type Attendance = {
  id?: number;
  student_id: number;
  class_id: number;
  date: string; // YYYY-MM-DD
  status: AttendanceStatus;
  reason?: AbsenceReason | null;
  notes?: string | null;
  marked_by?: number | null;
  created_at?: string;
};

// Günlük yoklama kaydı oluştur/güncelle
export function saveAttendance(attendance: Attendance): number {
  const db = getDb();
  
  // Aynı gün için kayıt var mı kontrol et
  const existing = db
    .prepare('SELECT id FROM attendance WHERE student_id = ? AND class_id = ? AND date = ?')
    .get(attendance.student_id, attendance.class_id, attendance.date) as { id: number } | undefined;

  if (existing) {
    // Güncelle
    db.prepare(
      `UPDATE attendance SET
        status = ?,
        reason = ?,
        notes = ?,
        marked_by = ?
       WHERE id = ?`
    ).run(
      attendance.status,
      attendance.reason ?? null,
      attendance.notes ?? null,
      attendance.marked_by ?? null,
      existing.id
    );
    return existing.id;
  } else {
    // Yeni kayıt
    const stmt = db.prepare(
      `INSERT INTO attendance (student_id, class_id, date, status, reason, notes, marked_by)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    );
    const result = stmt.run(
      attendance.student_id,
      attendance.class_id,
      attendance.date,
      attendance.status,
      attendance.reason ?? null,
      attendance.notes ?? null,
      attendance.marked_by ?? null
    );
    return Number(result.lastInsertRowid);
  }
}

// Toplu yoklama kaydı
export function saveBulkAttendance(attendances: Attendance[]): void {
  const db = getDb();
  const stmt = db.prepare(
    `INSERT OR REPLACE INTO attendance (student_id, class_id, date, status, reason, notes, marked_by)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  );

  const transaction = db.transaction((items: Attendance[]) => {
    for (const att of items) {
      stmt.run(
        att.student_id,
        att.class_id,
        att.date,
        att.status,
        att.reason ?? null,
        att.notes ?? null,
        att.marked_by ?? null
      );
    }
  });

  transaction(attendances);
}

// Sınıf için belirli bir günün yoklamasını getir
export function getClassAttendanceByDate(classId: number, date: string): Attendance[] {
  const db = getDb();
  return db
    .prepare(
      `SELECT a.*
       FROM attendance a
       WHERE a.class_id = ? AND a.date = ?
       ORDER BY a.student_id`
    )
    .all(classId, date) as Attendance[];
}

// Öğrenci için yoklama geçmişi
export function getStudentAttendanceHistory(
  studentId: number,
  startDate?: string,
  endDate?: string
): Attendance[] {
  const db = getDb();
  let query = 'SELECT * FROM attendance WHERE student_id = ?';
  const params: any[] = [studentId];

  if (startDate) {
    query += ' AND date >= ?';
    params.push(startDate);
  }
  if (endDate) {
    query += ' AND date <= ?';
    params.push(endDate);
  }

  query += ' ORDER BY date DESC';

  return db.prepare(query).all(...params) as Attendance[];
}

// Sınıf için yoklama geçmişi
export function getClassAttendanceHistory(
  classId: number,
  startDate?: string,
  endDate?: string
): Attendance[] {
  const db = getDb();
  let query = 'SELECT * FROM attendance WHERE class_id = ?';
  const params: any[] = [classId];

  if (startDate) {
    query += ' AND date >= ?';
    params.push(startDate);
  }
  if (endDate) {
    query += ' AND date <= ?';
    params.push(endDate);
  }

  query += ' ORDER BY date DESC, student_id';

  return db.prepare(query).all(...params) as Attendance[];
}

// Bugünün yoklama özeti (tüm sınıflar için)
export function getTodayAttendanceSummary() {
  const db = getDb();
  const today = new Date().toISOString().slice(0, 10);
  
  return db
    .prepare(
      `SELECT 
        COUNT(DISTINCT a.student_id) as total_students,
        SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END) as present_count,
        SUM(CASE WHEN a.status = 'absent' THEN 1 ELSE 0 END) as absent_count,
        SUM(CASE WHEN a.status = 'late' THEN 1 ELSE 0 END) as late_count,
        SUM(CASE WHEN a.status = 'early_leave' THEN 1 ELSE 0 END) as early_leave_count
       FROM attendance a
       WHERE a.date = ?`
    )
    .get(today) as {
      total_students: number;
      present_count: number;
      absent_count: number;
      late_count: number;
      early_leave_count: number;
    };
}

// Sınıf için bugünün yoklama özeti
export function getClassTodayAttendanceSummary(classId: number) {
  const db = getDb();
  const today = new Date().toISOString().slice(0, 10);
  
  return db
    .prepare(
      `SELECT 
        COUNT(DISTINCT cs.student_id) as total_students,
        COUNT(DISTINCT CASE WHEN a.status = 'present' THEN a.student_id END) as present_count,
        COUNT(DISTINCT CASE WHEN a.status = 'absent' THEN a.student_id END) as absent_count,
        COUNT(DISTINCT CASE WHEN a.status = 'late' THEN a.student_id END) as late_count,
        COUNT(DISTINCT CASE WHEN a.status = 'early_leave' THEN a.student_id END) as early_leave_count
       FROM class_students cs
       LEFT JOIN attendance a ON cs.student_id = a.student_id AND cs.class_id = a.class_id AND a.date = ?
       WHERE cs.class_id = ? AND cs.is_active = 1`
    )
    .get(today, classId) as {
      total_students: number;
      present_count: number;
      absent_count: number;
      late_count: number;
      early_leave_count: number;
    };
}

// Yoklama kaydı sil
export function deleteAttendance(id: number): void {
  const db = getDb();
  db.prepare('DELETE FROM attendance WHERE id = ?').run(id);
}

// Öğrenci devamsızlık istatistikleri
export function getStudentAttendanceStats(
  studentId: number,
  startDate?: string,
  endDate?: string
) {
  const db = getDb();
  let query = `
    SELECT 
      COUNT(*) as total_days,
      SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) as present_days,
      SUM(CASE WHEN status = 'absent' THEN 1 ELSE 0 END) as absent_days,
      SUM(CASE WHEN status = 'late' THEN 1 ELSE 0 END) as late_days,
      SUM(CASE WHEN status = 'early_leave' THEN 1 ELSE 0 END) as early_leave_days
    FROM attendance
    WHERE student_id = ?
  `;
  const params: any[] = [studentId];

  if (startDate) {
    query += ' AND date >= ?';
    params.push(startDate);
  }
  if (endDate) {
    query += ' AND date <= ?';
    params.push(endDate);
  }

  return db.prepare(query).get(...params) as {
    total_days: number;
    present_days: number;
    absent_days: number;
    late_days: number;
    early_leave_days: number;
  };
}

