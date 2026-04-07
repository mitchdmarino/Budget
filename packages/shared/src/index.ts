// Shared types used across server, client, and electron

export interface Transaction {
  id: number;
  date: string;
  description: string;
  amount_cents: number;
  category_id: number | null;
  account_id: number;
  created_at: string;
}

export interface Category {
  id: number;
  name: string;
  color: string;
}

export interface Account {
  id: number;
  name: string;
  type: 'checking' | 'savings' | 'credit' | 'retirement';
}

export interface CreateTransactionInput {
  amount_cents: number;
  date: string;
  description: string;
  category_id?: number | null;
  account_id: number;
}

export interface UpdateTransactionInput {
  amount_cents?: number;
  date?: string;
  description?: string;
  category_id?: number | null;
  account_id?: number;
}

export interface CreateCategoryInput {
  name: string;
  color: string;
}

export interface UpdateCategoryInput {
  name?: string;
  color?: string;
}

export interface CreateAccountInput {
  name: string;
  type: 'checking' | 'savings' | 'credit' | 'retirement';
}

export interface UpdateAccountInput {
  name?: string;
  type?: 'checking' | 'savings' | 'credit' | 'retirement';
}

