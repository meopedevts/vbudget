# vbudget — Project Instructions for LLMs

> Personal finance manager: V backend + SolidJS frontend compiled into a single binary.

## Overview

vbudget is a self-hosted, single-binary personal budget manager. The V backend embeds the SolidJS frontend bundle at compile time via `$embed_file`, producing one executable with zero runtime dependencies (aside from `libsqlite3`). Data is stored in a local SQLite database (`vbudget.db`).

## Monorepo Structure

```
vbudget/
├── backend/          # V (vlang) — HTTP server, SQLite ORM, embedded SPA, auth
│   ├── src/
│   │   ├── main.v                        # Entry point — instantiates Server and calls run()
│   │   ├── db/
│   │   │   ├── models.v                  # Structs + enums: Category, Transaction, User
│   │   │   ├── db.v                      # Database open(), close(), migrate()
│   │   │   ├── categories.v              # Category CRUD queries
│   │   │   ├── transactions.v            # Transaction CRUD queries
│   │   │   └── users.v                   # User CRUD (find_user_by_name, create_user, …)
│   │   ├── server/
│   │   │   ├── server.v                  # App + Context structs, new(), run(), CORS middleware
│   │   │   ├── spa_handler.v             # SPA routes: /, /app, /app/:path…, /assets/*
│   │   │   ├── health_handler.v          # GET /api/health
│   │   │   ├── auth_handler.v            # register, login, logout, me + get_auth_user helper
│   │   │   ├── categories_handler.v      # CRUD /api/categories (protected)
│   │   │   └── transactions_handler.v    # CRUD /api/transactions (protected)
│   │   └── embedded/                     # Frontend dist copied here by `make frontend`
│   ├── bin/vbudget                       # Compiled binary (gitignored)
│   └── v.mod
├── frontend/         # SolidJS — Vite, TailwindCSS v4, Kobalte, TanStack
│   ├── src/
│   │   ├── index.tsx                     # App entry: Router, routes, Toaster
│   │   ├── styles/index.css              # Tailwind base + CSS variables
│   │   ├── lib/
│   │   │   ├── api/
│   │   │   │   ├── types.ts              # All shared TypeScript interfaces
│   │   │   │   ├── client.ts             # Fetch wrapper (credentials: include)
│   │   │   │   ├── auth.ts               # authService
│   │   │   │   ├── categories.ts         # categoriesService
│   │   │   │   ├── transactions.ts       # transactionsService
│   │   │   │   ├── notifications.ts      # notificationsService
│   │   │   │   ├── integrations.ts       # integrationsService
│   │   │   │   └── index.ts              # Barrel export
│   │   │   ├── auth-context.tsx          # AuthProvider + useAuth()
│   │   │   ├── format.ts                 # formatCurrency, formatDate
│   │   │   ├── cva.ts                    # cva + cx helpers
│   │   │   ├── combine-style.ts
│   │   │   ├── call-handler.ts
│   │   │   └── use-mobile.ts
│   │   ├── components/
│   │   │   ├── layout.tsx                # AuthProvider wrapper + Sidebar shell
│   │   │   ├── app-sidebar.tsx           # Nav items, user info, logout button
│   │   │   ├── ui/                       # Kobalte-based design system (button, dialog, table, etc.)
│   │   │   ├── settings/                 # categories-dialog.tsx
│   │   │   ├── transactions/             # create-edit, delete, settle dialogs
│   │   │   └── notifications/            # create-edit, delete alert dialogs
│   │   └── pages/
│   │       ├── login.tsx                 # Public — login/register toggle form
│   │       ├── dashboard.tsx             # Summary cards + recent transactions
│   │       ├── transactions.tsx          # Full CRUD table
│   │       ├── settings.tsx              # Category management
│   │       ├── notifications.tsx         # Alert rules
│   │       └── integrations.tsx          # Integrations scaffold
│   ├── package.json
│   ├── vite.config.ts
│   └── tsconfig.json
├── Makefile
├── Dockerfile
└── docker-compose.yml
```

## Technology Stack

