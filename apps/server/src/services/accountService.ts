import db from '../db';
import type { Account, CreateAccountInput, UpdateAccountInput } from '@budget/shared';

export function getAccounts(): Account[] {
  return db
    .prepare('SELECT * FROM accounts ORDER BY name ASC')
    .all() as Account[];
}

export function getAccount(id: number): Account {
  const account = db
    .prepare('SELECT * FROM accounts WHERE id = ?')
    .get(id) as Account | undefined;

  if (!account) throw new Error(`Account ${id} not found`);

  return account;
}

export function createAccount(input: CreateAccountInput): Account {
  const { lastInsertRowid } = db
    .prepare('INSERT INTO accounts (name, type) VALUES (?, ?)')
    .run(input.name, input.type);

  return db
    .prepare('SELECT * FROM accounts WHERE id = ?')
    .get(lastInsertRowid) as Account;
}

export function updateAccount(id: number, input: UpdateAccountInput): Account {
  const existing = db
    .prepare('SELECT * FROM accounts WHERE id = ?')
    .get(id) as Account | undefined;

  if (!existing) throw new Error(`Account ${id} not found`);

  db.prepare('UPDATE accounts SET name = ?, type = ? WHERE id = ?').run(
    input.name ?? existing.name,
    input.type ?? existing.type,
    id,
  );

  return db
    .prepare('SELECT * FROM accounts WHERE id = ?')
    .get(id) as Account;
}

export function deleteAccount(id: number): void {
  const { changes } = db
    .prepare('DELETE FROM accounts WHERE id = ?')
    .run(id);

  if (changes === 0) throw new Error(`Account ${id} not found`);
}
