import { useEffect, useState } from 'react';
import type { Account, CreateAccountInput, UpdateAccountInput } from '@budget/shared';
import * as accountsApi from '../api/accounts';

const TYPE_STYLES: Record<string, string> = {
  checking:   'bg-blue-500/20 text-blue-400',
  savings:    'bg-emerald-500/20 text-emerald-400',
  credit:     'bg-orange-500/20 text-orange-400',
  retirement: 'bg-purple-500/20 text-purple-400',
};

const ACCOUNT_TYPES = ['checking', 'savings', 'credit', 'retirement'] as const;

// ── Account Modal ──────────────────────────────────────────────────────────────

interface FormState {
  name: string;
  type: Account['type'];
}

function AccountModal({
  initial,
  onSave,
  onClose,
}: {
  initial?: Account;
  onSave: (data: CreateAccountInput | UpdateAccountInput) => Promise<void>;
  onClose: () => void;
}) {
  const [form, setForm] = useState<FormState>({
    name: initial?.name ?? '',
    type: initial?.type ?? 'checking',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!form.name.trim()) { setError('Name is required.'); return; }
    setSaving(true);
    setError('');
    try {
      await onSave({ name: form.name.trim(), type: form.type });
    } catch {
      setError('Failed to save account.');
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 w-full max-w-sm shadow-2xl">
        <h2 className="text-lg font-semibold mb-5">{initial ? 'Edit Account' : 'Add Account'}</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Name</label>
            <input
              type="text"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            />
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1">Type</label>
            <select
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm"
              value={form.type}
              onChange={e => setForm(f => ({ ...f, type: e.target.value as Account['type'] }))}
            >
              {ACCOUNT_TYPES.map(t => (
                <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
              ))}
            </select>
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

// ── Page ────────────────────────────────────────────────────────────────────────

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [error, setError] = useState<string | null>(null);
  // undefined = closed, null = new, Account = editing
  const [editing, setEditing] = useState<Account | null | undefined>(undefined);

  useEffect(() => {
    accountsApi.fetchAccounts()
      .then(setAccounts)
      .catch(() => setError('Failed to load accounts'));
  }, []);

  const handleSave = async (data: CreateAccountInput | UpdateAccountInput) => {
    if (editing?.id) {
      const updated = await accountsApi.updateAccount(editing.id, data as UpdateAccountInput);
      setAccounts(prev => prev.map(a => a.id === updated.id ? updated : a));
    } else {
      const created = await accountsApi.createAccount(data as CreateAccountInput);
      setAccounts(prev => [...prev, created]);
    }
    setEditing(undefined);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this account?')) return;
    await accountsApi.deleteAccount(id);
    setAccounts(prev => prev.filter(a => a.id !== id));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Accounts</h1>
        <button
          onClick={() => setEditing(null)}
          className="px-3 py-1.5 text-sm bg-indigo-600 hover:bg-indigo-500 rounded-lg font-medium"
        >
          + Add
        </button>
      </div>

      {error && <p className="text-red-400 text-sm">{error}</p>}

      <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800 text-left text-gray-500 text-xs uppercase tracking-wider">
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {accounts.map(a => (
              <tr key={a.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                <td className="px-4 py-3 font-medium">{a.name}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${TYPE_STYLES[a.type] ?? 'bg-gray-700 text-gray-300'}`}>
                    {a.type}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1 justify-end">
                    <button onClick={() => setEditing(a)} className="text-gray-600 hover:text-gray-300 px-1">✎</button>
                    <button onClick={() => handleDelete(a.id)} className="text-gray-600 hover:text-red-400 px-1">✕</button>
                  </div>
                </td>
              </tr>
            ))}
            {accounts.length === 0 && (
              <tr>
                <td colSpan={3} className="text-center text-gray-600 py-12">No accounts yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {editing !== undefined && (
        <AccountModal
          initial={editing ?? undefined}
          onSave={handleSave}
          onClose={() => setEditing(undefined)}
        />
      )}
    </div>
  );
}