| Layer    | Technology                                                        |
|----------|-------------------------------------------------------------------|
| Backend  | **V** (vlang) · **veb** (web framework) · **veb.auth** · **SQLite** (ORM) |
| Frontend | **SolidJS** · **TailwindCSS v4** · **Kobalte** (headless UI) · **TanStack Form/Table** · **Valibot** |
| Auth     | Cookie-based session tokens via `veb.auth` (SHA-256 + salt)       |
| Build    | **Vite** (frontend) · **V compiler** (backend) · **Make** (orchestration) |
| Deploy   | Single static binary · Docker (Alpine 3) · docker-compose        |

## Backend (V)

### Key Concepts

- **veb** is V's built-in web framework. Handlers are methods on `App` with route attributes like `@['/api/transactions'; get]`.
- **veb.auth** manages cookie-based session tokens. It creates a `tokens` table automatically and provides `add_token()`, `find_token()`, `delete_tokens()`.
- **SQLite ORM**: V's built-in ORM generates SQL from struct definitions. Tables are created with `sql db { create table MyStruct }`.
- **$embed_file**: V compiler directive that embeds file contents into the binary at compile time. Used with `.zlib` for compression.

### App and Context Structs

```v
pub struct App {
pub mut:
    db   &db.Database = unsafe { nil }
    auth auth.Auth[sqlite.DB]
}

pub struct Context {
    veb.Context
pub mut:
    current_user db.User
}
```

### Data Models

```v
pub enum TransactionKind   { income  expense }   // JSON: "income" | "expense"
pub enum TransactionStatus { pending paid    }   // JSON: "pending" | "paid"
```

V enums serialize to their field name in **lowercase**. The frontend must match this casing.

**Category**: `id`, `name`, `kind` (income/expense), `color` (hex string)
**Transaction**: `id`, `description`, `amount` (f64, positive), `kind`, `status`, `category_id`, `due_date` (ISO string), `paid_date` (ISO string, empty = unpaid), `created_at` (time.Time)
**User**: `id`, `name`, `password_hash`, `salt`

### Migrations

`db.migrate()` runs on every startup and is idempotent:
1. `create table` for each model (no-op if exists)
2. `ALTER TABLE ADD COLUMN` with error swallowed (SQLite has no `IF NOT EXISTS` for columns)
3. `auth.new(conn)` creates the `tokens` table automatically

### Authentication Flow

1. Register/login → `auth.add_token(user_id)` → UUID token stored in DB → set as HTTP-only `token` cookie.
2. Protected handlers call `app.get_auth_user(mut ctx) or { return ctx.unauthorized() }`.
3. Logout → `auth.delete_tokens(user_id)` → cookie cleared.

### Handler Pattern

Every protected handler follows this pattern:

```v
@['/api/resource'; get]
pub fn (mut app App) handler_name(mut ctx Context) veb.Result {
    app.get_auth_user(mut ctx) or { return ctx.unauthorized() }
    // ... business logic ...
    return ctx.json(result)
}
```

Input is decoded from `ctx.req.data` with `json.decode(InputStruct, ctx.req.data)`.

### SPA Serving

- `/` → 302 redirect to `/app`
- `/app` and `/app/:path…` → serves embedded `index.html` (SPA fallback)
- `/assets/index.js` and `/assets/index.css` → serves embedded, zlib-compressed bundles
- `/api/*` → handled by API handlers (never intercepted by SPA fallback)

### CORS

`before_request` sets CORS headers allowing `http://localhost:3000` (Vite dev server) with credentials.

## API Endpoints

All under `/api/`. Endpoints marked 🔒 require a valid `token` cookie.

