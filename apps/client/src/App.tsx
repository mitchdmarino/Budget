import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import TransactionsPage from './pages/TransactionsPage';
import AccountsPage from './pages/AccountsPage';
import CategoriesPage from './pages/CategoriesPage';
import PaychecksPage from './pages/PaychecksPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Navigate to="/transactions" replace />} />
          <Route path="transactions" element={<TransactionsPage />} />
          <Route path="accounts"     element={<AccountsPage />} />
          <Route path="categories"   element={<CategoriesPage />} />
          <Route path="paychecks"    element={<PaychecksPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
