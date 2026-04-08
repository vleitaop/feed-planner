const Database = require('better-sqlite3');
const path = require('path');

// Database file stored next to this module
const DB_PATH = path.join(__dirname, 'data.db');

const db = new Database(DB_PATH);

// Enable WAL mode for better concurrent read performance
db.pragma('journal_mode = WAL');

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS posts (
    id        TEXT PRIMARY KEY,
    type      TEXT NOT NULL CHECK(type IN ('image', 'carousel', 'reel')),
    mediaUrl  TEXT NOT NULL,
    coverUrl  TEXT,
    caption   TEXT DEFAULT '',
    position  INTEGER NOT NULL UNIQUE,
    createdAt TEXT NOT NULL DEFAULT (datetime('now')),
    updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

// Migration: add caption column if it doesn't exist yet (for existing DBs)
try {
  db.prepare("SELECT caption FROM posts LIMIT 1").get();
} catch {
  db.exec("ALTER TABLE posts ADD COLUMN caption TEXT DEFAULT ''");
  console.log('✅ Migrated: added caption column');
}

module.exports = db;
