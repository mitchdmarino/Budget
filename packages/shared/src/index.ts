// Shared types used across server, client, and electron

export interface Transaction {
  id: number;
  date: string;
  description: string;
  amount_cents: number;
  category_id: number | null;
  account_id: number;
  created_at: string;
}

export interface Category {
  id: number;
  name: string;
  color: string;
  budget_cents: number | null;
}

export interface Account {
  id: number;
  name: string;
  type: 'checking' | 'savings' | 'credit' | 'retirement';
}

export interface CreateTransactionInput {
  amount_cents: number;
  date: string;
  description: string;
  category_id?: number | null;
  account_id: number;
}

export interface UpdateTransactionInput {
  amount_cents?: number;
  date?: string;
  description?: string;
  category_id?: number | null;
  account_id?: number;
}

export interface CreateCategoryInput {
  name: string;
  color: string;
  budget_cents?: number | null;
}

export interface UpdateCategoryInput {
  name?: string;
  color?: string;
  budget_cents?: number | null;
}

export interface Paycheck {
  id: number;
  gross_cents: number;
  taxes_cents: number;
  retirement_cents: number;
  other_deductions_cents: number;
  net_cents: number;
  pay_date: string;
  notes: string | null;
  created_at: string;
}

export interface CreatePaycheckInput {
  gross_cents: number;
  taxes_cents: number;
  retirement_cents: number;
  other_deductions_cents: number;
  net_cents: number;
  pay_date: string;
  notes?: string | null;
}

export interface UpdatePaycheckInput {
  gross_cents?: number;
  taxes_cents?: number;
  retirement_cents?: number;
  other_deductions_cents?: number;
  net_cents?: number;
  pay_date?: string;
  notes?: string | null;
}

export interface BudgetGoal {
  id: number;
  month: string;              // YYYY-MM
  savings_goal_cents: number;
  created_at: string;
  updated_at: string;
}

export interface UpsertBudgetGoalInput {
  month: string;              // YYYY-MM
  savings_goal_cents: number;
}

// ── Summary types ──────────────────────────────────────────────────────────────

export interface CategorySpend {
  category_id: number | null;
  category_name: string | null;
  category_color: string | null;
  budget_cents: number | null;
  spent_cents: number;        // sum of negative (expense) transactions, as positive value
}

export interface MonthlySummary {
  month: string;              // YYYY-MM
  income_cents: number;       // sum of positive transactions
  spending_cents: number;     // sum of negative transactions, as positive value
  savings_cents: number;      // income - spending
  savings_goal_cents: number | null;
  paycheck_gross_cents: number;
  paycheck_net_cents: number;
  paycheck_retirement_cents: number;
  by_category: CategorySpend[];
}

export interface MonthlyHistoryPoint {
  month: string;
  income_cents: number;
  spending_cents: number;
  savings_cents: number;
}

export interface CreateAccountInput {
  name: string;
  type: 'checking' | 'savings' | 'credit' | 'retirement';
}

export interface UpdateAccountInput {
  name?: string;
  type?: 'checking' | 'savings' | 'credit' | 'retirement';
}

