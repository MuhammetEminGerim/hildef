import { getDb } from '../connection';

export function getSetting(key: string): string | null {
    const row = getDb().prepare('SELECT value FROM settings WHERE key = ?').get(key) as { value: string } | undefined;
    return row ? row.value : null;
}

export function setSetting(key: string, value: string) {
    const stmt = getDb().prepare(`
    INSERT INTO settings (key, value)
    VALUES (?, ?)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value
  `);
    return stmt.run(key, value);
}

export function getKindergartenInfo() {
    const name = getSetting('kindergarten_name');
    const address = getSetting('kindergarten_address');
    const phone = getSetting('kindergarten_phone');
    const logo = getSetting('kindergarten_logo');

    return { name, address, phone, logo };
}
