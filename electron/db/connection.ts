import Database from 'better-sqlite3';
import { app } from 'electron';
import * as fs from 'fs';
import * as path from 'path';
import { runMigrations } from './migrations';

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (db) return db;

  const userDataPath = app.getPath('userData');
  const dbPath = path.join(userDataPath, 'kindergarten.db');

  db = new Database(dbPath);

  // Şema dosyasını her açılışta çalıştırıyoruz; CREATE TABLE IF NOT EXISTS
  // kullandığımız için mevcut tablolar korunur, eksik olanlar eklenir.
  const schemaPath = path.join(__dirname, 'schema.sql');
  const schemaSql = fs.readFileSync(schemaPath, 'utf-8');
  db.exec(schemaSql);

  // Migration'ları çalıştır (mevcut tablolara eksik kolonları ekler)
  runMigrations();

  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  return db;
}

export function closeDb() {
  if (db) {
    db.close();
    db = null;
  }
}


