// Shared types used across server, client, and electron

export interface Transaction {
  id: number;
  date: string;
  description: string;
  amount: number;
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
  type: string;
}

export interface CreateTransactionInput {
  amount: number;
  date: string;
  description: string;
  category_id?: number | null;
  account_id: number;
}

export interface UpdateTransactionInput {
  amount?: number;
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
  type: string;
}

export interface UpdateAccountInput {
  name?: string;
  type?: string;
}