| Method | Path                    | Auth | Body / Response                                              |
|--------|-------------------------|------|--------------------------------------------------------------|
| GET    | `/api/health`           | —    | `"ok"` (200)                                                 |
| POST   | `/api/auth/register`    | —    | `{name, password}` → `{id, name}` + cookie                  |
| POST   | `/api/auth/login`       | —    | `{name, password}` → `{id, name}` + cookie                  |
| POST   | `/api/auth/logout`      | 🔒   | 204 + clears cookie                                         |
| GET    | `/api/auth/me`          | 🔒   | `{id, name}`                                                |
| GET    | `/api/categories`       | 🔒   | `Category[]`                                                |
| GET    | `/api/categories/:id`   | 🔒   | `Category`                                                  |
| POST   | `/api/categories`       | 🔒   | `{name, kind, color}` → `Category` (201)                    |
| PUT    | `/api/categories/:id`   | 🔒   | `{name, kind, color}` → `Category`                          |
| DELETE | `/api/categories/:id`   | 🔒   | 204                                                         |
| GET    | `/api/transactions`     | 🔒   | `Transaction[]` (ordered by `due_date ASC`)                  |
| GET    | `/api/transactions/:id` | 🔒   | `Transaction`                                               |
| POST   | `/api/transactions`     | 🔒   | `{description, amount, kind, status, category_id, due_date, paid_date}` → `Transaction` (201) |
| PUT    | `/api/transactions/:id` | 🔒   | same body as POST → `Transaction`                            |
| DELETE | `/api/transactions/:id` | 🔒   | 204                                                         |

## Frontend (SolidJS)

### Key Concepts

- **SolidJS** is a reactive UI framework (not React). It uses signals, not virtual DOM. Components run once; reactivity is fine-grained through signals and effects.
- **@solidjs/router** handles client-side routing with a `/app` base path.
- **Kobalte** provides accessible headless UI primitives (Dialog, Select, Popover, etc.).
- **TanStack Form + Valibot** for form state management and validation.
- **TanStack Table** for data table with sorting/filtering.
- **cva** (class-variance-authority) for component variant styling.

### Routing

Routes are defined in `index.tsx`. The Router uses `base="/app"`:

- `/login` — public (no auth check), renders `LoginPage`
- `/` — protected, renders `Layout` → `Dashboard`
- `/transactions` — protected, renders `Layout` → `Transactions`
- `/integrations` — protected, renders `Layout` → `Integrations`
- `/notifications` — protected, renders `Layout` → `Notifications`
- `/settings` — protected, renders `Layout` → `Settings`

The `Layout` component wraps all protected routes with `<AuthProvider>`.

### Auth Context

```tsx
import { useAuth } from "@/lib/auth-context"

const auth = useAuth()
auth.user()      // User | undefined
auth.isLoading() // boolean
auth.logout()    // () => Promise<void>
```

On mount, `AuthProvider` calls `GET /api/auth/me`. If 401, redirects to `/login`.

### API Client

`lib/api/client.ts` exports an `api` object with typed `get`, `post`, `put`, `delete` methods. All requests use `credentials: 'include'` for cookie auth. Relative paths (`/api/...`) work through Vite proxy in dev and directly in production.

```ts
import { categoriesService, transactionsService } from "@/lib/api"

await categoriesService.list()
await transactionsService.update(id, payload)
```

### Form Pattern (TanStack Form + Valibot)

All forms follow this pattern:

```tsx
const form = createForm(() => ({
  defaultValues: { name: "" },
  validators: { onSubmit: formSchema },
  onSubmit: async ({ value }) => { /* call API service */ },
}))
```

Key conventions:
- `Select<T>` with `optionValue="id"` — Kobalte compares by id, not reference (required for async-loaded options).
- Category `Select` nested inside the `kind` field render for reactive filtering.
- `paid_date` field conditionally rendered inside `status` field render callback.
- `createResource(source, fetcher)` for lazy-loaded dialogs — source signal drives re-fetching.

### UI Components

All in `components/ui/`. Built on Kobalte primitives with TailwindCSS styling and cva variants. Components include: Button, Dialog, Table, Select, Calendar, Card, Badge, Sidebar, Skeleton, Sonner (toast), etc.

### Pages

