import db from '../db';
import type { Paycheck, CreatePaycheckInput, UpdatePaycheckInput } from '@budget/shared';

export function getPaychecks(month?: string): Paycheck[] {
  if (month) {
    return db
      .prepare("SELECT * FROM paychecks WHERE strftime('%Y-%m', pay_date) = ? ORDER BY pay_date DESC")
      .all(month) as Paycheck[];
  }
  return db
    .prepare('SELECT * FROM paychecks ORDER BY pay_date DESC')
    .all() as Paycheck[];
}

export function getPaycheck(id: number): Paycheck {
  const row = db
    .prepare('SELECT * FROM paychecks WHERE id = ?')
    .get(id) as Paycheck | undefined;

  if (!row) throw new Error(`Paycheck ${id} not found`);
  return row;
}

export function createPaycheck(input: CreatePaycheckInput): Paycheck {
  const { lastInsertRowid } = db.prepare(`
    INSERT INTO paychecks
      (gross_cents, taxes_cents, retirement_cents, other_deductions_cents, net_cents, pay_date, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    input.gross_cents,
    input.taxes_cents,
    input.retirement_cents,
    input.other_deductions_cents,
    input.net_cents,
    input.pay_date,
    input.notes ?? null,
  );

  return db
    .prepare('SELECT * FROM paychecks WHERE id = ?')
    .get(lastInsertRowid) as Paycheck;
}

export function updatePaycheck(id: number, input: UpdatePaycheckInput): Paycheck {
  const existing = db
    .prepare('SELECT * FROM paychecks WHERE id = ?')
    .get(id) as Paycheck | undefined;

  if (!existing) throw new Error(`Paycheck ${id} not found`);

  db.prepare(`
    UPDATE paychecks
    SET gross_cents = ?,
        taxes_cents = ?,
        retirement_cents = ?,
        other_deductions_cents = ?,
        net_cents = ?,
        pay_date = ?,
        notes = ?
    WHERE id = ?
  `).run(
    input.gross_cents ?? existing.gross_cents,
    input.taxes_cents ?? existing.taxes_cents,
    input.retirement_cents ?? existing.retirement_cents,
    input.other_deductions_cents ?? existing.other_deductions_cents,
    input.net_cents ?? existing.net_cents,
    input.pay_date ?? existing.pay_date,
    'notes' in input ? (input.notes ?? null) : existing.notes,
    id,
  );

  return db
    .prepare('SELECT * FROM paychecks WHERE id = ?')
    .get(id) as Paycheck;
}

export function deletePaycheck(id: number): void {
  const { changes } = db
    .prepare('DELETE FROM paychecks WHERE id = ?')
    .run(id);

  if (changes === 0) throw new Error(`Paycheck ${id} not found`);
}
