import { getDb } from '../connection';

export type User = {
    id?: number;
    username: string;
    password_hash: string;
    role: 'admin' | 'staff';
    created_at?: string;
    is_active: number;
};

export function ensureDefaultAdmin() {
    const admin = getDb().prepare('SELECT * FROM users WHERE username = ?').get('admin') as User | undefined;
    if (!admin) {
        console.log('Creating default admin user...');
        createUser('admin', 'admin', 'admin');
    } else {
        // Ensure password is 'admin' and user is active even if user exists
        console.log('Resetting default admin user password and status...');
        const stmt = getDb().prepare('UPDATE users SET password_hash = ?, is_active = 1 WHERE id = ?');
        stmt.run('admin', admin.id);
    }
}

export function authenticate(username: string, password: string): User | null {
    const user = getDb().prepare('SELECT * FROM users WHERE username = ? AND is_active = 1').get(username) as User | undefined;
    if (!user) return null;

    // In a real app, compare hashes. Here we assume direct comparison for simplicity 
    // or if we implemented hashing, we would do it here.
    if (user.password_hash === password) {
        return user;
    }
    return null;
}

export function createUser(username: string, password: string, role: 'admin' | 'staff') {
    // Check if user exists and is active
    const existing = getDb().prepare('SELECT id, is_active FROM users WHERE username = ?').get(username) as { id: number, is_active: number } | undefined;

    if (existing && existing.is_active) {
        throw new Error('Bu kullanıcı adı zaten kullanımda.');
    }

    // Try to update (reactivate) first - this handles the soft-deleted case
    const updateStmt = getDb().prepare('UPDATE users SET password_hash = ?, role = ?, is_active = 1 WHERE username = ?');
    const info = updateStmt.run(password, role, username);

    if (info.changes > 0) {
        // User existed and was updated (reactivated)
        return info.lastInsertRowid;
    }

    // If no rows updated, insert new user
    const insertStmt = getDb().prepare(`
    INSERT INTO users (username, password_hash, role, is_active)
    VALUES (?, ?, ?, 1)
  `);
    return insertStmt.run(username, password, role);
}

export function changePassword(userId: number, newPassword: string) {
    const stmt = getDb().prepare('UPDATE users SET password_hash = ? WHERE id = ?');
    return stmt.run(newPassword, userId);
}

export function listUsers(): User[] {
    return getDb().prepare('SELECT id, username, role, created_at FROM users WHERE is_active = 1').all() as User[];
}

export function deleteUser(id: number) {
    // Soft delete
    const stmt = getDb().prepare('UPDATE users SET is_active = 0 WHERE id = ?');
    return stmt.run(id);
}
