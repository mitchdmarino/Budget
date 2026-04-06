import express from 'express';
import db from './db';

const app = express();
const PORT = process.env.PORT ?? 3001;

app.use(express.json());

app.get('/health', (_req, res) => {
  const { version } = db.prepare('SELECT sqlite_version() AS version').get() as { version: string };
  res.json({ status: 'ok', sqlite_version: version });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
