import { useEffect, useState } from 'react';
import type { Category, CreateCategoryInput, UpdateCategoryInput } from '@budget/shared';
import * as categoriesApi from '../api/categories';
import CategoryList from '../components/CategoryList';
import AddCategoryForm from '../components/AddCategoryForm';

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    categoriesApi.fetchCategories()
      .then(setCategories)
      .catch(() => setError('Failed to load categories'));
  }, []);

  async function handleAdd(input: CreateCategoryInput) {
    const created = await categoriesApi.createCategory(input);
    setCategories(prev => [...prev, created]);
  }

  async function handleUpdate(id: number, input: UpdateCategoryInput) {
    const updated = await categoriesApi.updateCategory(id, input);
    setCategories(prev => prev.map(c => c.id === id ? updated : c));
  }

  async function handleDelete(id: number) {
    await categoriesApi.deleteCategory(id);
    setCategories(prev => prev.filter(c => c.id !== id));
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Categories</h1>
      {error && <p className="text-red-400 text-sm">{error}</p>}
      <AddCategoryForm onAdd={handleAdd} />
      <CategoryList categories={categories} onUpdate={handleUpdate} onDelete={handleDelete} />
    </div>
  );
}
