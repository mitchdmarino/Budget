import axios from 'axios';
import type { Transaction, CreateTransactionInput, UpdateTransactionInput } from '@budget/shared';

const BASE = '/api/transactions';

export async function fetchTransactions(month?: string): Promise<Transaction[]> {
  const { data } = await axios.get<Transaction[]>(BASE, { params: month ? { month } : undefined });
  return data;
}

export async function createTransaction(input: CreateTransactionInput): Promise<Transaction> {
  const { data } = await axios.post<Transaction>(BASE, input);
  return data;
}

export async function updateTransaction(id: number, input: UpdateTransactionInput): Promise<Transaction> {
  const { data } = await axios.put<Transaction>(`${BASE}/${id}`, input);
  return data;
}

export async function deleteTransaction(id: number): Promise<void> {
  await axios.delete(`${BASE}/${id}`);
}
