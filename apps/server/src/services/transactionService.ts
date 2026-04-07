import db from '../db';
import type { Transaction, CreateTransactionInput, UpdateTransactionInput } from '@budget/shared';

function applyCategory(description: string, categoryId: number): void {
  db.prepare(
    'UPDATE transactions SET category_id = ? WHERE description = ?'
  ).run(categoryId, description);
}

export function getTransactions(): Transaction[] {
  return db
    .prepare('SELECT * FROM transactions ORDER BY date DESC')
    .all() as Transaction[];
}

export function createTransaction(input: CreateTransactionInput): Transaction {
  const { lastInsertRowid } = db.prepare(`
    INSERT INTO transactions (amount_cents, date, description, category_id, account_id)
    VALUES (?, ?, ?, ?, ?)
  `).run(
    input.amount_cents,
    input.date,
    input.description,
    input.category_id ?? null,
    input.account_id,
  );

  if (input.category_id != null) {
    applyCategory(input.description, input.category_id);
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
