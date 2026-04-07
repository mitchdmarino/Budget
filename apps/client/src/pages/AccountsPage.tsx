import { useEffect, useState } from 'react';
import type { Account, CreateAccountInput } from '@budget/shared';
import * as accountsApi from '../api/accounts';
import AccountList from '../components/AccountList';
import AddAccountForm from '../components/AddAccountForm';

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    accountsApi.fetchAccounts()
      .then(setAccounts)
      .catch(() => setError('Failed to load accounts'));
  }, []);

  async function handleAdd(input: CreateAccountInput) {
    const created = await accountsApi.createAccount(input);
    setAccounts(prev => [...prev, created]);
  }

  async function handleDelete(id: number) {
    await accountsApi.deleteAccount(id);
    setAccounts(prev => prev.filter(a => a.id !== id));
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Accounts</h1>
      {error && <p className="text-red-400 text-sm">{error}</p>}
      <AddAccountForm onAdd={handleAdd} />
      <AccountList accounts={accounts} onDelete={handleDelete} />
    </div>
  );
}
