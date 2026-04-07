import axios from 'axios';
import type { Category, CreateCategoryInput, UpdateCategoryInput } from '@budget/shared';

const BASE = '/api/categories';

export async function fetchCategories(): Promise<Category[]> {
  const { data } = await axios.get<Category[]>(BASE);
  return data;
}

export async function createCategory(input: CreateCategoryInput): Promise<Category> {
  const { data } = await axios.post<Category>(BASE, input);
  return data;
}

export async function updateCategory(id: number, input: UpdateCategoryInput): Promise<Category> {
  const { data } = await axios.put<Category>(`${BASE}/${id}`, input);
  return data;
}

export async function deleteCategory(id: number): Promise<void> {
  await axios.delete(`${BASE}/${id}`);
}
