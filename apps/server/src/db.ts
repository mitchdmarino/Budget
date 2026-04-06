import Database from 'better-sqlite3';
import path from 'path';

const DB_PATH = path.resolve(process.env.DB_PATH ?? 'budget.db');

const db: Database.Database = new Database(DB_PATH);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export default db;
