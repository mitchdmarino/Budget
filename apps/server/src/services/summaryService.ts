import db from '../db';
import type { MonthlySummary, MonthlyHistoryPoint, CategorySpend, TagSpend } from '@budget/shared';

export function getMonthlySummary(month: string): MonthlySummary {
  // Income: sum of positive transaction amounts
  const incomeRow = db.prepare(`
    SELECT COALESCE(SUM(amount_cents), 0) AS total
    FROM transactions
    WHERE strftime('%Y-%m', date) = ? AND amount_cents > 0
  `).get(month) as { total: number };

  // Spending: sum of negative transaction amounts (returned as positive)
  const spendingRow = db.prepare(`
    SELECT COALESCE(SUM(amount_cents), 0) AS total
    FROM transactions
    WHERE strftime('%Y-%m', date) = ? AND amount_cents < 0
  `).get(month) as { total: number };

  // Paycheck totals
  const paycheckRow = db.prepare(`
    SELECT
      COALESCE(SUM(gross_cents), 0)      AS gross,
      COALESCE(SUM(net_cents), 0)        AS net,
      COALESCE(SUM(retirement_cents), 0) AS retirement
    FROM paychecks
    WHERE strftime('%Y-%m', pay_date) = ?
  `).get(month) as { gross: number; net: number; retirement: number };

  // Savings goal
  const goalRow = db.prepare(
    'SELECT savings_goal_cents FROM budget_goals WHERE month = ?'
  ).get(month) as { savings_goal_cents: number } | undefined;

  // By-tag breakdown (expenses only, only tagged transactions)
  const byTag = db.prepare(`
    SELECT
      t.tag_id,
      tg.name  AS tag_name,
      tg.color AS tag_color,
      tg.limit_cents,
      COALESCE(SUM(t.amount_cents), 0) AS spent_raw
    FROM transactions t
    LEFT JOIN tags tg ON tg.id = t.tag_id
    WHERE strftime('%Y-%m', t.date) = ? AND t.amount_cents < 0 AND t.tag_id IS NOT NULL
    GROUP BY t.tag_id
    ORDER BY spent_raw ASC
  `).all(month) as {
    tag_id: number;
    tag_name: string;
    tag_color: string;
    limit_cents: number | null;
    spent_raw: number;
  }[];

  // By-category breakdown (expenses only)
  const byCategory = db.prepare(`
    SELECT
      t.category_id,
      c.name  AS category_name,
      c.color AS category_color,
      c.budget_cents,
      COALESCE(SUM(t.amount_cents), 0) AS spent_raw
    FROM transactions t
    LEFT JOIN categories c ON c.id = t.category_id
    WHERE strftime('%Y-%m', t.date) = ? AND t.amount_cents < 0
    GROUP BY t.category_id
    ORDER BY spent_raw ASC
  `).all(month) as {
    category_id: number | null;
    category_name: string | null;
    category_color: string | null;
    budget_cents: number | null;
    spent_raw: number;
  }[];

  const income_cents   = incomeRow.total;
  const spending_cents = Math.abs(spendingRow.total);
  const savings_cents  = income_cents - spending_cents;

  return {
    month,
    income_cents,
    spending_cents,
    savings_cents,
    savings_goal_cents: goalRow?.savings_goal_cents ?? null,
    paycheck_gross_cents:      paycheckRow.gross,
    paycheck_net_cents:        paycheckRow.net,
    paycheck_retirement_cents: paycheckRow.retirement,
    by_tag: byTag.map((row): TagSpend => ({
      tag_id:    row.tag_id,
      tag_name:  row.tag_name,
      tag_color: row.tag_color,
      limit_cents: row.limit_cents,
      spent_cents: Math.abs(row.spent_raw),
    })),
    by_category: byCategory.map((row): CategorySpend => ({
      category_id:    row.category_id,
      category_name:  row.category_name,
      category_color: row.category_color,
      budget_cents:   row.budget_cents,
      spent_cents:    Math.abs(row.spent_raw),
    })),
  };
}

export function getSummaryHistory(months = 6): MonthlyHistoryPoint[] {
  // Generate the last N YYYY-MM strings in SQLite
  const rows = db.prepare(`
    WITH RECURSIVE months(m) AS (
      SELECT strftime('%Y-%m', 'now', 'start of month')
      UNION ALL
      SELECT strftime('%Y-%m', m || '-01', '-1 month')
      FROM months
      WHERE m > strftime('%Y-%m', 'now', 'start of month', '-${months - 1} months')
    )
    SELECT
      m.m AS month,
      COALESCE(SUM(CASE WHEN t.amount_cents > 0 THEN  t.amount_cents ELSE 0 END), 0) AS income_cents,
      COALESCE(SUM(CASE WHEN t.amount_cents < 0 THEN -t.amount_cents ELSE 0 END), 0) AS spending_cents
    FROM months m
    LEFT JOIN transactions t ON strftime('%Y-%m', t.date) = m.m
    GROUP BY m.m
    ORDER BY m.m ASC
  `).all() as { month: string; income_cents: number; spending_cents: number }[];

  return rows.map((r): MonthlyHistoryPoint => ({
    month:          r.month,
    income_cents:   r.income_cents,
    spending_cents: r.spending_cents,
    savings_cents:  r.income_cents - r.spending_cents,
  }));
}
