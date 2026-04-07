import { useEffect, useState } from 'react';
import type { Category, CreateCategoryInput, UpdateCategoryInput } from '@budget/shared';
import * as categoriesApi from '../api/categories';
import { formatCents } from '../utils/format';

const PRESETS = ['#22c55e', '#f97316', '#a855f7', '#3b82f6', '#ef4444', '#eab308', '#14b8a6', '#ec4899', '#6366f1', '#f43f5e'];

// ── Category Modal ─────────────────────────────────────────────────────────────

interface FormState {
  name: string;
  color: string;
  budget: string;
}

function CategoryModal({
  initial,
  onSave,
  onClose,
}: {
  initial?: Category;
  onSave: (data: CreateCategoryInput | UpdateCategoryInput) => Promise<void>;
  onClose: () => void;
}) {
  const [form, setForm] = useState<FormState>({
    name: initial?.name ?? '',
    color: initial?.color ?? PRESETS[0],
    budget: initial?.budget_cents != null ? (initial.budget_cents / 100).toFixed(2) : '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!form.name.trim()) { setError('Name is required.'); return; }
    setSaving(true);
    setError('');
    try {
      await onSave({
        name: form.name.trim(),
        color: form.color,
        budget_cents: form.budget ? Math.round(parseFloat(form.budget) * 100) : null,
      });
    } catch {
      setError('Failed to save category.');
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 w-full max-w-sm shadow-2xl">
        <h2 className="text-lg font-semibold mb-5">{initial ? 'Edit Category' : 'Add Category'}</h2>

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
            <label className="block text-xs text-gray-500 mb-1">Monthly Budget (optional)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm"
              value={form.budget}
              onChange={e => setForm(f => ({ ...f, budget: e.target.value }))}
            />
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-2">Color</label>
            <div className="flex gap-2 flex-wrap">
              {PRESETS.map(color => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, color }))}
                  className="w-7 h-7 rounded-full transition-transform hover:scale-110"
                  style={{
                    backgroundColor: color,
                    outline: form.color === color ? '2px solid white' : 'none',
                    outlineOffset: 2,
                  }}
                />
              ))}
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

// ── Page ────────────────────────────────────────────────────────────────────────

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [error, setError] = useState<string | null>(null);
  // undefined = closed, null = new, Category = editing
  const [editing, setEditing] = useState<Category | null | undefined>(undefined);

  useEffect(() => {
    categoriesApi.fetchCategories()
      .then(setCategories)
      .catch(() => setError('Failed to load categories'));
  }, []);

  const handleSave = async (data: CreateCategoryInput | UpdateCategoryInput) => {
    if (editing?.id) {
      const updated = await categoriesApi.updateCategory(editing.id, data as UpdateCategoryInput);
      setCategories(prev => prev.map(c => c.id === updated.id ? updated : c));
    } else {
      const created = await categoriesApi.createCategory(data as CreateCategoryInput);
      setCategories(prev => [...prev, created]);
    }
    setEditing(undefined);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this category?')) return;
    await categoriesApi.deleteCategory(id);
    setCategories(prev => prev.filter(c => c.id !== id));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Categories</h1>
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
              <th className="px-4 py-3 text-right">Monthly Budget</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {categories.map(c => (
              <tr key={c.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: c.color }} />
                    <span className="font-medium">{c.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-right font-mono text-gray-400">
                  {c.budget_cents != null ? `${formatCents(c.budget_cents)}/mo` : '—'}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1 justify-end">
                    <button onClick={() => setEditing(c)} className="text-gray-600 hover:text-gray-300 px-1">✎</button>
                    <button onClick={() => handleDelete(c.id)} className="text-gray-600 hover:text-red-400 px-1">✕</button>
                  </div>
                </td>
              </tr>
            ))}
            {categories.length === 0 && (
              <tr>
                <td colSpan={3} className="text-center text-gray-600 py-12">No categories yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {editing !== undefined && (
        <CategoryModal
          initial={editing ?? undefined}
          onSave={handleSave}
          onClose={() => setEditing(undefined)}
        />
      )}
    </div>
  );
}
