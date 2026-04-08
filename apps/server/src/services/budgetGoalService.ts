import db from '../db';
import type { BudgetGoal, UpsertBudgetGoalInput } from '@budget/shared';

export function getBudgetGoal(month: string): BudgetGoal | undefined {
  return db
    .prepare('SELECT * FROM budget_goals WHERE month = ?')
    .get(month) as BudgetGoal | undefined;
}

export function upsertBudgetGoal(input: UpsertBudgetGoalInput): BudgetGoal {
  db.prepare(`
    INSERT INTO budget_goals (month, savings_goal_cents)
    VALUES (?, ?)
    ON CONFLICT (month) DO UPDATE SET
      savings_goal_cents = excluded.savings_goal_cents,
      updated_at         = datetime('now')
  `).run(input.month, input.savings_goal_cents);

  return db
    .prepare('SELECT * FROM budget_goals WHERE month = ?')
    .get(input.month) as BudgetGoal;
}

export function deleteBudgetGoal(month: string): void {
  db.prepare('DELETE FROM budget_goals WHERE month = ?').run(month);
}
