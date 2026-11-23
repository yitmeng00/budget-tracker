# Ledgr

A personal finance tracker for monitoring income, expenses, budgets, and account balances. Built as a full-stack monorepo with a React frontend and an Express REST API backed by MySQL.

---

## Table of Contents

- [Features](#features)
- [Screenshots](#screenshots)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
- [Available Scripts](#available-scripts)
- [Environment Variables](#environment-variables)
- [Database](#database)
- [API Overview](#api-overview)

---

## Features

- **Transaction management** — add, edit, and delete transactions with daily, calendar, and monthly views
- **Global search** — search all transactions across all time with filters for type, category, and amount range
- **Statistics** — monthly and annual income/expense charts with interactive hover to show amounts; category breakdown split into income and expenses showing all categories
- **Budget tracking** — set default monthly limits per category with per-month overrides; over-budget categories highlighted with a red bar, red amount, and surplus pill in the stats breakdown
- **Account management** — track balances across multiple accounts grouped by type
- **Settings** — configurable currency, symbol position, week start day, categories, and budgets
- **Responsive design** — full mobile support with bottom navigation and bottom-sheet modals

---

## Screenshots

| Transactions - Daily View                                | Transactions - Calendar View                                |
| -------------------------------------------------------- | ----------------------------------------------------------- |
| ![Transactions](docs/screenshots/transactions-daily.png) | ![Transactions](docs/screenshots/transactions-calendar.png) |

| Transactions - Monthly View                                | Add Transactions Modal                                 |
| ---------------------------------------------------------- | ------------------------------------------------------ |
| ![Transactions](docs/screenshots/transactions-monthly.png) | ![Transactions](docs/screenshots/add-transactions.png) |

| Statistics - Monthly                            | Statistics - Annual                              |
| ----------------------------------------------- | ------------------------------------------------ |
| ![Statistics](docs/screenshots/stats-month.png) | ![Statistics](docs/screenshots/stats-annual.png) |

| Accounts                                   | Settings - Preferences, Currency, Categories |
| ------------------------------------------ | -------------------------------------------- |
| ![Accounts](docs/screenshots/accounts.png) | ![Settings](docs/screenshots/settings1.png)  |

| Settings - Accounts                         | Settings - Budgets                          |
| ------------------------------------------- | ------------------------------------------- |
| ![Settings](docs/screenshots/settings2.png) | ![Settings](docs/screenshots/settings3.png) |

---

## Tech Stack

| Layer    | Technology                                    |
| -------- | --------------------------------------------- |
| Frontend | React 19, TypeScript, Vite 8, Tailwind CSS v4 |
| State    | TanStack React Query v5                       |
| Icons    | Lucide React                                  |
| Backend  | Node.js, Express 5, TypeScript, Zod 4         |
| Database | MySQL 8.4                                     |
| Infra    | Docker Compose                                |

---

## Project Structure

```
ledgr/
├── client/                  # React frontend (Vite)
│   └── src/
│       ├── components/
│       │   ├── settings/    # Settings sub-components (Preferences, Currency, Categories, Accounts, Budgets)
│       │   ├── stats/       # Chart and category breakdown components
│       │   ├── transactions/# Transaction views (Daily, Calendar, Monthly, Search, Add)
│       │   └── ui/          # Shared UI primitives (SettingCard)
│       ├── hooks/           # Custom React hooks (useSettings, useMonth)
│       ├── lib/             # API client, icons, currency helpers, constants
│       ├── pages/           # Page-level components (Transactions, Stats, Accounts, Settings)
│       ├── styles/          # Global styles (Tailwind)
│       └── types/           # Shared TypeScript interfaces
├── server/                  # Express REST API
│   └── src/
│       ├── controllers/     # Route handler logic
│       ├── db/              # MySQL connection and schema
│       ├── middleware/      # Request validation (Zod) and error handling
│       └── routes/          # Express route definitions
├── docker-compose.yml       # MySQL service
└── package.json             # Workspace root
```

---

## Prerequisites

- [Node.js](https://nodejs.org/) v20.19+ or v22.13+ (v24 LTS recommended)
- [Docker](https://www.docker.com/) (for the MySQL database)
- npm v8 or later (workspaces support)

---

## Getting Started

### 1. Clone the repository

```bash
git clone <repository-url>
cd ledgr
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

```bash
cp server/.env.example server/.env
```

The defaults match the Docker Compose database, so no edits are needed for local development. See [Environment Variables](#environment-variables).

### 4. Start the database

```bash
docker compose up -d
```

The MySQL container initialises on first start using `server/src/db/schema.sql`, which creates all tables and seeds default data automatically.

> If you already run MySQL locally on port 3306, the container cannot bind the port. Either stop the local server, or create the `ledgr` database and user on it and apply `server/src/db/schema.sql` manually.

### 5. Start the development servers

```bash
npm run dev
```

This starts both the client (port **5173**) and server (port **3001**) concurrently. The Vite dev server proxies `/api/*` requests to the API server.

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## Available Scripts

Run from the project root:

| Command             | Description                                       |
| ------------------- | ------------------------------------------------- |
| `npm run dev`       | Start client and server in development mode       |
| `npm run build`     | Build both client and server for production       |
| `npm run lint`      | Lint both workspaces                              |
| `npm run typecheck` | Run TypeScript type checks across both workspaces |

### Running a production build

```bash
npm run build
npm start --workspace=server            # API on port 3001
npm run preview --workspace=client      # serves client/dist on port 4173
```

`vite preview` is for checking the build locally. In a real deployment, serve `client/dist` from a static host or reverse proxy that forwards `/api/*` to the API server with the `/api` prefix stripped.

---

## Environment Variables

The server reads the following variables from `server/.env` (see `server/.env.example`).

| Variable      | Default                 | Description         |
| ------------- | ----------------------- | ------------------- |
| `PORT`        | `3001`                  | Express server port |
| `CLIENT_URL`  | `http://localhost:5173` | Allowed CORS origin |
| `DB_HOST`     | `localhost`             | MySQL host          |
| `DB_PORT`     | `3306`                  | MySQL port          |
| `DB_NAME`     | `ledgr`                 | Database name       |
| `DB_USER`     | `ledgr`                 | Database user       |
| `DB_PASSWORD` | `ledgr_password`        | Database password   |

---

## Database

The database schema is defined in [`server/src/db/schema.sql`](server/src/db/schema.sql) and is applied automatically when the Docker container is first created.

To reset the database and re-apply the schema:

```bash
docker compose down -v   # removes the volume (all data)
docker compose up -d     # re-creates with fresh schema and seed data
```

---

## API Overview

The client calls the API under `/api`; the proxy strips that prefix, so the Express server itself serves these routes without it (e.g. `GET http://localhost:3001/transactions`).

| Method | Path                                             | Description                           |
| ------ | ------------------------------------------------ | ------------------------------------- |
| GET    | `/api/transactions`                              | List transactions (year/month filter) |
| POST   | `/api/transactions`                              | Create a transaction                  |
| PATCH  | `/api/transactions/:id`                          | Update a transaction                  |
| DELETE | `/api/transactions/:id`                          | Delete a transaction                  |
| GET    | `/api/categories`                                | List all categories                   |
| POST   | `/api/categories`                                | Create a category                     |
| PATCH  | `/api/categories/:id`                            | Update a category                     |
| DELETE | `/api/categories/:id`                            | Delete a category                     |
| GET    | `/api/accounts`                                  | List all accounts                     |
| POST   | `/api/accounts`                                  | Create an account                     |
| PATCH  | `/api/accounts/:id`                              | Update an account                     |
| DELETE | `/api/accounts/:id`                              | Delete an account                     |
| GET    | `/api/account-groups`                            | List account groups                   |
| POST   | `/api/account-groups`                            | Create an account group               |
| PATCH  | `/api/account-groups/:id`                        | Update an account group               |
| DELETE | `/api/account-groups/:id`                        | Delete an account group               |
| GET    | `/api/budgets`                                   | Get budgets for a month               |
| PUT    | `/api/budgets/:categoryId/default`               | Set or update a default budget        |
| PUT    | `/api/budgets/:categoryId/override/:year/:month` | Set a month-specific override         |
| DELETE | `/api/budgets/:categoryId/override/:year/:month` | Remove a budget override              |
| DELETE | `/api/budgets/:categoryId`                       | Remove all budgets for a category     |
| GET    | `/api/stats/monthly`                             | Monthly income/expense summaries      |
| GET    | `/api/stats/categories`                          | Category breakdown for a period       |
| GET    | `/api/settings`                                  | Get user settings                     |
| PATCH  | `/api/settings`                                  | Update user settings                  |
