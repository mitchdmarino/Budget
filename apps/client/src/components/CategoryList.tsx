import type { Category } from '@budget/shared';

interface Props {
  categories: Category[];
  onDelete: (id: number) => void;
}

export default function CategoryList({ categories, onDelete }: Props) {
  if (categories.length === 0) {
    return <p>No categories yet.</p>;
  }

  return (
    <table>
      <thead>
        <tr>
          <th>Color</th>
          <th>Name</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        {categories.map((c) => (
          <tr key={c.id}>
            <td>
              <span style={{
                display: 'inline-block',
                width: 16,
                height: 16,
                borderRadius: 3,
                backgroundColor: c.color,
              }} />
            </td>
            <td>{c.name}</td>
            <td>
              <button onClick={() => onDelete(c.id)}>Delete</button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
