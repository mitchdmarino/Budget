import type { Transaction } from '@budget/shared';

interface Props {
  transactions: Transaction[];
  onDelete: (id: number) => void;
}

export default function TransactionList({ transactions, onDelete }: Props) {
  if (transactions.length === 0) {
    return <p>No transactions yet.</p>;
  }

  return (
    <table>
      <thead>
        <tr>
          <th>Date</th>
          <th>Description</th>
          <th>Amount</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        {transactions.map((t) => (
          <tr key={t.id}>
            <td>{t.date}</td>
            <td>{t.description}</td>
            <td style={{ textAlign: 'right' }}>
              {t.amount < 0 ? '-' : ''}${Math.abs(t.amount).toFixed(2)}
            </td>
            <td>
              <button onClick={() => onDelete(t.id)}>Delete</button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
