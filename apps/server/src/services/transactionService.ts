import db from '../db';
import type { Transaction, CreateTransactionInput, UpdateTransactionInput } from '@budget/shared';

function applyCategory(description: string, categoryId: number): void {
  db.prepare(
    'UPDATE transactions SET category_id = ? WHERE description = ?'
  ).run(categoryId, description);
}

export function getTransactions(month?: string): Transaction[] {
  if (month) {
    return db
      .prepare("SELECT * FROM transactions WHERE strftime('%Y-%m', date) = ? ORDER BY date DESC")
      .all(month) as Transaction[];
  }
  return db
    .prepare('SELECT * FROM transactions ORDER BY date DESC')
    .all() as Transaction[];
}

export function createTransaction(input: CreateTransactionInput): Transaction {
  // Auto-categorize: if no category given, check if a prior transaction with the same
  // description already has one and reuse it.
  let resolvedCategoryId = input.category_id ?? null;
  if (resolvedCategoryId == null) {
    const match = db.prepare(
      'SELECT category_id FROM transactions WHERE description = ? AND category_id IS NOT NULL LIMIT 1'
    ).get(input.description) as { category_id: number } | undefined;
    if (match) resolvedCategoryId = match.category_id;
  }

  const { lastInsertRowid } = db.prepare(`
    INSERT INTO transactions (amount_cents, date, description, category_id, account_id)
    VALUES (?, ?, ?, ?, ?)
  `).run(
    input.amount_cents,
    input.date,
    input.description,
    resolvedCategoryId,
    input.account_id,
  );

  if (resolvedCategoryId != null) {
    applyCategory(input.description, resolvedCategoryId);
  }

  return db
    .prepare('SELECT * FROM transactions WHERE id = ?')
    .get(lastInsertRowid) as Transaction;
}

export function updateTransaction(id: number, input: UpdateTransactionInput): Transaction {
  const existing = db
    .prepare('SELECT * FROM transactions WHERE id = ?')
    .get(id) as Transaction | undefined;

  if (!existing) throw new Error(`Transaction ${id} not found`);

  const description = input.description ?? existing.description;
  const newCategoryId = 'category_id' in input ? (input.category_id ?? null) : existing.category_id;
  const categoryChanged = newCategoryId !== existing.category_id;

  db.prepare(`
    UPDATE transactions
    SET amount_cents = ?, date = ?, description = ?, category_id = ?, account_id = ?
    WHERE id = ?
  `).run(
    input.amount_cents ?? existing.amount_cents,
    input.date ?? existing.date,
    description,
    newCategoryId,
    input.account_id ?? existing.account_id,
    id,
  );

  if (categoryChanged && newCategoryId != null) {
    applyCategory(description, newCategoryId);
  }

  return db
    .prepare('SELECT * FROM transactions WHERE id = ?')
    .get(id) as Transaction;
}

export function deleteTransaction(id: number): void {
  const { changes } = db
    .prepare('DELETE FROM transactions WHERE id = ?')
    .run(id);

  if (changes === 0) throw new Error(`Transaction ${id} not found`);
}

interface ParsedBankTransaction {
  posted_at: string;   // parser uses posted_at; we store as `date`
  description: string;
  amount_cents: number;
}

export function importTransactions(
  rows: ParsedBankTransaction[],
  accountId: number | null,
): { imported: number; skipped: number } {
  const insert = db.prepare(
    'INSERT INTO transactions (account_id, category_id, description, amount_cents, date) VALUES (?, ?, ?, ?, ?)'
  );

  const findCategory = db.prepare(
    `SELECT category_id FROM transactions
     WHERE lower(description) = lower(?) AND category_id IS NOT NULL
     ORDER BY date DESC LIMIT 1`
  );

  const isDuplicate = db.prepare(
    `SELECT 1 FROM transactions
     WHERE account_id IS ? AND description = ? AND amount_cents = ? AND date = ?
     LIMIT 1`
  );

  let imported = 0;
  let skipped = 0;

  db.transaction(() => {
    for (const row of rows) {
      const dup = isDuplicate.get(accountId, row.description, row.amount_cents, row.posted_at);
      if (dup) { skipped++; continue; }

      const match = findCategory.get(row.description) as { category_id: number } | undefined;
      insert.run(accountId, match?.category_id ?? null, row.description, row.amount_cents, row.posted_at);
      imported++;
    }
  })();

  return { imported, skipped };
}
