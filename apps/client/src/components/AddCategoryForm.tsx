import { useState } from 'react';
import type { CreateCategoryInput } from '@budget/shared';

interface Props {
  onAdd: (input: CreateCategoryInput) => Promise<void>;
}

const EMPTY = { name: '', color: '#000000' };

export default function AddCategoryForm({ onAdd }: Props) {
  const [fields, setFields] = useState(EMPTY);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setFields((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

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
    <form onSubmit={handleSubmit}>
      <h2>Add Category</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <label>
        Name
        <input name="name" type="text" value={fields.name} onChange={handleChange} required />
      </label>
      <label>
        Color
        <input name="color" type="color" value={fields.color} onChange={handleChange} required />
      </label>
      <button type="submit" disabled={submitting}>
        {submitting ? 'Adding...' : 'Add'}
      </button>
    </form>
  );
}
