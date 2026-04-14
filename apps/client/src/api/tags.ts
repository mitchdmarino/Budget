import axios from 'axios';
import type { Tag, CreateTagInput, UpdateTagInput } from '@budget/shared';

const BASE = '/api/tags';

export async function fetchTags(): Promise<Tag[]> {
  const { data } = await axios.get<Tag[]>(BASE);
  return data;
}

export async function createTag(input: CreateTagInput): Promise<Tag> {
  const { data } = await axios.post<Tag>(BASE, input);
  return data;
}

export async function updateTag(id: number, input: UpdateTagInput): Promise<Tag> {
  const { data } = await axios.put<Tag>(`${BASE}/${id}`, input);
  return data;
}

export async function deleteTag(id: number): Promise<void> {
  await axios.delete(`${BASE}/${id}`);
}
