import { getDb } from '../connection';

export function listStaff() {
  return getDb().prepare('SELECT * FROM staff WHERE is_active = 1').all();
}

export function listAllStaff() {
  return getDb().prepare('SELECT * FROM staff').all();
}

export function getStaff(id: number) {
  return getDb().prepare('SELECT * FROM staff WHERE id = ? AND is_active = 1').get(id);
}

export function createStaff(staff: any) {
  const stmt = getDb().prepare(`
    INSERT INTO staff (
      name, role, phone, email, 
      hire_date, salary, notes, photo_path, is_active
    ) VALUES (
      @name, @role, @phone, @email,
      @hire_date, @salary, @notes, @photo_path, 1
    )
  `);
  const info = stmt.run(staff);
  return Number(info.lastInsertRowid);
}

export function updateStaff(id: number, staff: any) {
  const fields = Object.keys(staff).map(key => `${key} = @${key}`).join(', ');
  const stmt = getDb().prepare(`UPDATE staff SET ${fields} WHERE id = @id`);
  return stmt.run({ ...staff, id });
}

export function deleteStaff(id: number) {
  const stmt = getDb().prepare('UPDATE staff SET is_active = 0 WHERE id = ?');
  return stmt.run(id);
}

export function getStaffByRole(role: string) {
  return getDb().prepare('SELECT * FROM staff WHERE role = ? AND is_active = 1').all(role);
}

export function getStaffByDepartment(department: string) {
  return getDb().prepare('SELECT * FROM staff WHERE department = ? AND is_active = 1').all(department);
}
