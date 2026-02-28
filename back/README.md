# vbudget — Backend

V backend with veb and SQLite. Compiles to a single binary that embeds the frontend bundle.

## Stack

- **Language** — [V](https://vlang.io)
- **HTTP** — veb (V's built-in web framework)
- **Database** — SQLite via V's built-in ORM
- **Frontend serving** — `$embed_file` (bundle baked into the binary at compile time)

## Project layout

```
back/
├── src/
│   ├── main.v                      # Entry point
│   ├── db/
│   │   ├── models.v                # Structs and enums (Category, Transaction)
│   │   ├── db.v                    # Connection, open(), migrate()
│   │   ├── categories.v            # Category CRUD
│   │   └── transactions.v          # Transaction CRUD
│   ├── server/
│   │   ├── server.v                # App/Context structs, new(), run()
│   │   ├── spa.v                   # SPA routes (/app, /app/:path..., redirect /)
│   │   ├── health_handler.v        # GET /api/health
│   │   ├── categories_handler.v    # CRUD /api/categories
│   │   └── transactions_handler.v  # CRUD /api/transactions
│   └── embedded/                   # Frontend bundle copied here by `make front`
│       ├── index.html
│       └── assets/
├── bin/
│   └── vbudget                     # Compiled binary (gitignored)
└── v.mod
```

## Database schema

### `categories`

| Column | Type    | Notes                        |
|--------|---------|------------------------------|
| id     | INTEGER | Primary key, auto-increment  |
| name   | TEXT    | Category label               |
| kind   | INTEGER | `0` = income, `1` = expense  |
| color  | TEXT    | Hex color string e.g. `#22c55e` |

### `transactions`

| Column      | Type    | Notes                                        |
|-------------|---------|----------------------------------------------|
| id          | INTEGER | Primary key, auto-increment                  |
| description | TEXT    | Free text                                    |
| amount      | REAL    | Positive value                               |
| kind        | INTEGER | `0` = income, `1` = expense                  |
| status      | INTEGER | `0` = pending, `1` = paid                    |
| category_id | INTEGER | FK → categories.id                           |
| due_date    | TEXT    | ISO date string `YYYY-MM-DD`                 |
| paid_date   | TEXT    | ISO date string, empty string = not yet paid |
| created_at  | INTEGER | Unix timestamp via `time.now()`              |

### Enums (V → JSON)

V enums serialize to their field name in **lowercase**. The frontend must use the same casing.

```v
pub enum TransactionKind   { income  expense }   // JSON: "income"  | "expense"
pub enum TransactionStatus { pending paid    }   // JSON: "pending" | "paid"
```

## Migrations

`db.migrate()` runs on every startup and is fully idempotent:

1. `create table Category` / `create table Transaction` — no-op if tables exist
2. `ALTER TABLE ... ADD COLUMN ... or {}` — adds new columns silently if they already exist (SQLite does not support `IF NOT EXISTS` on `ADD COLUMN`)

This means you can update the models and restart — existing data is preserved.

## API

All endpoints are under `/api/`. The SPA fallback only matches `/app/*`, so API routes are never intercepted.

### Health

| Method | Path         | Response        |
|--------|--------------|-----------------|
| GET    | /api/health  | `"ok"` (200)    |

### Categories

| Method | Path               | Body                          | Response          |
|--------|--------------------|-------------------------------|-------------------|
| GET    | /api/categories    | —                             | `Category[]`      |
| GET    | /api/categories/:id| —                             | `Category`        |
| POST   | /api/categories    | `{name, kind, color}`         | `Category` (201)  |
| PUT    | /api/categories/:id| `{name, kind, color}`         | `Category`        |
| DELETE | /api/categories/:id| —                             | 204               |

### Transactions

| Method | Path                  | Body                                                   | Response            |
|--------|-----------------------|--------------------------------------------------------|---------------------|
| GET    | /api/transactions     | —                                                      | `Transaction[]`     |
| GET    | /api/transactions/:id | —                                                      | `Transaction`       |
| POST   | /api/transactions     | `{description, amount, kind, status, category_id, due_date, paid_date}` | `Transaction` (201) |
| PUT    | /api/transactions/:id | same as POST                                           | `Transaction`       |
| DELETE | /api/transactions/:id | —                                                      | 204                 |

> `GET /api/transactions` returns rows ordered by `due_date ASC` — earliest due first.

## SPA routing

| Route         | Behaviour                        |
|---------------|----------------------------------|
| `/`           | 302 redirect → `/app`            |
| `/app`        | Serves `index.html`              |
| `/app/:path…` | Serves `index.html` (SPA routes) |
| `/api/*`      | Handled by API handlers only     |
| `/assets/*`   | Serves embedded JS/CSS bundles   |

## Running

```bash
# Development (no embedded frontend needed)
v run src/

# Production build
v src/ -o bin/vbudget
./bin/vbudget
```

Server starts on `:8181`.

