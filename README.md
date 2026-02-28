# vbudget

> Personal finance manager with V, SQLite and SolidJS.

A self-hosted, single-binary personal budget manager. The backend is written in [V](https://vlang.io) and embeds the
frontend bundle at compile time — the result is one executable with zero runtime dependencies.

## Stack

| Layer    | Technology                             |
|----------|----------------------------------------|
| Backend  | V · veb · SQLite (ORM)                 |
| Frontend | SolidJS · TailwindCSS · Kobalte        |
| Build    | Vite (frontend) · V compiler (backend) |
| Deploy   | Single binary or Docker                |

## Project structure

```
vbudget/
├── back/          # V backend — HTTP server, SQLite, embedded SPA
├── front/         # SolidJS frontend — Vite, TailwindCSS, TanStack
├── Makefile       # Build and run targets
└── Dockerfile     # Multi-stage production image
```

See the detailed docs for each layer:

- [`back/README.md`](back/README.md) — API, database schema, migrations, project layout
- [`front/README.md`](front/README.md) — pages, components, form patterns, API client

## Quick start

### Prerequisites

- [V](https://vlang.io) (latest)
- [Node.js](https://nodejs.org) + [pnpm](https://pnpm.io)

### Development

Start the backend:

```bash
cd back
v run src/
```

Start the frontend dev server (proxies `/api/*` to `localhost:8181`):

```bash
cd front
pnpm dev
```

Open [http://localhost:3000/app](http://localhost:3000/app).

### Production (single binary)

```bash
make run
```

This runs `make front` → `make back` → executes the binary sequentially.
The frontend bundle is embedded into the binary at compile time.

### Docker

```bash
make docker-build
docker run -p 8181:8181 -v vbudget_data:/data vbudget
```

Or with the provided compose file:

```bash
docker compose up -d
```

Open [http://localhost:8181/app](http://localhost:8181/app).

The runtime image is **Alpine 3** (~5 MB base). The binary is compiled with `musl-gcc` producing a fully static executable — no libc dependency at runtime.

The SQLite database is created at `/data/vbudget.db` inside the container. Mount a volume at `/data` to persist data across restarts (the compose file does this automatically via a named volume).

## Makefile targets

| Target              | Description                                              |
|---------------------|----------------------------------------------------------|
| `make front`        | Build the Vite bundle and copy it to `back/src/embedded` |
| `make back`         | Compile the V binary (embeds the frontend bundle)        |
| `make run`          | `front` → `back` → start the server                      |
| `make all`          | `front` + `back` (no server start)                       |
| `make clean`        | Remove `front/dist` and `back/src/embedded` artifacts    |
| `make docker-build` | Build the production Docker image                        |

## Footprint

Numbers measured on Linux x86-64 with the full MVP bundle embedded.

### Binary

| Metric                                    | Value        |
|-------------------------------------------|--------------|
| Binary size (backend + embedded frontend) | **5.6 MB**   |
| RSS — physical RAM in use at idle         | **~17.7 MB** |
| Virtual address space                     | ~157 MB ¹    |

> ¹ VmSize is the process address space, most of which is never backed by physical RAM. The number that matters for
> capacity planning is RSS.

### Frontend bundle

| Asset                         | Raw    | gzip       | Reduction |
|-------------------------------|--------|------------|-----------|
| `index.js` (SolidJS + all UI) | 405 KB | 115 KB     | −71%      |
| `index.css` (Tailwind)        | 68 KB  | 11 KB      | −84%      |
| **Total over the wire**       | 473 KB | **126 KB** | −73%      |

The JS and CSS are compressed with zlib at compile time via `$embed_file(..., .zlib)` and served directly from memory —
no filesystem reads at runtime.

- **Transactions** — create, edit, delete income and expense entries with due date
- **Settle flow** — mark pending transactions as paid with a confirmed payment date
- **Overdue detection** — pending transactions past their due date are highlighted
- **Categories** — color-coded categories filtered by income/expense type
- **Dashboard** — real balance (paid only) + provisioned balance (including pending), summary cards and recent
  transactions table
- **Settings** — category management without leaving the main flow

## License

MIT

