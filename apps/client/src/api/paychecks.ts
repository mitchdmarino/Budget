import axios from 'axios';
import type { Paycheck, CreatePaycheckInput, UpdatePaycheckInput } from '@budget/shared';

const BASE = '/api/paychecks';

export async function fetchPaychecks(month?: string): Promise<Paycheck[]> {
  const { data } = await axios.get<Paycheck[]>(BASE, { params: month ? { month } : undefined });
  return data;
}

export async function createPaycheck(input: CreatePaycheckInput): Promise<Paycheck> {
  const { data } = await axios.post<Paycheck>(BASE, input);
  return data;
}

export async function updatePaycheck(id: number, input: UpdatePaycheckInput): Promise<Paycheck> {
  const { data } = await axios.put<Paycheck>(`${BASE}/${id}`, input);
  return data;
}

export async function deletePaycheck(id: number): Promise<void> {
  await axios.delete(`${BASE}/${id}`);
}

export async function uploadPaycheckPdf(file: File): Promise<Paycheck> {
  const form = new FormData();
  form.append('file', file);
  const { data } = await axios.post<Paycheck>(`${BASE}/upload`, form);
  return data;
}
