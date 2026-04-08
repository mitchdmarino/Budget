CREATE TABLE IF NOT EXISTS budget_goals (
  id                  INTEGER PRIMARY KEY AUTOINCREMENT,
  month               TEXT    NOT NULL UNIQUE,  -- YYYY-MM format
  savings_goal_cents  INTEGER NOT NULL DEFAULT 0,
  created_at          TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at          TEXT    NOT NULL DEFAULT (datetime('now'))
);
