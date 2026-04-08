import { useState } from 'react';
import type { CreateAccountInput } from '@budget/shared';

interface Props {
  onAdd: (input: CreateAccountInput) => Promise<void>;
}

const EMPTY = { name: '', type: 'checking' as CreateAccountInput['type'] };

export default function AddAccountForm({ onAdd }: Props) {
  const [fields, setFields] = useState(EMPTY);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setFields((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await onAdd({ name: fields.name, type: fields.type });
      setFields(EMPTY);
    } catch {
      setError('Failed to add account');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-4">
      <h2 className="text-base font-semibold">Add Account</h2>
      {error && <p className="text-red-400 text-sm">{error}</p>}
      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1 text-sm text-gray-400">
          Name
          <input name="name" type="text" value={fields.name} onChange={handleChange} required
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-gray-100 focus:outline-none focus:border-indigo-500" />
        </label>
        <label className="flex flex-col gap-1 text-sm text-gray-400">
          Type
          <select name="type" value={fields.type} onChange={handleChange}
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-gray-100 focus:outline-none focus:border-indigo-500">
            <option value="checking">Checking</option>
            <option value="savings">Savings</option>
            <option value="credit">Credit</option>
            <option value="retirement">Retirement</option>
          </select>
        </label>
      </div>
      <button type="submit" disabled={submitting}
        className="w-full py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-colors disabled:opacity-50">
        {submitting ? 'Adding…' : 'Add Account'}
      </button>
    </form>
  );
}
