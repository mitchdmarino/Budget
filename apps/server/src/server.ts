import express from 'express';
import path from 'path';
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

app.use('/api/transactions', transactionRoutes);
app.use('/api/accounts', accountRoutes);
app.use('/api/categories', categoryRoutes);

app.use(errorHandler);

// In production, serve the built React app so Electron can load everything
// from a single origin (http://localhost:3001) without a separate Vite server.
if (process.env.NODE_ENV === 'production') {
  const clientDist = path.resolve(__dirname, '../../client/dist');
  app.use(express.static(clientDist));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
