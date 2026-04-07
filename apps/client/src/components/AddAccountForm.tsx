import { useState } from 'react';
import type { CreateAccountInput } from '@budget/shared';

interface Props {
  onAdd: (input: CreateAccountInput) => Promise<void>;
}

const EMPTY = { name: '', type: '' };

export default function AddAccountForm({ onAdd }: Props) {
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
      await onAdd({ name: fields.name, type: fields.type });
      setFields(EMPTY);
    } catch {
      setError('Failed to add account');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <h2>Add Account</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <label>
        Name
        <input name="name" type="text" value={fields.name} onChange={handleChange} required />
      </label>
      <label>
        Type
        <input name="type" type="text" placeholder="e.g. credit, checking" value={fields.type} onChange={handleChange} required />
      </label>
      <button type="submit" disabled={submitting}>
        {submitting ? 'Adding...' : 'Add'}
      </button>
    </form>
  );
}
