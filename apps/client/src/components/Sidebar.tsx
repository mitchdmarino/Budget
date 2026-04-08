import { NavLink } from 'react-router-dom';

const NAV = [
  { to: '/dashboard',    label: 'Dashboard'    },
  { to: '/transactions', label: 'Transactions' },
  { to: '/paychecks',   label: 'Paychecks'    },
  { to: '/accounts',    label: 'Accounts'      },
  { to: '/categories',  label: 'Categories'    },
];

export default function Sidebar() {
  return (
    <aside className="w-52 shrink-0 bg-gray-900 min-h-screen flex flex-col">
      <div className="px-5 py-6 border-b border-gray-800">
        <span className="text-white font-semibold text-lg tracking-tight">Budget</span>
      </div>
      <nav className="flex flex-col gap-1 px-3 py-4">
        {NAV.map(({ to, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              }`
            }
          >
            {label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
