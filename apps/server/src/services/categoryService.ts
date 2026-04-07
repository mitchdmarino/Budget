import db from '../db';
import type { Category, CreateCategoryInput, UpdateCategoryInput } from '@budget/shared';

const DEFAULT_CATEGORIES: Array<{ name: string; color: string }> = [
  { name: 'Food & Dining',  color: '#f97316' },
  { name: 'Groceries',      color: '#22c55e' },
  { name: 'Transport',      color: '#3b82f6' },
  { name: 'Shopping',       color: '#a855f7' },
  { name: 'Entertainment',  color: '#ec4899' },
  { name: 'Health',         color: '#ef4444' },
  { name: 'Utilities',      color: '#eab308' },
  { name: 'Income',         color: '#14b8a6' },
  { name: 'Rent',           color: '#6366f1' },
  { name: 'Other',          color: '#6b7280' },
];

export function seedDefaultCategories(): void {
  const count = (db.prepare('SELECT COUNT(*) AS n FROM categories').get() as { n: number }).n;
  if (count > 0) return;

  const insert = db.prepare('INSERT INTO categories (name, color) VALUES (?, ?)');
  const seedAll = db.transaction(() => {
    for (const { name, color } of DEFAULT_CATEGORIES) {
      insert.run(name, color);
    }
  });
  seedAll();
}

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
    .prepare('INSERT INTO categories (name, color, budget_cents) VALUES (?, ?, ?)')
    .run(input.name, input.color, input.budget_cents ?? null);

  return db
    .prepare('SELECT * FROM categories WHERE id = ?')
    .get(lastInsertRowid) as Category;
}

export function updateCategory(id: number, input: UpdateCategoryInput): Category {
  const existing = db
    .prepare('SELECT * FROM categories WHERE id = ?')
    .get(id) as Category | undefined;

  if (!existing) throw new Error(`Category ${id} not found`);

  db.prepare('UPDATE categories SET name = ?, color = ?, budget_cents = ? WHERE id = ?').run(
    input.name ?? existing.name,
    input.color ?? existing.color,
    'budget_cents' in input ? (input.budget_cents ?? null) : existing.budget_cents,
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
