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

**2. Build the shared package**

```bash
npm run build -w packages/shared
```

**3. Start the dev server**

```bash
# Run server + client + electron concurrently
npm run dev

# Or run individually
npm run dev:server    # Express API on http://localhost:3001
npm run dev:client    # Vite dev server on http://localhost:5173
npm run dev:electron  # Electron (load Vite dev server)
```

> **Note:** Start `dev:server` and `dev:client` before `dev:electron` — Electron loads the Vite dev server on startup.

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Server health + SQLite version |
| GET | `/accounts` | List all accounts |
| POST | `/accounts` | Create an account |
| PUT | `/accounts/:id` | Update an account |
| DELETE | `/accounts/:id` | Delete an account |
| GET | `/categories` | List all categories |
| POST | `/categories` | Create a category |
| PUT | `/categories/:id` | Update a category |
| DELETE | `/categories/:id` | Delete a category |
| GET | `/transactions` | List all transactions |
| POST | `/transactions` | Create a transaction |
| PUT | `/transactions/:id` | Update a transaction |
| DELETE | `/transactions/:id` | Delete a transaction |

## Database

SQLite database is stored locally as `budget.db` in the `apps/server/` directory. It is created automatically on first run. Migrations run on startup.

To use a custom path:

```bash
DB_PATH=/path/to/your.db npm run dev:server
```

## Building for Production

```bash
npm run build
```
