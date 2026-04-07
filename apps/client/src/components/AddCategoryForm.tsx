import { useState } from 'react';
import type { CreateCategoryInput } from '@budget/shared';

interface Props {
  onAdd: (input: CreateCategoryInput) => Promise<void>;
}

const PRESETS = ['#22c55e','#f97316','#a855f7','#3b82f6','#ef4444','#eab308','#14b8a6','#ec4899','#6366f1','#f43f5e'];
const EMPTY = { name: '', color: PRESETS[0] };

export default function AddCategoryForm({ onAdd }: Props) {
  const [fields, setFields] = useState(EMPTY);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await onAdd({ name: fields.name, color: fields.color });
      setFields(EMPTY);
    } catch {
      setError('Failed to add category');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-4">
      <h2 className="text-base font-semibold">Add Category</h2>
      {error && <p className="text-red-400 text-sm">{error}</p>}
      <label className="flex flex-col gap-1 text-sm text-gray-400">
        Name
        <input
          type="text" value={fields.name} onChange={e => setFields(f => ({ ...f, name: e.target.value }))} required
          className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-gray-100 focus:outline-none focus:border-indigo-500"
        />
      </label>
      <div className="flex flex-col gap-2 text-sm text-gray-400">
        Color
        <div className="flex gap-2 flex-wrap">
          {PRESETS.map(color => (
            <button
              key={color} type="button"
              onClick={() => setFields(f => ({ ...f, color }))}
              className="w-7 h-7 rounded-full transition-transform hover:scale-110"
              style={{
                backgroundColor: color,
                outline: fields.color === color ? `2px solid white` : 'none',
                outlineOffset: 2,
              }}
            />
          ))}
        </div>
      </div>
      <button type="submit" disabled={submitting}
        className="w-full py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-colors disabled:opacity-50">
        {submitting ? 'Adding…' : 'Add Category'}
      </button>
    </form>
  );
}