| Page             | Path               | Description                                                  |
|------------------|--------------------|--------------------------------------------------------------|
| Login            | `/app/login`       | Toggle login/register form; public                           |
| Dashboard        | `/app`             | Balance cards (paid + provisioned), recent transactions      |
| Transactions     | `/app/transactions`| Full CRUD table; settle flow; overdue highlighting           |
| Settings         | `/app/settings`    | Category management dialog                                   |
| Notifications    | `/app/notifications`| Alert rules management                                      |
| Integrations     | `/app/integrations`| Integrations scaffold (placeholder)                          |

### Important UI Behaviors

- **Settle flow**: "Baixar" button opens a dialog to confirm payment date → sets `status = paid` and records `paid_date`.
- **Overdue detection**: Transactions with `status = pending` and `due_date < today` are highlighted red.
- **Dashboard balances**: "Saldo Baixado" = sum of paid (income − expense); subtitle shows projected balance including pending.

## Build & Development

### Prerequisites

- [V compiler](https://vlang.io) (latest)
- [Node.js](https://nodejs.org) + [pnpm](https://pnpm.io)

### Development (two terminals)

```bash
# Terminal 1 — Backend (port 8181)
cd backend && v run src/

# Terminal 2 — Frontend dev server (port 3000, proxies /api/* to :8181)
cd frontend && pnpm install && pnpm dev
```

Open http://localhost:3000/app. First user registered becomes the personal account.

### Production (single binary)

```bash
make run          # builds frontend → backend → starts server
```

The frontend bundle is embedded into the V binary at compile time via `$embed_file(..., .zlib)`.

### Docker

```bash
make docker-build
docker compose up -d    # http://localhost:8181/app
```

Multi-stage Dockerfile: Node (pnpm build) → V compiler → Alpine 3 runtime (~5 MB base). SQLite DB at `/data/vbudget.db` (mount volume to persist).

### Makefile Targets

| Target              | Description                                                    |
|---------------------|----------------------------------------------------------------|
| `make frontend`     | Build Vite bundle and copy to `backend/src/embedded/`          |
| `make backend`      | Compile V binary (embeds frontend)                             |
| `make run`          | `frontend` → `backend` → start server                         |
| `make all`          | `frontend` + `backend` (no server start)                       |
| `make clean`        | Remove `frontend/dist` and `backend/src/embedded` artifacts    |
| `make docker-build` | Build the Docker image                                         |

## Conventions & Rules

1. **Language**: The UI text is in **Brazilian Portuguese** (pt-BR). Labels like "Lançamentos", "Despesas", "Receitas", "Baixar", "Pendente", "Baixado" must stay in Portuguese.
2. **V enum serialization**: V enums serialize to lowercase field names (`income`, `expense`, `pending`, `paid`). TypeScript types must match.
3. **Handler protection**: Every API handler that accesses user data MUST call `app.get_auth_user(mut ctx) or { return ctx.unauthorized() }` as the first line.
4. **Input validation**: Backend handlers decode JSON from `ctx.req.data` via `json.decode()` and validate required fields before database operations.
5. **Frontend path alias**: `@/` maps to `frontend/src/` (configured in `vite.config.ts` and `tsconfig.json`).
6. **No virtual DOM**: SolidJS is NOT React. Do not use React patterns (useState, useEffect, etc.). Use SolidJS primitives: `createSignal`, `createResource`, `createEffect`, `createMemo`, `Show`, `For`, `Switch/Match`.
7. **Cookie auth only**: The API uses HTTP-only cookies, not Authorization headers. The `api` client sets `credentials: 'include'` on every request.
8. **Single-user design**: This is a personal finance app. There is no multi-tenant isolation. All transactions and categories are global.
9. **Idempotent migrations**: New columns are added via `ALTER TABLE ADD COLUMN` with errors swallowed. Never drop existing tables or columns.
10. **Embedded frontend**: After frontend changes, run `make frontend` to copy the dist to `backend/src/embedded/` before compiling the backend.

## Security Notes

- `veb.auth` uses SHA-256 with a single salt iteration. Adequate for personal/self-hosted use only.
- For public-facing deployments, replace with bcrypt/Argon2/PBKDF2 per OWASP guidelines.
- Session tokens are UUID v4, stored in the `tokens` table, sent as HTTP-only cookies.

