import { useState } from 'react';
import type { Category, UpdateCategoryInput } from '@budget/shared';
import { formatCents } from '../utils/format';

interface Props {
  categories: Category[];
  onUpdate: (id: number, input: UpdateCategoryInput) => Promise<void>;
  onDelete: (id: number) => void;
}

const PRESETS = ['#22c55e','#f97316','#a855f7','#3b82f6','#ef4444','#eab308','#14b8a6','#ec4899','#6366f1','#f43f5e'];

interface EditState {
  name: string;
  color: string;
  budget: string;
}

export default function CategoryList({ categories, onUpdate, onDelete }: Props) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editState, setEditState] = useState<EditState>({ name: '', color: '', budget: '' });
  const [saving, setSaving] = useState(false);

  function startEdit(c: Category) {
    setEditingId(c.id);
    setEditState({
      name: c.name,
      color: c.color,
      budget: c.budget_cents != null ? (c.budget_cents / 100).toFixed(2) : '',
    });
  }

  function cancelEdit() {
    setEditingId(null);
  }

  async function saveEdit(id: number) {
    setSaving(true);
    try {
      await onUpdate(id, {
        name: editState.name,
        color: editState.color,
        budget_cents: editState.budget ? Math.round(parseFloat(editState.budget) * 100) : null,
      });
      setEditingId(null);
    } finally {
      setSaving(false);
    }
  }

  if (categories.length === 0) {
    return <p className="text-gray-500 text-sm">No categories yet.</p>;
  }

  return (
    <div className="space-y-2">
      {categories.map((c) => {
        if (editingId === c.id) {
          return (
            <div key={c.id} className="bg-gray-900 border border-indigo-700 rounded-xl px-5 py-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <label className="flex flex-col gap-1 text-xs text-gray-400">
                  Name
                  <input
                    type="text"
                    value={editState.name}
                    onChange={e => setEditState(s => ({ ...s, name: e.target.value }))}
                    className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-gray-100 text-sm focus:outline-none focus:border-indigo-500"
                  />
                </label>
                <label className="flex flex-col gap-1 text-xs text-gray-400">
                  Monthly Budget
                  <input
                    type="number" step="0.01" min="0"
                    value={editState.budget}
                    onChange={e => setEditState(s => ({ ...s, budget: e.target.value }))}
                    placeholder="0.00"
                    className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-gray-100 text-sm focus:outline-none focus:border-indigo-500"
                  />
                </label>
              </div>
              <div className="flex gap-2 flex-wrap">
                {PRESETS.map(color => (
                  <button
                    key={color} type="button"
                    onClick={() => setEditState(s => ({ ...s, color }))}
                    className="w-6 h-6 rounded-full transition-transform hover:scale-110"
                    style={{
                      backgroundColor: color,
                      outline: editState.color === color ? '2px solid white' : 'none',
                      outlineOffset: 2,
                    }}
                  />
                ))}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => saveEdit(c.id)}
                  disabled={saving}
                  className="px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-colors disabled:opacity-50"
                >
                  {saving ? 'Saving…' : 'Save'}
                </button>
                <button
                  onClick={cancelEdit}
                  className="px-3 py-1 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-medium transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          );
        }

        return (
          <div key={c.id} className="flex items-center justify-between bg-gray-900 border border-gray-800 rounded-xl px-5 py-4">
            <div className="flex items-center gap-3">
              <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: c.color }} />
              <span className="font-medium">{c.name}</span>
              {c.budget_cents != null && (
                <span className="text-xs text-gray-500">{formatCents(c.budget_cents)}/mo</span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => startEdit(c)} className="text-gray-500 hover:text-gray-300 text-xs transition-colors">
                Edit
              </button>
              <button onClick={() => onDelete(c.id)} className="text-gray-600 hover:text-red-400 text-xs transition-colors">
                Delete
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
