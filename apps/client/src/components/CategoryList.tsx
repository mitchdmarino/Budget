import type { Category } from '@budget/shared';

interface Props {
  categories: Category[];
  onDelete: (id: number) => void;
}

export default function CategoryList({ categories, onDelete }: Props) {
  if (categories.length === 0) {
    return <p className="text-gray-500 text-sm">No categories yet.</p>;
  }

  return (
    <div className="space-y-2">
      {categories.map((c) => (
        <div key={c.id} className="flex items-center justify-between bg-gray-900 border border-gray-800 rounded-xl px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: c.color }} />
            <span className="font-medium">{c.name}</span>
          </div>
          <button onClick={() => onDelete(c.id)} className="text-gray-600 hover:text-red-400 text-xs transition-colors">
            Delete
          </button>
        </div>
      ))}
    </div>
  );
}
