import { useEffect, useState } from 'react';
import type { Tag, CreateTagInput, UpdateTagInput } from '@budget/shared';
import * as tagsApi from '../api/tags';
import { formatCents } from '../utils/format';

const PRESETS = ['#22c55e', '#f97316', '#a855f7', '#3b82f6', '#ef4444', '#eab308', '#14b8a6', '#ec4899', '#6366f1', '#f43f5e'];

// ── Tag Modal ──────────────────────────────────────────────────────────────────

interface FormState {
  name: string;
  color: string;
  limit: string;
}

function TagModal({
  initial,
  onSave,
  onClose,
}: {
  initial?: Tag;
  onSave: (data: CreateTagInput | UpdateTagInput) => Promise<void>;
  onClose: () => void;
}) {
  const [form, setForm] = useState<FormState>({
    name:  initial?.name  ?? '',
    color: initial?.color ?? PRESETS[0],
    limit: initial?.limit_cents != null ? (initial.limit_cents / 100).toFixed(2) : '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');

  const handleSubmit = async () => {
    if (!form.name.trim()) { setError('Name is required.'); return; }
    setSaving(true);
    setError('');
    try {
      await onSave({
        name:        form.name.trim(),
        color:       form.color,
        limit_cents: form.limit ? Math.round(parseFloat(form.limit) * 100) : null,
      });
    } catch {
      setError('Failed to save tag.');
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 w-full max-w-sm shadow-2xl">
        <h2 className="text-lg font-semibold mb-5">{initial ? 'Edit Tag' : 'Add Tag'}</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Name</label>
            <input
              type="text"
              placeholder="e.g. Mammoth Ski Trip 2026"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            />
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1">Spending Limit (optional)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm"
              value={form.limit}
              onChange={e => setForm(f => ({ ...f, limit: e.target.value }))}
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
                    outline:       form.color === color ? '2px solid white' : 'none',
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

export default function TagsPage() {
  const [tags, setTags]   = useState<Tag[]>([]);
  const [error, setError] = useState<string | null>(null);
  // undefined = closed, null = new, Tag = editing
  const [editing, setEditing] = useState<Tag | null | undefined>(undefined);

  useEffect(() => {
    tagsApi.fetchTags()
      .then(setTags)
      .catch(() => setError('Failed to load tags'));
  }, []);

  const handleSave = async (data: CreateTagInput | UpdateTagInput) => {
    if (editing?.id) {
      const updated = await tagsApi.updateTag(editing.id, data as UpdateTagInput);
      setTags(prev => prev.map(t => t.id === updated.id ? updated : t));
    } else {
      const created = await tagsApi.createTag(data as CreateTagInput);
      setTags(prev => [...prev, created]);
    }
    setEditing(undefined);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this tag? Transactions will become untagged.')) return;
    await tagsApi.deleteTag(id);
    setTags(prev => prev.filter(t => t.id !== id));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Tags</h1>
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
              <th className="px-4 py-3 text-right">Spending Limit</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {tags.map(t => (
              <tr key={t.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: t.color }} />
                    <span className="font-medium">{t.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-right font-mono text-gray-400">
                  {t.limit_cents != null ? formatCents(t.limit_cents) : '—'}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1 justify-end">
                    <button onClick={() => setEditing(t)} className="text-gray-600 hover:text-gray-300 px-1">✎</button>
                    <button onClick={() => handleDelete(t.id)} className="text-gray-600 hover:text-red-400 px-1">✕</button>
                  </div>
                </td>
              </tr>
            ))}
            {tags.length === 0 && (
              <tr>
                <td colSpan={3} className="text-center text-gray-600 py-12">
                  No tags yet. Create one to start tracking specific events or projects.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {editing !== undefined && (
        <TagModal
          initial={editing ?? undefined}
          onSave={handleSave}
          onClose={() => setEditing(undefined)}
        />
      )}
    </div>
  );
}
