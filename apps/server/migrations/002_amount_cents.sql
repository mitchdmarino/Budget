-- Migrate transactions.amount (REAL) to amount_cents (INTEGER).
-- SQLite 3.35+ required for DROP COLUMN (we're on 3.51).
ALTER TABLE transactions ADD COLUMN amount_cents INTEGER;
UPDATE transactions SET amount_cents = CAST(ROUND(amount * 100) AS INTEGER);
ALTER TABLE transactions DROP COLUMN amount;
