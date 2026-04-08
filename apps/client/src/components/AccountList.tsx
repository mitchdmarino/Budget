import type { Account } from '@budget/shared';

interface Props {
  accounts: Account[];
  onDelete: (id: number) => void;
}

const TYPE_STYLES: Record<string, string> = {
  checking:   'bg-blue-500/20 text-blue-400',
  savings:    'bg-emerald-500/20 text-emerald-400',
  credit:     'bg-orange-500/20 text-orange-400',
  retirement: 'bg-purple-500/20 text-purple-400',
};

export default function AccountList({ accounts, onDelete }: Props) {
  if (accounts.length === 0) {
    return <p className="text-gray-500 text-sm">No accounts yet.</p>;
  }

  return (
    <div className="space-y-2">
      {accounts.map((a) => (
        <div key={a.id} className="flex items-center justify-between bg-gray-900 border border-gray-800 rounded-xl px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="font-medium">{a.name}</span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${TYPE_STYLES[a.type] ?? 'bg-gray-700 text-gray-300'}`}>
              {a.type}
            </span>
          </div>
          <button onClick={() => onDelete(a.id)} className="text-gray-600 hover:text-red-400 text-xs transition-colors">
            Delete
          </button>
        </div>
      ))}
    </div>
  );
}
