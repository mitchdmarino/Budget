import { useState } from 'react';
import type { CreateTransactionInput } from '@budget/shared';

interface Props {
  onAdd: (input: CreateTransactionInput) => Promise<void>;
}

const EMPTY = { date: '', description: '', amount: '', account_id: '1' };

export default function AddTransactionForm({ onAdd }: Props) {
  const [fields, setFields] = useState(EMPTY);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setFields((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const amount = parseFloat(fields.amount);
    if (isNaN(amount)) {
      setError('Amount must be a number');
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await onAdd({
        date: fields.date,
        description: fields.description,
        amount,
        account_id: parseInt(fields.account_id, 10),
      });
      setFields(EMPTY);
    } catch {
      setError('Failed to add transaction');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <h2>Add Transaction</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <label>
        Date
        <input name="date" type="date" value={fields.date} onChange={handleChange} required />
      </label>
      <label>
        Description
        <input name="description" type="text" value={fields.description} onChange={handleChange} required />
      </label>
      <label>
        Amount
        <input name="amount" type="number" step="0.01" value={fields.amount} onChange={handleChange} required />
      </label>
      <label>
        Account ID
        <input name="account_id" type="number" value={fields.account_id} onChange={handleChange} required />
      </label>
      <button type="submit" disabled={submitting}>
        {submitting ? 'Adding...' : 'Add'}
      </button>
    </form>
  );
}
