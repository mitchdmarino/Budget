import { useEffect, useRef, useState } from 'react';
import type { Transaction, Account, Category, CreateTransactionInput, UpdateTransactionInput } from '@budget/shared';
import * as transactionsApi from '../api/transactions';
import * as accountsApi from '../api/accounts';
import * as categoriesApi from '../api/categories';
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

// ── Transaction Modal ──────────────────────────────────────────────────────────

interface FormState {
  type: 'expense' | 'income';
  date: string;
  description: string;
  amount: string;
  account_id: string;
  category_id: string;
}

function TransactionModal({
  initial,
  accounts,
  categories,
  onSave,
  onClose,
}: {
  initial?: Transaction;
  accounts: Account[];
  categories: Category[];
  onSave: (data: CreateTransactionInput | UpdateTransactionInput) => Promise<void>;
  onClose: () => void;
}) {
  const [form, setForm] = useState<FormState>({
    type: initial ? (initial.amount_cents < 0 ? 'expense' : 'income') : 'expense',
    date: initial?.date ?? new Date().toISOString().slice(0, 10),
    description: initial?.description ?? '',
    amount: initial ? String(Math.abs(initial.amount_cents) / 100) : '',
    account_id: initial?.account_id ? String(initial.account_id) : '',
    category_id: initial?.category_id ? String(initial.category_id) : '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const set = (k: keyof FormState, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    const dollars = parseFloat(form.amount);
    if (!form.date || !form.description || isNaN(dollars) || dollars <= 0) {
      setError('Date, description, and a valid amount are required.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await onSave({
        date: form.date,
        description: form.description,
        amount_cents: Math.round(dollars * 100) * (form.type === 'expense' ? -1 : 1),
        account_id: form.account_id ? Number(form.account_id) : undefined,
        category_id: form.category_id ? Number(form.category_id) : null,
      });
    } catch {
      setError('Failed to save transaction.');
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 w-full max-w-md shadow-2xl">
        <h2 className="text-lg font-semibold mb-5">{initial ? 'Edit Transaction' : 'Add Transaction'}</h2>

        <div className="space-y-4">
          <div className="flex gap-2">
            {(['expense', 'income'] as const).map(t => (
              <button
                key={t}
                onClick={() => set('type', t)}
                className={`flex-1 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                  form.type === t
                    ? t === 'expense'
                      ? 'bg-red-500/20 border-red-500 text-red-400'
                      : 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                    : 'border-gray-700 text-gray-500 hover:border-gray-600'
                }`}
              >
                {t === 'expense' ? 'Expense' : 'Income'}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Date</label>
              <input
                type="date"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm"
                value={form.date}
                onChange={e => set('date', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Amount</label>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm"
                value={form.amount}
                onChange={e => set('amount', e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1">Description</label>
            <input
              type="text"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm"
              value={form.description}
              onChange={e => set('description', e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Account</label>
              <select
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm"
                value={form.account_id}
                onChange={e => set('account_id', e.target.value)}
              >
                <option value="">No account</option>
                {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Category</label>
              <select
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm"
                value={form.category_id}
                onChange={e => set('category_id', e.target.value)}
              >
                <option value="">Uncategorized</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>
        </div>

        {error && <p className="text-red-400 text-xs mt-3">{error}</p>}

        <div className="flex justify-end gap-3 mt-6">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-400 hover:text-gray-200">Cancel</button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="px-4 py-2 text-sm bg-indigo-600 hover:bg-indigo-500 rounded-lg font-medium disabled:opacity-50"
          >
            {saving ? 'Saving…' : initial ? 'Save' : 'Add'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Upload Modal ────────────────────────────────────────────────────────────────

function UploadModal({
  accounts,
  onDone,
  onClose,
}: {
  accounts: Account[];
  onDone: () => void;
  onClose: () => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [accountId, setAccountId] = useState('');
  const [status, setStatus] = useState<'idle' | 'uploading' | 'done' | 'error'>('idle');
  const [result, setResult] = useState<{ imported: number; skipped: number } | null>(null);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async () => {
    if (!file) return;
    setStatus('uploading');
    setError('');
    try {
      const form = new FormData();
      form.append('file', file);
      if (accountId) form.append('account_id', accountId);
      const { data } = await import('axios').then(m => m.default.post<{ imported: number; skipped: number }>('/api/transactions/upload', form));
      setResult(data);
      setStatus('done');
      onDone();
    } catch (e: unknown) {
      setError((e as { response?: { data?: { error?: string } } }).response?.data?.error ?? 'Upload failed');
      setStatus('error');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 w-full max-w-sm shadow-2xl">
        <h2 className="text-lg font-semibold mb-5">Import Bank Statement</h2>

        {status === 'done' ? (
          <div className="text-center py-4">
            <div className="text-green-400 text-2xl mb-2">✓</div>
            <div className="text-sm">Imported <strong>{result?.imported}</strong> transactions</div>
            {result?.skipped ? <div className="text-xs text-gray-500 mt-1">Skipped {result.skipped} duplicates</div> : null}
            <button onClick={onClose} className="mt-5 px-4 py-2 text-sm bg-indigo-600 hover:bg-indigo-500 rounded-lg">Done</button>
          </div>
        ) : (
          <>
            <div
              onClick={() => inputRef.current?.click()}
              className="border-2 border-dashed border-gray-700 rounded-lg p-8 text-center cursor-pointer hover:border-gray-600 mb-4"
            >
              <input ref={inputRef} type="file" accept=".pdf" className="hidden" onChange={e => setFile(e.target.files?.[0] ?? null)} />
              {file
                ? <div className="text-sm">{file.name}</div>
                : <div className="text-sm text-gray-500">Click to select PDF</div>
              }
            </div>

            <select
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm mb-4"
              value={accountId}
              onChange={e => setAccountId(e.target.value)}
            >
              <option value="">No account</option>
              {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>

            {status === 'error' && <p className="text-red-400 text-xs mb-3">{error}</p>}

            <div className="flex justify-end gap-3">
              <button onClick={onClose} className="px-4 py-2 text-sm text-gray-400 hover:text-gray-200">Cancel</button>
              <button
                onClick={handleUpload}
                disabled={!file || status === 'uploading'}
                className="px-4 py-2 text-sm bg-indigo-600 hover:bg-indigo-500 rounded-lg font-medium disabled:opacity-50"
              >
                {status === 'uploading' ? 'Importing…' : 'Import'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── Page ────────────────────────────────────────────────────────────────────────

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [month, setMonth] = useState(currentMonth);
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);
  // undefined = closed, null = new, Transaction = editing
  const [editing, setEditing] = useState<Transaction | null | undefined>(undefined);
  const [showUpload, setShowUpload] = useState(false);

  useEffect(() => {
    accountsApi.fetchAccounts().then(setAccounts).catch(() => {});
    categoriesApi.fetchCategories().then(setCategories).catch(() => {});
  }, []);

  const load = () => {
    setError(null);
    transactionsApi.fetchTransactions(month)
      .then(setTransactions)
      .catch(() => setError('Failed to load transactions'));
  };

  useEffect(() => { load(); }, [month]); // eslint-disable-line react-hooks/exhaustive-deps

  const categoryMap = Object.fromEntries(categories.map(c => [c.id, c]));
  const accountMap = Object.fromEntries(accounts.map(a => [a.id, a]));

  const filtered = search.trim()
    ? transactions.filter(t => t.description.toLowerCase().includes(search.toLowerCase()))
    : transactions;

  const handleSave = async (data: CreateTransactionInput | UpdateTransactionInput) => {
    if (editing?.id) {
      await transactionsApi.updateTransaction(editing.id, data as UpdateTransactionInput);
    } else {
      await transactionsApi.createTransaction(data as CreateTransactionInput);
    }
    setEditing(undefined);
    load();
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this transaction?')) return;
    await transactionsApi.deleteTransaction(id);
    setTransactions(prev => prev.filter(t => t.id !== id));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Transactions</h1>
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
            onClick={() => setShowUpload(true)}
            className="px-3 py-1.5 text-sm border border-gray-700 hover:border-gray-600 rounded-lg text-gray-300"
          >
            Import PDF
          </button>
          <button
            onClick={() => setEditing(null)}
            className="px-3 py-1.5 text-sm bg-indigo-600 hover:bg-indigo-500 rounded-lg font-medium"
          >
            + Add
          </button>
        </div>
      </div>

      {error && <p className="text-red-400 text-sm">{error}</p>}

      <input
        type="text"
        placeholder="Search transactions…"
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-gray-100 text-sm placeholder-gray-500 focus:outline-none focus:border-indigo-500"
      />

      {/* Table */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800 text-left text-gray-500 text-xs uppercase tracking-wider">
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Description</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Account</th>
              <th className="px-4 py-3 text-right">Amount</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(t => {
              const cat = t.category_id ? categoryMap[t.category_id] : null;
              const acct = accountMap[t.account_id];
              return (
                <tr key={t.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                  <td className="px-4 py-3 text-gray-400 whitespace-nowrap">{t.date}</td>
                  <td className="px-4 py-3 max-w-xs truncate">{t.description}</td>
                  <td className="px-4 py-3">
                    {cat ? (
                      <span
                        className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium"
                        style={{ backgroundColor: `${cat.color}22`, color: cat.color }}
                      >
                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: cat.color }} />
                        {cat.name}
                      </span>
                    ) : (
                      <span className="text-gray-600 text-xs">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{acct?.name ?? '—'}</td>
                  <td className={`px-4 py-3 text-right font-mono font-medium ${t.amount_cents < 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                    {formatCents(t.amount_cents)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 justify-end">
                      <button onClick={() => setEditing(t)} className="text-gray-600 hover:text-gray-300 px-1">✎</button>
                      <button onClick={() => handleDelete(t.id)} className="text-gray-600 hover:text-red-400 px-1">✕</button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center text-gray-600 py-12">
                  {search ? 'No matching transactions.' : 'No transactions this month.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {editing !== undefined && (
        <TransactionModal
          initial={editing ?? undefined}
          accounts={accounts}
          categories={categories}
          onSave={handleSave}
          onClose={() => setEditing(undefined)}
        />
      )}
      {showUpload && (
        <UploadModal
          accounts={accounts}
          onDone={load}
          onClose={() => setShowUpload(false)}
        />
      )}
    </div>
  );
}
