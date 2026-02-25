import Database from 'better-sqlite3';
import { app } from 'electron';
import path from 'path';

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!db) {
    const dbPath = path.join(app.getPath('userData'), 'alavanca.db');
    db = new Database(dbPath);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
  }
  return db;
}

export function initDatabase(): void {
  const database = getDb();

  // Drop obsolete api_keys table from previous versions
  database.exec(`DROP TABLE IF EXISTS api_keys;`);

  database.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT
    );

    CREATE TABLE IF NOT EXISTS resumes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      filename TEXT,
      raw_text TEXT,
      structured TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS jobs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT,
      company TEXT,
      description TEXT,
      requirements TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS optimizations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      resume_id INTEGER REFERENCES resumes(id),
      job_id INTEGER REFERENCES jobs(id),
      result TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    DROP TABLE IF EXISTS ats_scores;
    CREATE TABLE IF NOT EXISTS ats_scores (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      resume_id INTEGER NOT NULL REFERENCES resumes(id) ON DELETE CASCADE,
      target_role TEXT NOT NULL,
      ats_score INTEGER NOT NULL,
      quality_score INTEGER NOT NULL,
      tips TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(resume_id, target_role)
    );

    CREATE TABLE IF NOT EXISTS linkedin_scores (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      resume_id INTEGER NOT NULL REFERENCES resumes(id) ON DELETE CASCADE,
      target_role TEXT NOT NULL,
      visibility_score INTEGER NOT NULL,
      impact_score INTEGER NOT NULL,
      tips TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(resume_id, target_role)
    );
  `);
}
