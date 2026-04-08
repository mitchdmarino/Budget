import { useState } from 'react';
import type { CreateTransactionInput, Account, Category } from '@budget/shared';

interface Props {
  accounts: Account[];
  categories: Category[];
  onAdd: (input: CreateTransactionInput) => Promise<void>;
}

const EMPTY = { date: '', description: '', amount: '', account_id: '', category_id: '', type: 'expense' as 'expense' | 'income' };

export default function AddTransactionForm({ accounts, categories, onAdd }: Props) {
  const [fields, setFields] = useState(EMPTY);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setFields((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const dollars = parseFloat(fields.amount);
    if (isNaN(dollars) || dollars <= 0) {
      setError('Enter a valid positive amount');
      return;
    }
    const amount_cents = Math.round(dollars * 100) * (fields.type === 'expense' ? -1 : 1);
    setError(null);
    setSubmitting(true);
    try {
      await onAdd({
        date: fields.date,
        description: fields.description,
        amount_cents,
        account_id: parseInt(fields.account_id, 10),
        category_id: fields.category_id ? parseInt(fields.category_id, 10) : null,
      });
      setFields(EMPTY);
    } catch {
      setError('Failed to add transaction');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-4">
      <h2 className="text-base font-semibold">Add Transaction</h2>
      {error && <p className="text-red-400 text-sm">{error}</p>}

      <div className="flex gap-2">
        {(['expense', 'income'] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setFields(f => ({ ...f, type: t }))}
            className={`flex-1 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              fields.type === t
                ? t === 'expense' ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1 text-sm text-gray-400">
          Date
          <input name="date" type="date" value={fields.date} onChange={handleChange} required
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-gray-100 focus:outline-none focus:border-indigo-500" />
        </label>
        <label className="flex flex-col gap-1 text-sm text-gray-400">
          Amount
          <input name="amount" type="number" step="0.01" min="0" value={fields.amount} onChange={handleChange} required
            placeholder="0.00"
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-gray-100 focus:outline-none focus:border-indigo-500" />
        </label>
      </div>

      <label className="flex flex-col gap-1 text-sm text-gray-400">
        Description
        <input name="description" type="text" value={fields.description} onChange={handleChange} required
          className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-gray-100 focus:outline-none focus:border-indigo-500" />
      </label>

      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1 text-sm text-gray-400">
          Account
          <select name="account_id" value={fields.account_id} onChange={handleChange} required
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-gray-100 focus:outline-none focus:border-indigo-500">
            <option value="">Select account</option>
            {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm text-gray-400">
          Category
          <select name="category_id" value={fields.category_id} onChange={handleChange}
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-gray-100 focus:outline-none focus:border-indigo-500">
            <option value="">Uncategorized</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </label>
      </div>

      <button type="submit" disabled={submitting}
        className="w-full py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-colors disabled:opacity-50">
        {submitting ? 'Adding…' : 'Add Transaction'}
      </button>
    </form>
  );
}
