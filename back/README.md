# vbudget — Backend

V backend with veb, veb.auth and SQLite. Compiles to a single binary that embeds the frontend bundle.

## Stack

- **Language** — [V](https://vlang.io)
- **HTTP** — veb (V's built-in web framework)
- **Auth** — `veb.auth` — cookie-based session tokens, SHA-256 password hashing
- **Database** — SQLite via V's built-in ORM
- **Frontend serving** — `$embed_file` (bundle baked into the binary at compile time)

## Project layout

```
back/
├── src/
│   ├── main.v                      # Entry point
│   ├── db/
│   │   ├── models.v                # Structs and enums (Category, Transaction, User)
│   │   ├── db.v                    # Connection, open(), migrate()
│   │   ├── categories.v            # Category CRUD
│   │   ├── transactions.v          # Transaction CRUD
│   │   └── users.v                 # User CRUD (find_user_by_name, create_user, …)
│   ├── server/
│   │   ├── server.v                # App / Context structs, new(), run()
│   │   ├── spa_handler.v           # SPA routes (/app, /app/:path…, redirect /)
│   │   ├── health_handler.v        # GET /api/health
│   │   ├── auth_handler.v          # POST /api/auth/register·login·logout, GET /api/auth/me
│   │   ├── categories_handler.v    # CRUD /api/categories  (protected)
│   │   └── transactions_handler.v  # CRUD /api/transactions (protected)
│   └── embedded/                   # Frontend bundle copied here by `make front`
│       ├── index.html
│       └── assets/
├── bin/
│   └── vbudget                     # Compiled binary (gitignored)
└── v.mod
```

## Authentication

Authentication is implemented with [`veb.auth`](https://modules.vlang.io/veb.auth.html).

### How it works

1. On **register** or **login** the server creates a random UUID token via `auth.add_token(user_id)` and stores it in the `tokens` table.
2. The token is sent to the browser as an HTTP-only `token` cookie.
3. On every protected request the helper `app.get_auth_user(mut ctx)` reads that cookie, looks up the token in the DB, and returns the associated `User` — or `none` if invalid, producing a `401` response.
4. On **logout** all tokens for that user are deleted via `auth.delete_tokens(user_id)`.

### App struct

```v
pub struct App {
pub mut:
    db   &db.Database = unsafe { nil }
    auth auth.Auth[sqlite.DB]
}
```

`auth.Auth[sqlite.DB]` is initialized in `new()`:

```v
app.auth = auth.new(database.conn)
```

`auth.new()` automatically creates the `tokens` table on first run.

### Protecting a handler

```v
@['/api/transactions'; get]
pub fn (mut app App) list_transactions(mut ctx Context) veb.Result {
    app.get_auth_user(mut ctx) or { return ctx.unauthorized() }
    // …
}
```

> ⚠️ **Security note** — `veb.auth` uses SHA-256 with a single salt iteration. Adequate for personal/self-hosted use.
> For public-facing deployments replace with bcrypt, Argon2 or PBKDF2 per the
> [OWASP Password Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html).

## Database schema

### `users`

| Column        | Type    | Notes                       |
|---------------|---------|-----------------------------|
| id            | INTEGER | Primary key, auto-increment |
| name          | TEXT    | Unique login handle         |
| password_hash | TEXT    | SHA-256 hex digest          |
| salt          | TEXT    | Random salt string          |

### `tokens` *(managed by `veb.auth`)*

| Column  | Type    | Notes                       |
|---------|---------|-----------------------------|
| id      | INTEGER | Primary key, auto-increment |
| user_id | INTEGER | FK → users.id               |
| value   | TEXT    | UUID v4 token               |

### `categories`

| Column | Type    | Notes                           |
|--------|---------|---------------------------------|
| id     | INTEGER | Primary key, auto-increment     |
| name   | TEXT    | Category label                  |
| kind   | INTEGER | `0` = income, `1` = expense     |
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

1. `create table Category` / `create table Transaction` / `create table User` — no-op if tables exist
2. `ALTER TABLE ... ADD COLUMN ... or {}` — adds new columns silently if they already exist (SQLite does not support `IF NOT EXISTS` on `ADD COLUMN`)
3. `auth.new(conn)` creates the `tokens` table automatically

This means you can update the models and restart — existing data is preserved.

## API

All endpoints are under `/api/`. The SPA fallback only matches `/app/*`, so API routes are never intercepted.

Endpoints marked 🔒 require a valid `token` cookie. Unauthenticated requests receive `401 {"message":"unauthorized"}`.

### Health

| Method | Path        | Auth | Response     |
|--------|-------------|------|--------------|
| GET    | /api/health | —    | `"ok"` (200) |

### Auth

| Method | Path                  | Auth | Body                   | Response              |
|--------|-----------------------|------|------------------------|-----------------------|
| POST   | /api/auth/register    | —    | `{name, password}`     | `{id, name}` + cookie |
| POST   | /api/auth/login       | —    | `{name, password}`     | `{id, name}` + cookie |
| POST   | /api/auth/logout      | 🔒   | —                      | 204 + clears cookie   |
| GET    | /api/auth/me          | 🔒   | —                      | `{id, name}`          |

### Categories 🔒

| Method | Path                | Body                  | Response         |
|--------|---------------------|-----------------------|------------------|
| GET    | /api/categories     | —                     | `Category[]`     |
| GET    | /api/categories/:id | —                     | `Category`       |
| POST   | /api/categories     | `{name, kind, color}` | `Category` (201) |
| PUT    | /api/categories/:id | `{name, kind, color}` | `Category`       |
| DELETE | /api/categories/:id | —                     | 204              |

### Transactions 🔒

| Method | Path                  | Body                                                                    | Response            |
|--------|-----------------------|-------------------------------------------------------------------------|---------------------|
| GET    | /api/transactions     | —                                                                       | `Transaction[]`     |
| GET    | /api/transactions/:id | —                                                                       | `Transaction`       |
| POST   | /api/transactions     | `{description, amount, kind, status, category_id, due_date, paid_date}` | `Transaction` (201) |
| PUT    | /api/transactions/:id | same as POST                                                            | `Transaction`       |
| DELETE | /api/transactions/:id | —                                                                       | 204                 |

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
