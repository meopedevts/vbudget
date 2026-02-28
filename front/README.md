# vbudget — Frontend

SolidJS SPA served under `/app`. In development, Vite proxies `/api/*` to the backend. In production, the bundle is embedded into the V binary.

## Stack

| Dependency              | Role                                      |
|-------------------------|-------------------------------------------|
| [SolidJS](https://solidjs.com) | Reactive UI framework              |
| [Vite](https://vitejs.dev) | Build tool and dev server              |
| [TailwindCSS v4](https://tailwindcss.com) | Utility-first styles          |
| [@kobalte/core](https://kobalte.dev) | Accessible headless UI primitives |
| [@solidjs/router](https://github.com/solidjs/solid-router) | Client-side routing |
| [@tanstack/solid-form](https://tanstack.com/form) | Form state management     |
| [@tanstack/solid-table](https://tanstack.com/table) | Headless data tables      |
| [valibot](https://valibot.dev) | Schema validation (form adapter)      |
| [lucide-solid](https://lucide.dev) | Icon set                          |
| [somoto](https://github.com/hngngn/somoto) | Toast notifications            |

## Project layout

```
front/src/
├── index.tsx                       # App entry — Router, routes, Toaster
├── styles/
│   └── index.css                   # Tailwind base + CSS variables
├── lib/
│   ├── api/
│   │   ├── types.ts                # All shared TypeScript interfaces and types
│   │   ├── client.ts               # Fetch wrapper with error handling
│   │   ├── index.ts                # Barrel export
│   │   ├── categories.ts           # categoriesService
│   │   ├── transactions.ts         # transactionsService
│   │   ├── notifications.ts        # notificationsService
│   │   └── integrations.ts         # integrationsService
│   ├── format.ts                   # formatCurrency, formatDate
│   ├── cva.ts                      # cva + cx helpers
│   ├── combine-style.ts
│   ├── call-handler.ts
│   └── use-mobile.ts
├── components/
│   ├── layout.tsx                  # SidebarProvider + SidebarInset shell
│   ├── app-sidebar.tsx             # Nav items + Settings footer link
│   ├── ui/                         # Kobalte-based design system components
│   ├── settings/
│   │   └── categories-dialog.tsx   # Full categories CRUD in a dialog
│   ├── transactions/
│   │   ├── create-edit-transaction-dialog.tsx
│   │   ├── delete-transaction-dialog.tsx
│   │   └── settle-transaction-dialog.tsx
│   └── notifications/
│       ├── create-edit-alert-dialog.tsx
│       └── delete-alert-dialog.tsx
└── pages/
    ├── dashboard.tsx               # Summary cards + recent transactions
    ├── transactions.tsx            # Full transactions table with actions
    ├── settings.tsx                # Settings page (categories group)
    ├── notifications.tsx           # Alert rules management
    └── integrations.tsx            # Integrations scaffold
```

## Pages

### Dashboard (`/app`)

- **Saldo Baixado** — sum of all `paid` transactions (income − expense)
  - Subtitle shows the projected balance including `pending` transactions
- **Receitas** — sum of paid income + provisioned (pending) income below
- **Despesas** — sum of paid expense + provisioned (pending) expense below
- **Recent transactions** table — last 10 by `created_at`, with category badge, status, due date and payment date

### Transactions (`/app/transactions`)

Full CRUD table ordered by `due_date ASC`.

| Column        | Notes                                              |
|---------------|----------------------------------------------------|
| Descrição     | Free text                                          |
| Tipo          | Income (↑ green) / Expense (↓ red)                 |
| Valor         | Color-coded monospaced amount                      |
| Categoria     | Colored badge using the category's hex color       |
| Vencimento    | Due date — red + alert icon if overdue and pending |
| Status        | Badge: Pendente / Baixado                          |
| Data da Baixa | Payment date when status = paid                    |
| Actions       | Baixar · Edit · Delete                             |

**Settle flow** — "Baixar" opens a dialog to confirm the payment date. Status is set to `paid` and `paid_date` is recorded.

**Overdue rows** — transactions with `status = pending` and `due_date < today` are highlighted with a red tint.

### Settings (`/app/settings`)

Card-based layout. Currently contains one group:

**Categorias** — opens a dialog with a unified table (Nome, Tipo, Cor). Create and edit use TanStack Form with validation. The list loads lazily when the dialog opens.

## Forms (TanStack Form + Valibot)

All forms follow the same pattern. See [`.github/instructions/tanstack-form.instructions.md`](../.github/instructions/tanstack-form.instructions.md) for the full reference.

```tsx
const form = createForm(() => ({
  defaultValues: { name: "" },
  validators: { onSubmit: formSchema },
  onSubmit: async ({ value }) => { /* call API */ },
}))
```

Key conventions used in this project:

- `Select<Category>` with `optionValue="id"` — Kobalte compares by `id` (not reference), required for async-loaded options
- Category `Select` nested inside the `kind` field render so that the filtered option list is reactive
- `paid_date` field conditionally rendered inside the `status` field render callback — reactivity is guaranteed without `createEffect`
- `createResource(source, fetcher)` two-argument form for lazy-loaded dialogs — the source signal drives re-fetching when the dialog opens

## API client

```ts
import { categoriesService, transactionsService } from "@/lib/api"

const categories = await categoriesService.list()
await transactionsService.update(id, payload)
```

All services return typed responses matching the interfaces in `types.ts`. The base URL is empty by default — requests use relative paths (`/api/...`) which work through the Vite proxy in dev and directly against the backend in production.

## Development

```bash
pnpm install
pnpm dev       # http://localhost:3000/app
```

Requires the backend running on `:8181` (proxied automatically).

## Build

```bash
pnpm build     # outputs to dist/
```

The `dist/` output is copied to `back/src/embedded/` by `make front` and embedded into the V binary at compile time.
