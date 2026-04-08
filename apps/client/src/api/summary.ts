import axios from 'axios';
import type { MonthlySummary, MonthlyHistoryPoint, BudgetGoal, UpsertBudgetGoalInput } from '@budget/shared';

export async function fetchSummary(month: string): Promise<MonthlySummary> {
  const { data } = await axios.get<MonthlySummary>('/api/summary', { params: { month } });
  return data;
}

export async function fetchSummaryHistory(months = 6): Promise<MonthlyHistoryPoint[]> {
  const { data } = await axios.get<MonthlyHistoryPoint[]>('/api/summary/history', { params: { months } });
  return data;
}

export async function fetchBudgetGoal(month: string): Promise<BudgetGoal | null> {
  const { data } = await axios.get<BudgetGoal | null>('/api/summary/goal', { params: { month } });
  return data;
}

export async function upsertBudgetGoal(input: UpsertBudgetGoalInput): Promise<BudgetGoal> {
  const { data } = await axios.put<BudgetGoal>('/api/summary/goal', input);
  return data;
}
