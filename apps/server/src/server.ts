import express from 'express';
import db from './db';
import { migrate } from './migrate';
import transactionRoutes from './routes/transactions';
import accountRoutes from './routes/accounts';
import categoryRoutes from './routes/categories';
import { errorHandler } from './middleware/errorHandler';

const app = express();
const PORT = process.env.PORT ?? 3001;

migrate();

app.use(express.json());

app.get('/health', (_req, res) => {
  const { version } = db.prepare('SELECT sqlite_version() AS version').get() as { version: string };
  res.json({ status: 'ok', sqlite_version: version });
});

app.use('/transactions', transactionRoutes);
app.use('/accounts', accountRoutes);
app.use('/categories', categoryRoutes);

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
