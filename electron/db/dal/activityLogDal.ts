import { getDb } from '../connection';

export function logActivity(userId: number | null | undefined, action: string, details: string | null = null) {
    try {
        const stmt = getDb().prepare(`
      INSERT INTO activity_log (user_id, action, details, created_at)
      VALUES (?, ?, ?, CURRENT_TIMESTAMP)
    `);
        stmt.run(userId || null, action, details);
    } catch (error) {
        console.error('Activity log error:', error);
        // Don't throw, just log error
    }
}
