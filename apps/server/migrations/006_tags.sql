CREATE TABLE IF NOT EXISTS tags (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  name         TEXT    NOT NULL,
  color        TEXT    NOT NULL DEFAULT '#808080',
  limit_cents  INTEGER DEFAULT NULL,
  created_at   TEXT    NOT NULL DEFAULT (datetime('now'))
);

ALTER TABLE transactions ADD COLUMN tag_id INTEGER REFERENCES tags(id) ON DELETE SET NULL;
