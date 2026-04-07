import axios from 'axios';
import type { Account, CreateAccountInput } from '@budget/shared';

const BASE = '/api/accounts';

export async function fetchAccounts(): Promise<Account[]> {
  const { data } = await axios.get<Account[]>(BASE);
  return data;
}

export async function createAccount(input: CreateAccountInput): Promise<Account> {
  const { data } = await axios.post<Account>(BASE, input);
  return data;
}

export async function deleteAccount(id: number): Promise<void> {
  await axios.delete(`${BASE}/${id}`);
}
