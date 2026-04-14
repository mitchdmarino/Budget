import { useEffect, useState } from 'react';
import type { MonthlySummary, MonthlyHistoryPoint, CategorySpend, TagSpend } from '@budget/shared';
import * as summaryApi from '../api/summary';
import { formatCents } from '../utils/format';

// ── Helpers ────────────────────────────────────────────────────────────────────

function currentMonth(): string {
  return new Date().toISOString().slice(0, 7);
}

function shiftMonth(month: string, delta: number): string {
  const [y, m] = month.split('-').map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function formatMonthLabel(month: string): string {
  const [y, m] = month.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

function formatMonthShort(month: string): string {
  const [y, m] = month.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
}

// ── Savings Goal Modal ─────────────────────────────────────────────────────────

function SavingsGoalModal({
  month,
  currentGoal,
  onSave,
  onClose,
}: {
  month: string;
  currentGoal: number | null;
  onSave: (cents: number) => Promise<void>;
  onClose: () => void;
}) {
  const [value, setValue] = useState(currentGoal != null ? (currentGoal / 100).toFixed(2) : '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    const dollars = parseFloat(value);
    if (isNaN(dollars) || dollars < 0) {
      setError('Enter a valid amount.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await onSave(Math.round(dollars * 100));
    } catch {
      setError('Failed to save goal.');
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 w-full max-w-sm shadow-2xl">
        <h2 className="text-lg font-semibold mb-1">Set Savings Goal</h2>
        <p className="text-xs text-gray-500 mb-5">{formatMonthLabel(month)}</p>

        <div>
          <label className="block text-xs text-gray-500 mb-1">Target Savings ($)</label>
          <input
            type="number"
            step="0.01"
            placeholder="0.00"
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm"
            value={value}
            onChange={e => setValue(e.target.value)}
            autoFocus
          />
        </div>

        {error && <p className="text-red-400 text-xs mt-3">{error}</p>}

        <div className="flex justify-end gap-3 mt-6">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-400 hover:text-gray-200">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="px-4 py-2 text-sm bg-indigo-600 hover:bg-indigo-500 rounded-lg font-medium disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Stat Card ──────────────────────────────────────────────────────────────────

function StatCard({ label, value, color = 'text-white', sub }: {
  label: string;
  value: string;
  color?: string;
  sub?: string;
}) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl px-5 py-4">
      <div className="text-xs text-gray-500 mb-1">{label}</div>
      <div className={`text-xl font-semibold font-mono ${color}`}>{value}</div>
      {sub && <div className="text-xs text-gray-600 mt-1">{sub}</div>}
    </div>
  );
}

// ── Category Progress Bar ──────────────────────────────────────────────────────

function CategoryBar({ cat }: { cat: CategorySpend }) {
  const pct = cat.budget_cents && cat.budget_cents > 0
    ? Math.min((cat.spent_cents / cat.budget_cents) * 100, 100)
    : null;
  const over = cat.budget_cents != null && cat.spent_cents > cat.budget_cents;
  const color = cat.category_color ?? '#6366f1';

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
          <span className="text-sm text-gray-300">{cat.category_name ?? 'Uncategorized'}</span>
        </div>
        <div className="flex items-center gap-3 text-xs font-mono">
          <span className={over ? 'text-red-400' : 'text-gray-200'}>{formatCents(cat.spent_cents)}</span>
          {cat.budget_cents != null && (
            <span className="text-gray-600">/ {formatCents(cat.budget_cents)}</span>
          )}
        </div>
      </div>
      {pct != null && (
        <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${pct}%`,
              backgroundColor: over ? '#f87171' : color,
            }}
          />
        </div>
      )}
    </div>
  );
}

// ── Tag Progress Bar ───────────────────────────────────────────────────────────

function TagBar({ tag }: { tag: TagSpend }) {
  const pct = tag.limit_cents && tag.limit_cents > 0
    ? Math.min((tag.spent_cents / tag.limit_cents) * 100, 100)
    : null;
  const over = tag.limit_cents != null && tag.spent_cents > tag.limit_cents;
  const color = tag.tag_color ?? '#6366f1';

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
          <span className="text-sm text-gray-300">{tag.tag_name ?? 'Unknown'}</span>
        </div>
        <div className="flex items-center gap-3 text-xs font-mono">
          <span className={over ? 'text-red-400' : 'text-gray-200'}>{formatCents(tag.spent_cents)}</span>
          {tag.limit_cents != null && (
            <span className="text-gray-600">/ {formatCents(tag.limit_cents)}</span>
          )}
        </div>
      </div>
      {pct != null && (
        <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${pct}%`,
              backgroundColor: over ? '#f87171' : color,
            }}
          />
        </div>
      )}
    </div>
  );
}

// ── History Bar Chart ──────────────────────────────────────────────────────────

function HistoryChart({ history }: { history: MonthlyHistoryPoint[] }) {
  if (history.length === 0) return null;

  const maxVal = Math.max(...history.map(h => Math.max(h.income_cents, h.spending_cents)), 1);

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl px-5 py-4">
      <h2 className="text-sm font-semibold text-gray-300 mb-4">6-Month Trend</h2>
      <div className="flex items-end gap-3 h-32">
        {history.map(h => {
          const incomePct  = (h.income_cents  / maxVal) * 100;
          const spendPct   = (h.spending_cents / maxVal) * 100;
          return (
            <div key={h.month} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full flex items-end gap-0.5 h-24">
                <div
                  className="flex-1 rounded-t bg-emerald-500/70 min-h-[2px]"
                  style={{ height: `${incomePct}%` }}
                  title={`Income: ${formatCents(h.income_cents)}`}
                />
                <div
                  className="flex-1 rounded-t bg-red-500/70 min-h-[2px]"
                  style={{ height: `${spendPct}%` }}
                  title={`Spending: ${formatCents(h.spending_cents)}`}
                />
              </div>
              <span className="text-xs text-gray-600">{formatMonthShort(h.month)}</span>
            </div>
          );
        })}
      </div>
      <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-sm bg-emerald-500/70" />Income</span>
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-sm bg-red-500/70" />Spending</span>
      </div>
    </div>
  );
}

