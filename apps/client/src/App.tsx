import { useEffect, useState } from 'react';
import type { Transaction, Account, Category, CreateTransactionInput, CreateAccountInput, CreateCategoryInput } from '@budget/shared';
import * as transactionsApi from './api/transactions';
import * as accountsApi from './api/accounts';
import * as categoriesApi from './api/categories';
import TransactionList from './components/TransactionList';
import AddTransactionForm from './components/AddTransactionForm';
import AccountList from './components/AccountList';
import AddAccountForm from './components/AddAccountForm';
import CategoryList from './components/CategoryList';
import AddCategoryForm from './components/AddCategoryForm';

type Page = 'transactions' | 'accounts' | 'categories';

export default function App() {
  const [page, setPage] = useState<Page>('transactions');

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
      .then(([t, a, c]) => {
        setTransactions(t);
        setAccounts(a);
        setCategories(c);
      })
      .catch(() => setError('Failed to load data'));
  }, []);

  async function handleAddTransaction(input: CreateTransactionInput) {
    const created = await transactionsApi.createTransaction(input);
    setTransactions((prev) => [created, ...prev]);
  }

  async function handleDeleteTransaction(id: number) {
    await transactionsApi.deleteTransaction(id);
    setTransactions((prev) => prev.filter((t) => t.id !== id));
  }

  async function handleAddAccount(input: CreateAccountInput) {
    const created = await accountsApi.createAccount(input);
    setAccounts((prev) => [...prev, created]);
  }

  async function handleDeleteAccount(id: number) {
    await accountsApi.deleteAccount(id);
    setAccounts((prev) => prev.filter((a) => a.id !== id));
  }

  async function handleAddCategory(input: CreateCategoryInput) {
    const created = await categoriesApi.createCategory(input);
    setCategories((prev) => [...prev, created]);
  }

  async function handleDeleteCategory(id: number) {
    await categoriesApi.deleteCategory(id);
    setCategories((prev) => prev.filter((c) => c.id !== id));
  }

  return (
    <main>
      <h1>Budget</h1>
      <nav>
        <button onClick={() => setPage('transactions')} disabled={page === 'transactions'}>Transactions</button>
        <button onClick={() => setPage('accounts')} disabled={page === 'accounts'}>Accounts</button>
        <button onClick={() => setPage('categories')} disabled={page === 'categories'}>Categories</button>
      </nav>
      {error && <p style={{ color: 'red' }}>{error}</p>}

      {page === 'transactions' && (
        <>
          <AddTransactionForm onAdd={handleAddTransaction} />
          <h2>Transactions</h2>
          <TransactionList transactions={transactions} onDelete={handleDeleteTransaction} />
        </>
      )}

      {page === 'accounts' && (
        <>
          <AddAccountForm onAdd={handleAddAccount} />
          <h2>Accounts</h2>
          <AccountList accounts={accounts} onDelete={handleDeleteAccount} />
        </>
      )}

      {page === 'categories' && (
        <>
          <AddCategoryForm onAdd={handleAddCategory} />
          <h2>Categories</h2>
          <CategoryList categories={categories} onDelete={handleDeleteCategory} />
        </>
      )}
    </main>
  );
}
