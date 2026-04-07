import { useEffect, useState } from 'react';
import type { Transaction, Account, Category, CreateTransactionInput } from '@budget/shared';
import * as transactionsApi from '../api/transactions';
import * as accountsApi from '../api/accounts';
import * as categoriesApi from '../api/categories';
import TransactionList from '../components/TransactionList';
import AddTransactionForm from '../components/AddTransactionForm';

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      transactionsApi.fetchTransactions(),
      accountsApi.fetchAccounts(),
      categoriesApi.fetchCategories(),
    ])
      .then(([t, a, c]) => { setTransactions(t); setAccounts(a); setCategories(c); })
      .catch(() => setError('Failed to load transactions'));
  }, []);

  async function handleAdd(input: CreateTransactionInput) {
    const created = await transactionsApi.createTransaction(input);
    setTransactions(prev => [created, ...prev]);
  }

  async function handleDelete(id: number) {
    await transactionsApi.deleteTransaction(id);
    setTransactions(prev => prev.filter(t => t.id !== id));
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Transactions</h1>
      {error && <p className="text-red-400 text-sm">{error}</p>}
      <AddTransactionForm accounts={accounts} categories={categories} onAdd={handleAdd} />
      <TransactionList transactions={transactions} categories={categories} onDelete={handleDelete} />
    </div>
  );
}
