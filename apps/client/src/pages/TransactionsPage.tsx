import { useEffect, useState } from 'react';
import type { Transaction, Account, Category, CreateTransactionInput } from '@budget/shared';
import * as transactionsApi from '../api/transactions';
import * as accountsApi from '../api/accounts';
import * as categoriesApi from '../api/categories';
import TransactionList from '../components/TransactionList';
import AddTransactionForm from '../components/AddTransactionForm';

function currentMonth(): string {
  return new Date().toISOString().slice(0, 7);
}

function shiftMonth(month: string, delta: number): string {
  const [y, m] = month.split('-').map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function formatMonthLabel(month: string): string {
  const [y, m] = month.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [month, setMonth] = useState(currentMonth);
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    accountsApi.fetchAccounts().then(setAccounts).catch(() => {});
    categoriesApi.fetchCategories().then(setCategories).catch(() => {});
  }, []);

  useEffect(() => {
    setError(null);
    transactionsApi.fetchTransactions(month)
      .then(setTransactions)
      .catch(() => setError('Failed to load transactions'));
  }, [month]);

  async function handleAdd(input: CreateTransactionInput) {
    const created = await transactionsApi.createTransaction(input);
    // If created transaction falls in current month, prepend it
    if (created.date.startsWith(month)) {
      setTransactions(prev => [created, ...prev]);
    }
  }

  async function handleDelete(id: number) {
    await transactionsApi.deleteTransaction(id);
    setTransactions(prev => prev.filter(t => t.id !== id));
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Transactions</h1>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setMonth(m => shiftMonth(m, -1))}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-100 hover:bg-gray-800 transition-colors"
            aria-label="Previous month"
          >
            ‹
          </button>
          <span className="min-w-[140px] text-center text-sm text-gray-200">{formatMonthLabel(month)}</span>
          <button
            onClick={() => setMonth(m => shiftMonth(m, 1))}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-100 hover:bg-gray-800 transition-colors"
            aria-label="Next month"
          >
            ›
          </button>
        </div>
      </div>

      {error && <p className="text-red-400 text-sm">{error}</p>}

      <AddTransactionForm accounts={accounts} categories={categories} onAdd={handleAdd} />

      <div>
        <input
          type="text"
          placeholder="Search transactions…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-gray-100 text-sm placeholder-gray-500 focus:outline-none focus:border-indigo-500 mb-4"
        />
        <TransactionList
          transactions={transactions}
          categories={categories}
          search={search}
          onDelete={handleDelete}
        />
      </div>
    </div>
  );
}