// ── Page ────────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [month, setMonth] = useState(currentMonth);
  const [summary, setSummary] = useState<MonthlySummary | null>(null);
  const [history, setHistory] = useState<MonthlyHistoryPoint[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showGoalModal, setShowGoalModal] = useState(false);

  const loadSummary = () => {
    setError(null);
    summaryApi.fetchSummary(month)
      .then(setSummary)
      .catch(() => setError('Failed to load summary.'));
  };

  useEffect(() => { loadSummary(); }, [month]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    summaryApi.fetchSummaryHistory(6).then(setHistory).catch(() => {});
  }, []);

  const handleSaveGoal = async (cents: number) => {
    await summaryApi.upsertBudgetGoal({ month, savings_goal_cents: cents });
    setShowGoalModal(false);
    loadSummary();
  };

  const savingsPct = summary && summary.savings_goal_cents
    ? Math.min((summary.savings_cents / summary.savings_goal_cents) * 100, 100)
    : null;
  const savingsOver = summary && summary.savings_goal_cents != null
    ? summary.savings_cents >= summary.savings_goal_cents
    : false;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setMonth(m => shiftMonth(m, -1))}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-100 hover:bg-gray-800 transition-colors"
              aria-label="Previous month"
            >
              ‹
            </button>
            <span className="min-w-[140px] text-center text-sm text-gray-200">{formatMonthLabel(month)}</span>
            <button
              onClick={() => setMonth(m => shiftMonth(m, 1))}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-100 hover:bg-gray-800 transition-colors"
              aria-label="Next month"
            >
              ›
            </button>
          </div>
          <button
            onClick={() => setShowGoalModal(true)}
            className="px-3 py-1.5 text-sm border border-gray-700 hover:border-gray-600 rounded-lg text-gray-300"
          >
            Set Goal
          </button>
        </div>
      </div>

      {error && <p className="text-red-400 text-sm">{error}</p>}

      {summary && (
        <>
          {/* Stat cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Income (transactions)"
              value={formatCents(summary.income_cents)}
              color="text-emerald-400"
            />
            <StatCard
              label="Spending"
              value={formatCents(summary.spending_cents)}
              color="text-red-400"
            />
            <StatCard
              label="Saved"
              value={formatCents(summary.savings_cents)}
              color={summary.savings_cents >= 0 ? 'text-white' : 'text-red-400'}
              sub={summary.savings_goal_cents != null
                ? `Goal: ${formatCents(summary.savings_goal_cents)}`
                : undefined}
            />
            <StatCard
              label="Paycheck (net)"
              value={formatCents(summary.paycheck_net_cents)}
              color="text-indigo-400"
              sub={summary.paycheck_gross_cents > 0
                ? `Gross: ${formatCents(summary.paycheck_gross_cents)}`
                : undefined}
            />
          </div>

          {/* Savings goal progress bar */}
          {savingsPct != null && (
            <div className="bg-gray-900 border border-gray-800 rounded-xl px-5 py-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-300">Savings Goal Progress</span>
                <span className={`text-xs font-mono ${savingsOver ? 'text-emerald-400' : 'text-gray-400'}`}>
                  {formatCents(summary.savings_cents)} / {formatCents(summary.savings_goal_cents!)}
                </span>
              </div>
              <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${savingsOver ? 'bg-emerald-500' : 'bg-indigo-500'}`}
                  style={{ width: `${savingsPct}%` }}
                />
              </div>
            </div>
          )}

          {/* By-category breakdown */}
          {summary.by_category.length > 0 && (
            <div className="bg-gray-900 border border-gray-800 rounded-xl px-5 py-4">
              <h2 className="text-sm font-semibold text-gray-300 mb-4">Spending by Category</h2>
              <div className="space-y-4">
                {summary.by_category.map((cat, i) => (
                  <CategoryBar key={cat.category_id ?? `uncat-${i}`} cat={cat} />
                ))}
              </div>
            </div>
          )}

          {/* By-tag breakdown */}
          {summary.by_tag.length > 0 && (
            <div className="bg-gray-900 border border-gray-800 rounded-xl px-5 py-4">
              <h2 className="text-sm font-semibold text-gray-300 mb-4">Spending by Tag</h2>
              <div className="space-y-4">
                {summary.by_tag.map(tag => (
                  <TagBar key={tag.tag_id} tag={tag} />
                ))}
              </div>
            </div>
          )}

          {/* Paycheck detail strip */}
          {summary.paycheck_gross_cents > 0 && (
            <div className="grid grid-cols-3 gap-4">
              <StatCard label="Gross Pay" value={formatCents(summary.paycheck_gross_cents)} />
              <StatCard label="Retirement Contributions" value={formatCents(summary.paycheck_retirement_cents)} color="text-indigo-400" />
              <StatCard label="Net Pay" value={formatCents(summary.paycheck_net_cents)} color="text-emerald-400" />
            </div>
          )}
        </>
      )}

      {/* 6-month trend */}
      <HistoryChart history={history} />

      {showGoalModal && (
        <SavingsGoalModal
          month={month}
          currentGoal={summary?.savings_goal_cents ?? null}
          onSave={handleSaveGoal}
          onClose={() => setShowGoalModal(false)}
        />
      )}
    </div>
  );
}
