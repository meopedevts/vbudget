import {createResource, createMemo, Show, For} from "solid-js"
import {TrendingUp, TrendingDown, Wallet, ArrowUpRight, ArrowDownRight} from "lucide-solid"
import {Card, CardContent, CardHeader, CardTitle, CardDescription} from "@/components/ui/card"
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from "@/components/ui/table"
import {Badge} from "@/components/ui/badge"
import {Skeleton} from "@/components/ui/skeleton"
import {transactionsService, categoriesService} from "@/lib/api"
import type {Transaction, Category} from "@/lib/api"
import {formatCurrency, formatDate} from "@/lib/format"

export function Dashboard() {
  const [transactions] = createResource(() => transactionsService.list().catch(() => [] as Transaction[]))
  const [categories]   = createResource(() => categoriesService.list().catch(() => [] as Category[]))

  const categoryMap = createMemo(() => {
    const map = new Map<number, Category>()
    for (const c of categories() ?? []) map.set(c.id, c)
    return map
  })

  const summary = createMemo(() => {
    const txs = transactions() ?? []
    let income = 0, incomeProvision = 0
    let expense = 0, expenseProvision = 0

    for (const tx of txs) {
      const paid = tx.status === "paid"
      if (tx.kind === "income") {
        if (paid) income          += tx.amount
        else      incomeProvision += tx.amount
      } else {
        if (paid) expense          += tx.amount
        else      expenseProvision += tx.amount
      }
    }

    return {
      balance:          income - expense,
      balanceProvision: incomeProvision - expenseProvision,
      income,           incomeProvision,
      expense,          expenseProvision,
    }
  })

  const recentTransactions = createMemo(() =>
    [...(transactions() ?? [])]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 10),
  )

  return (
    <div class="space-y-6">
      <h1 class="text-2xl font-bold">Dashboard</h1>

      {/* Summary Cards */}
      <div class="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader class="pb-2">
            <CardDescription class="flex items-center gap-2">
              <Wallet class="size-4"/>
              Saldo Liquidado
            </CardDescription>
            <CardTitle class="text-2xl">
              <Show when={!transactions.loading} fallback={<Skeleton class="h-8 w-32"/>}>
                {formatCurrency(summary().balance)}
              </Show>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p class="text-xs text-muted-foreground">
              Provisão: {formatCurrency(summary().balance + summary().balanceProvision)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader class="pb-2">
            <CardDescription class="flex items-center gap-2">
              <TrendingUp class="size-4 text-emerald-500"/>
              Receitas
            </CardDescription>
            <CardTitle class="text-2xl text-emerald-600">
              <Show when={!transactions.loading} fallback={<Skeleton class="h-8 w-32"/>}>
                {formatCurrency(summary().income)}
              </Show>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p class="text-xs text-muted-foreground">
              Provisão: +{formatCurrency(summary().incomeProvision)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader class="pb-2">
            <CardDescription class="flex items-center gap-2">
              <TrendingDown class="size-4 text-red-500"/>
              Despesas
            </CardDescription>
            <CardTitle class="text-2xl text-red-600">
              <Show when={!transactions.loading} fallback={<Skeleton class="h-8 w-32"/>}>
                {formatCurrency(summary().expense)}
              </Show>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p class="text-xs text-muted-foreground">
              Provisão: +{formatCurrency(summary().expenseProvision)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <CardTitle>Últimas Transações</CardTitle>
          <CardDescription>As 10 transações mais recentes</CardDescription>
        </CardHeader>
        <CardContent>
          <Show
            when={!transactions.loading}
            fallback={
              <div class="space-y-3">
                <Skeleton class="h-10 w-full"/>
                <Skeleton class="h-10 w-full"/>
                <Skeleton class="h-10 w-full"/>
              </div>
            }
          >
            <Show
              when={recentTransactions().length > 0}
              fallback={
                <p class="py-8 text-center text-sm text-muted-foreground">
                  Nenhuma transação encontrada.
                </p>
              }
            >
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead class="text-right">Valor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Vencimento</TableHead>
                    <TableHead>Data da Baixa</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <For each={recentTransactions()}>
                    {(tx) => (
                      <TableRow>
                        <TableCell class="font-medium">{tx.description}</TableCell>
                        <TableCell>
                          <div class="flex items-center gap-1">
                            {tx.kind === "income"
                              ? <ArrowUpRight class="size-3.5 text-emerald-500"/>
                              : <ArrowDownRight class="size-3.5 text-red-500"/>}
                            <span class={tx.kind === "income" ? "text-emerald-600" : "text-red-600"}>
                              {tx.kind === "income" ? "Receita" : "Despesa"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell class="text-muted-foreground">
                          {(() => {
                            const cat = categoryMap().get(tx.category_id)
                            return cat
                              ? (
                                <Badge
                                  variant="outline"
                                  class="gap-1.5 border-transparent"
                                  style={{"background-color": `${cat.color}20`, "color": cat.color, "border-color": `${cat.color}40`}}
                                >
                                  <div class="size-1.5 rounded-full shrink-0" style={{background: cat.color}}/>
                                  {cat.name}
                                </Badge>
                              )
                              : <span>—</span>
                          })()}
                        </TableCell>
                        <TableCell class="text-right font-mono">
                          <span class={tx.kind === "income" ? "text-emerald-600" : "text-red-600"}>
                            {tx.kind === "expense" ? "−\u00A0" : "+\u00A0"}{formatCurrency(tx.amount)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge variant={tx.status === "paid" ? "default" : "secondary"}>
                            {tx.status === "paid" ? "Baixado" : "Pendente"}
                          </Badge>
                        </TableCell>
                        <TableCell class="text-muted-foreground">
                          {formatDate(tx.due_date)}
                        </TableCell>
                        <TableCell class="text-muted-foreground">
                          {formatDate(tx.paid_date)}
                        </TableCell>
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
