import axios from 'axios';
import type { Transaction, CreateTransactionInput } from '@budget/shared';

const BASE = '/api/transactions';

export async function fetchTransactions(): Promise<Transaction[]> {
  const { data } = await axios.get<Transaction[]>(BASE);
  return data;
}

export async function createTransaction(input: CreateTransactionInput): Promise<Transaction> {
  const { data } = await axios.post<Transaction>(BASE, input);
  return data;
}

export async function deleteTransaction(id: number): Promise<void> {
  await axios.delete(`${BASE}/${id}`);
}
