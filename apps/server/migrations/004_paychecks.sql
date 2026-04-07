CREATE TABLE IF NOT EXISTS paychecks (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  gross_cents       INTEGER NOT NULL,
  taxes_cents       INTEGER NOT NULL DEFAULT 0,
  retirement_cents  INTEGER NOT NULL DEFAULT 0,
  other_deductions_cents INTEGER NOT NULL DEFAULT 0,
  net_cents         INTEGER NOT NULL,
  pay_date          TEXT    NOT NULL,
  notes             TEXT,
  created_at        TEXT    NOT NULL DEFAULT (datetime('now'))
);
