import type { Transaction, Category } from '@budget/shared';
import { formatCents } from '../utils/format';

interface Props {
  transactions: Transaction[];
  categories: Category[];
  search: string;
  onDelete: (id: number) => void;
}

export default function TransactionList({ transactions, categories, search, onDelete }: Props) {
  const categoryMap = Object.fromEntries(categories.map(c => [c.id, c]));

  const visible = search.trim()
    ? transactions.filter(t => t.description.toLowerCase().includes(search.toLowerCase()))
    : transactions;

  if (visible.length === 0) {
    return <p className="text-gray-500 text-sm">{search ? 'No matching transactions.' : 'No transactions yet.'}</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-800 text-gray-400 text-left">
            <th className="pb-2 font-medium">Date</th>
            <th className="pb-2 font-medium">Description</th>
            <th className="pb-2 font-medium">Category</th>
            <th className="pb-2 font-medium text-right">Amount</th>
            <th className="pb-2" />
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-800">
          {visible.map((t) => {
            const cat = t.category_id ? categoryMap[t.category_id] : null;
            const isExpense = t.amount_cents < 0;
            return (
              <tr key={t.id} className="hover:bg-gray-800/40">
                <td className="py-3 pr-4 text-gray-400 whitespace-nowrap">{t.date}</td>
                <td className="py-3 pr-4">{t.description}</td>
                <td className="py-3 pr-4">
                  {cat ? (
                    <span
                      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium"
                      style={{ backgroundColor: `${cat.color}22`, color: cat.color }}
                    >
                      <span
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ backgroundColor: cat.color }}
                      />
                      {cat.name}
                    </span>
                  ) : (
                    <span className="text-gray-600 text-xs">—</span>
                  )}
                </td>
                <td className={`py-3 pr-4 text-right font-medium tabular-nums ${isExpense ? 'text-red-400' : 'text-emerald-400'}`}>
                  {formatCents(t.amount_cents)}
                </td>
                <td className="py-3 text-right">
                  <button
                    onClick={() => onDelete(t.id)}
                    className="text-gray-600 hover:text-red-400 text-xs transition-colors"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
