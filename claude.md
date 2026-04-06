# Budget App — Claude Instructions

## Goal

Build a simple local-first budget tracking application.

Core features:

* Upload credit card statements and parse transactions, save. 
* Upload paystubs and parse income
* Manually create, edit, delete transactions
* Assign categories to transactions
* Group transactions by description (future enhancement)
* Support multiple accounts (credit cards, etc.)
* Display monthly spending info in a logical way, easy for a person to understand. The goal is to reduce unnecessary spending and track what's important. 

After MVP: 

* Track how much money is being saved for retirement
* Set budget/spending goals per month/category. 
* AI powered suggestions 

## Tech Stack

* TypeScript (full stack)
* React (Vite)
* Express (Node.js backend)
* SQLite (better-sqlite3)
* Electron (desktop wrapper) 
* Python (for pdf parsing sub-process) 

## Architecture قواعد

* Monorepo structure with apps/server, apps/client, apps/electron
* Backend uses:

  * Controllers (thin)
  * Services (business logic)
  * DB layer (isolated)
* Frontend:

  * Simple React components
  * No heavy state management libraries

## Constraints

* DO NOT add authentication
* DO NOT over-engineer
* Keep everything MVP-level simple
* Prefer explicit, readable code over abstraction

## File Parsing

* Parsing should happen immediately after upload
* Do NOT persist uploaded files
* Extract transactions and store them directly

## Code Standards

* Use async/await
* Use Zod for validation
* Use strict TypeScript
* No any types unless absolutely necessary

## Testing

* Unit tests for services
* Integration tests for API
* Minimal E2E tests

## Output Expectations

When generating code:

1. Show file structure
2. Show full code per file
3. Keep explanations brief

## Important

Do not introduce new libraries unless explicitly requested.
Do not change architecture without being asked.
