import {createMemo, createResource, For, Show} from "solid-js"
import {
  createColumnHelper,
  createSolidTable,
  flexRender,
  getCoreRowModel,
} from "@tanstack/solid-table"
import {AlertCircle, ArrowDownRight, ArrowUpRight} from "lucide-solid"
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card"
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from "@/components/ui/table"
import {Badge} from "@/components/ui/badge"
import type {Category, Transaction} from "@/lib/api"
import {categoriesService, transactionsService} from "@/lib/api"
import {formatCurrency, formatDate} from "@/lib/format"
import CreateEditTransactionDialog from "@/components/transactions/create-edit-transaction-dialog"
import DeleteTransactionDialog from "@/components/transactions/delete-transaction-dialog"
import SettleTransactionDialog from "@/components/transactions/settle-transaction-dialog"

// ── helpers ───────────────────────────────────────────────────────────────────

const kindLabel   = (k: string) => k === "income" ? "Receita" : "Despesa"
const statusLabel = (s: string) => s === "paid" ? "Baixado" : "Pendente"

const isOverdue = (t: Transaction) => {
  if (t.status === "paid") return false
  const due = new Date(t.due_date)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return due < today
}

// ── column definition ─────────────────────────────────────────────────────────

const col = createColumnHelper<Transaction>()

// ── component ─────────────────────────────────────────────────────────────────

export default function Transactions() {
  const [transactions, {refetch}] = createResource(
    () => transactionsService.list().catch(() => [] as Transaction[]),
  )
  const [categories] = createResource(
    () => categoriesService.list().catch(() => [] as Category[]),
  )

  const categoryMap = createMemo(() => {
    const map = new Map<number, Category>()
    for (const c of categories() ?? []) map.set(c.id, c)
    return map
  })

  const columns = createMemo(() => [
    col.accessor("description", {header: "Descrição"}),
    col.accessor("kind", {
      header: "Tipo",
      cell: (info) => (
        <div class="flex items-center gap-1.5">
          {info.getValue() === "income"
            ? <ArrowUpRight class="size-4 text-emerald-500"/>
            : <ArrowDownRight class="size-4 text-red-500"/>}
          <span class={info.getValue() === "income" ? "text-emerald-600" : "text-red-600"}>
            {kindLabel(info.getValue())}
          </span>
        </div>
      ),
    }),
    col.accessor("amount", {
      header: "Valor",
      cell: (info) => (
        <span class={`font-mono font-medium ${
          info.row.original.kind === "income" ? "text-emerald-600" : "text-red-600"
        }`}>
          {info.row.original.kind === "expense" ? "−\u00A0" : "+\u00A0"}
          {formatCurrency(info.getValue())}
        </span>
      ),
    }),
    col.accessor("category_id", {
      header: "Categoria",
      cell: (info) => {
        const cat = categoryMap().get(info.row.original.category_id)
        if (!cat) return <span class="text-muted-foreground">—</span>
        return (
          <Badge
            variant="outline"
            class="gap-1.5 border-transparent"
            style={{"background-color": `${cat.color}20`, "color": cat.color, "border-color": `${cat.color}40`}}
          >
            <div class="size-1.5 rounded-full shrink-0" style={{background: cat.color}}/>
            {cat.name}
          </Badge>
        )
      },
    }),
    col.accessor("due_date", {
      header: "Vencimento",
      cell: (info) => {
        const overdue = isOverdue(info.row.original)
        return (
          <div class="flex items-center gap-1">
            <Show when={overdue}>
              <AlertCircle class="size-3.5 text-destructive shrink-0"/>
            </Show>
            <span class={overdue ? "text-destructive font-medium" : ""}>
              {formatDate(info.getValue())}
            </span>
          </div>
        )
      },
    }),
    col.accessor("status", {
      header: "Status",
      cell: (info) => (
        <Badge variant={info.getValue() === "paid" ? "default" : "secondary"}>
          {statusLabel(info.getValue())}
        </Badge>
      ),
    }),
    col.accessor("paid_date", {
      header: "Data da Baixa",
      cell: (info) => (
        <span class="text-muted-foreground">
          {formatDate(info.getValue())}
        </span>
      ),
    }),
    col.display({
      id: "actions",
      header: "",
      cell: (info) => {
        const t = info.row.original
        return (
          <div class="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
            {/* Baixar — only for pending transactions */}
            <Show when={t.status !== "paid"}>
              <SettleTransactionDialog
                onSettle={async (paid_date) => {
                  await transactionsService.update(t.id, {
                    description: t.description,
                    amount:      t.amount,
                    kind:        t.kind,
                    status:      "paid",
                    category_id: t.category_id,
                    due_date:    t.due_date,
                    paid_date,
                  })
                  refetch()
                }}
              />
            </Show>
            <CreateEditTransactionDialog
              transaction={t}
              categories={categories() ?? []}
              onSave={async (data) => {
                await transactionsService.update(t.id, data)
                refetch()
              }}
              onDelete={async () => {
                await transactionsService.delete(t.id)
                refetch()
              }}
            />
            <DeleteTransactionDialog
              onDelete={async () => {
                await transactionsService.delete(t.id)
                refetch()
              }}
            />
          </div>
        )
      },
    }),
  ])

  const table = createSolidTable({
    get data() { return transactions() ?? [] },
    get columns() { return columns() },
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold">Lançamentos</h1>
          <p class="text-sm text-muted-foreground mt-1">
            Gerencie receitas e despesas. Lançamentos pendentes podem ser baixados quando liquidados.
          </p>
        </div>
        <CreateEditTransactionDialog
          categories={categories() ?? []}
          onSave={async (data) => {
            await transactionsService.create(data)
            refetch()
          }}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Receitas e Despesas</CardTitle>
          <CardDescription>
            Lançamentos com <AlertCircle class="inline size-3 text-destructive mx-0.5"/>
            indicam vencimento em atraso.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Show
            when={!transactions.loading}
            fallback={
              <p class="py-8 text-center text-sm text-muted-foreground">Carregando...</p>
            }
          >
            <Show
              when={(transactions() ?? []).length > 0}
              fallback={
                <p class="py-8 text-center text-sm text-muted-foreground">
                  Nenhum lançamento encontrado. Clique em "Novo Lançamento" para começar.
                </p>
              }
            >
              <Table>
                <TableHeader>
                  <For each={table.getHeaderGroups()}>
                    {(headerGroup) => (
                      <TableRow>
                        <For each={headerGroup.headers}>
                          {(header) => (
                            <TableHead>
                              {header.isPlaceholder
                                ? null
                                : flexRender(header.column.columnDef.header, header.getContext())}
                            </TableHead>
                          )}
                        </For>
                      </TableRow>
                    )}
                  </For>
                </TableHeader>
                <TableBody>
                  <For each={table.getRowModel().rows}>
                    {(row) => (
                      <TableRow
                        class={isOverdue(row.original) ? "bg-destructive/5 hover:bg-destructive/10" : ""}
                      >
                        <For each={row.getVisibleCells()}>
                          {(cell) => (
                            <TableCell>
                              {flexRender(cell.column.columnDef.cell, cell.getContext())}
                            </TableCell>
                          )}
                        </For>
                      </TableRow>
                    )}
                  </For>
                </TableBody>
              </Table>
            </Show>
          </Show>
        </CardContent>
      </Card>
    </div>
  )
}
