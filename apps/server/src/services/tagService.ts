import db from '../db';
import type { Tag, CreateTagInput, UpdateTagInput } from '@budget/shared';
import { AppError } from '../middleware/errorHandler';

export function getTags(): Tag[] {
  return db.prepare('SELECT * FROM tags ORDER BY name ASC').all() as Tag[];
}

export function getTag(id: number): Tag {
  const tag = db.prepare('SELECT * FROM tags WHERE id = ?').get(id) as Tag | undefined;
  if (!tag) throw new AppError(404, 'Tag not found');
  return tag;
}

export function createTag(input: CreateTagInput): Tag {
  const { lastInsertRowid } = db.prepare(
    'INSERT INTO tags (name, color, limit_cents) VALUES (?, ?, ?)'
  ).run(input.name, input.color, input.limit_cents ?? null);
  return getTag(Number(lastInsertRowid));
}

export function updateTag(id: number, input: UpdateTagInput): Tag {
  const existing = getTag(id);
  db.prepare(
    'UPDATE tags SET name = ?, color = ?, limit_cents = ? WHERE id = ?'
  ).run(
    input.name       ?? existing.name,
    input.color      ?? existing.color,
    'limit_cents' in input ? (input.limit_cents ?? null) : existing.limit_cents,
    id,
  );
  return getTag(id);
}

export function deleteTag(id: number): void {
  getTag(id); // throws 404 if missing
  db.prepare('DELETE FROM tags WHERE id = ?').run(id);
}
