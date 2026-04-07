# Budget

A local-first desktop budget tracking app. Upload credit card statements, track transactions, assign categories, and understand your spending.

## Tech Stack

- **Frontend:** React + Vite
- **Backend:** Express + SQLite (better-sqlite3)
- **Desktop:** Electron
- **Language:** TypeScript (full stack)
- **PDF Parsing:** Python

## Project Structure

```
apps/
  client/     # React frontend (Vite)
  server/     # Express API + SQLite
  electron/   # Electron desktop wrapper
packages/
  shared/     # Shared TypeScript types
```

## Prerequisites

- [Node.js v22 LTS](https://nodejs.org/)
- [Python 3](https://www.python.org/)
- npm v10+

## Getting Started

**1. Install dependencies**

```bash
npm install
```

**2. Start development mode**

```bash
npm run dev
```

This starts Express (port 3001), Vite (port 5173), and Electron concurrently. Electron loads the Vite dev server so hot-reload works normally.

You can also run each piece individually:

```bash
npm run dev:server    # Express API on http://localhost:3001
npm run dev:client    # Vite dev server on http://localhost:5173
npm run dev:electron  # Electron window (requires server + client running first)
```

## API Endpoints

All routes are prefixed with `/api`.

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Server health + SQLite version |
| GET | `/api/accounts` | List all accounts |
| POST | `/api/accounts` | Create an account |
| PUT | `/api/accounts/:id` | Update an account |
| DELETE | `/api/accounts/:id` | Delete an account |
| GET | `/api/categories` | List all categories |
| POST | `/api/categories` | Create a category |
| PUT | `/api/categories/:id` | Update a category |
| DELETE | `/api/categories/:id` | Delete a category |
| GET | `/api/transactions` | List all transactions |
| POST | `/api/transactions` | Create a transaction |
| PUT | `/api/transactions/:id` | Update a transaction |
| DELETE | `/api/transactions/:id` | Delete a transaction |

## Database

SQLite database is stored locally as `budget.db` in the `apps/server/` directory. It is created automatically on first run. Migrations run on startup.

To use a custom path:

```bash
DB_PATH=/path/to/your.db npm run dev:server
```

## Building for Production

Build all packages in order (shared → server → client → electron):

```bash
npm run build
```

Then launch the desktop app:

```bash
npm run start -w apps/electron
```

In production mode, Electron spawns the Express server automatically, waits for it to be ready, then opens the window. Express serves both the API and the built React frontend from `http://localhost:3001`. No separate dev servers are needed.

## Testing

Run all tests across workspaces:

```bash
npm test
```

Or target a specific workspace:

```bash
npm test -w apps/server   # server unit + integration tests
npm test -w apps/client   # client component tests (vitest)
```
