import db from '../db';
import type { Category, CreateCategoryInput, UpdateCategoryInput } from '@budget/shared';

export function getCategories(): Category[] {
  return db
    .prepare('SELECT * FROM categories ORDER BY name ASC')
    .all() as Category[];
}

export function getCategory(id: number): Category {
  const category = db
    .prepare('SELECT * FROM categories WHERE id = ?')
    .get(id) as Category | undefined;

  if (!category) throw new Error(`Category ${id} not found`);

  return category;
}

export function createCategory(input: CreateCategoryInput): Category {
  const { lastInsertRowid } = db
    .prepare('INSERT INTO categories (name, color) VALUES (?, ?)')
    .run(input.name, input.color);

  return db
    .prepare('SELECT * FROM categories WHERE id = ?')
    .get(lastInsertRowid) as Category;
}

export function updateCategory(id: number, input: UpdateCategoryInput): Category {
  const existing = db
    .prepare('SELECT * FROM categories WHERE id = ?')
    .get(id) as Category | undefined;

  if (!existing) throw new Error(`Category ${id} not found`);

  db.prepare('UPDATE categories SET name = ?, color = ? WHERE id = ?').run(
    input.name ?? existing.name,
    input.color ?? existing.color,
    id,
  );

  return db
    .prepare('SELECT * FROM categories WHERE id = ?')
    .get(id) as Category;
}

export function deleteCategory(id: number): void {
  const { changes } = db
    .prepare('DELETE FROM categories WHERE id = ?')
    .run(id);

  if (changes === 0) throw new Error(`Category ${id} not found`);
}
