import type { Account } from '@budget/shared';

interface Props {
  accounts: Account[];
  onDelete: (id: number) => void;
}

export default function AccountList({ accounts, onDelete }: Props) {
  if (accounts.length === 0) {
    return <p>No accounts yet.</p>;
  }

  return (
    <table>
      <thead>
        <tr>
          <th>Name</th>
          <th>Type</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        {accounts.map((a) => (
          <tr key={a.id}>
            <td>{a.name}</td>
            <td>{a.type}</td>
            <td>
              <button onClick={() => onDelete(a.id)}>Delete</button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
