---
applyTo: "frontend/src/**"
---

# Date Picker — instruções de implementação

## Visão geral

Um Date Picker neste projeto é uma **composição** de dois primitivos já disponíveis:

| Primitivo  | Pacote de origem        | Wrapper local              |
|------------|-------------------------|----------------------------|
| `Calendar` | `@corvu/calendar`       | `@/components/ui/calendar` |
| `Popover`  | `@kobalte/core/popover` | `@/components/ui/popover`  |

`<Calendar>` utiliza o padrão de **render prop**: recebe uma função-filha `(props) => JSX` que expõe o estado reativo do
calendário. Todo o controle de seleção (valor, navegação, semanas, dias) vem por esses `props`.

**Nunca** importe diretamente de `@corvu/calendar` ou `@kobalte/core/popover` — use sempre os wrappers locais, que
aplicam os estilos e atributos `data-slot` do design system.

---

## Formatadores pt-BR

Declare os formatadores **uma única vez** no topo do arquivo, fora do componente:

```tsx
// Dia da semana — nome longo para o atributo `abbr` (acessibilidade)
const {format: formatWeekdayLong} = new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
})

// Dia da semana — nome curto para exibição na grade
const {format: formatWeekdayShort} = new Intl.DateTimeFormat("pt-BR", {
    weekday: "short",
})

// Mês por extenso para o cabeçalho do calendário
const {format: formatMonth} = new Intl.DateTimeFormat("pt-BR", {
    month: "long",
})
```

Para **exibir a data selecionada no botão trigger**, use sempre o helper já existente:

```tsx
import {formatDate} from "@/lib/format"
// ex: formatDate("2026-02-28") → "28/02/2026"
```

---

## Exemplo 1 — Seleção de data única (`mode="single"`)

```tsx
import { Show } from "solid-js"
import { Index } from "solid-js"

import { Button } from "@/components/ui/button"
import {
  Calendar,
  CalendarCell,
  CalendarCellTrigger,
  CalendarHeadCell,
  CalendarLabel,
  CalendarNav,
  CalendarTable,
} from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverPortal,
  PopoverTrigger,
} from "@/components/ui/popover"
import { formatDate } from "@/lib/format"

const { format: formatWeekdayLong }  = new Intl.DateTimeFormat("pt-BR", { weekday: "long" })
const { format: formatWeekdayShort } = new Intl.DateTimeFormat("pt-BR", { weekday: "short" })
const { format: formatMonth }        = new Intl.DateTimeFormat("pt-BR", { month: "long" })

const DatePickerSingle = () => {
  return (
    <Calendar mode="single">
      {(props) => (
        <Popover>
          <PopoverTrigger<typeof Button>
            as={(triggerProps) => (
              <Button
                variant="outline"
                class="min-w-48 justify-between font-normal"
                {...triggerProps}
              >
                <Show when={props.value} fallback="Selecione uma data">
                  {formatDate(props.value!)}
                </Show>
                <svg xmlns="http://www.w3.org/2000/svg" class="size-4" viewBox="0 0 24 24">
                  <path
                    fill="none"
                    stroke="currentColor"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="m6 9 6 6 6-6"
                  />
                </svg>
              </Button>
            )}
          />
          <PopoverPortal>
            <PopoverContent class="w-auto overflow-hidden p-0">
              <div class="rounded-md p-3 shadow-sm">
                <div class="relative flex items-center justify-between mb-1">
                  <CalendarNav action="prev-month" aria-label="Mês anterior" />
                  <CalendarLabel class="text-sm font-medium">
                    {formatMonth(props.months[0].month)}{" "}
                    {props.months[0].month.getFullYear()}
                  </CalendarLabel>
                  <CalendarNav action="next-month" aria-label="Próximo mês" />
                </div>
                <CalendarTable>
                  <thead>
                    <tr class="flex">
                      <Index each={props.weekdays}>
                        {(weekday) => (
                          <CalendarHeadCell abbr={formatWeekdayLong(weekday())}>
                            {formatWeekdayShort(weekday())}
                          </CalendarHeadCell>
                        )}
                      </Index>
                    </tr>
                  </thead>
                  <tbody>
                    <Index each={props.months[0].weeks}>
                      {(week) => (
                        <tr class="mt-2 flex w-full">
                          <Index each={week()}>
                            {(day) => (
                              <CalendarCell>
                                <CalendarCellTrigger
                                  day={day()}
                                  month={props.months[0].month}
                                >
                                  {day().getDate()}
                                </CalendarCellTrigger>
                              </CalendarCell>
                            )}
                          </Index>
                        </tr>
                      )}
                    </Index>
                  </tbody>
                </CalendarTable>
              </div>
            </PopoverContent>
          </PopoverPortal>
        </Popover>
      )}
    </Calendar>
  )
}
```

---

## Exemplo 2 — Seleção de intervalo (`mode="range"`)

```tsx
import { Index, Show } from "solid-js"

import { Button } from "@/components/ui/button"
import {
  Calendar,
  CalendarCell,
  CalendarCellTrigger,
  CalendarHeadCell,
  CalendarLabel,
  CalendarNav,
  CalendarTable,
} from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverPortal,
  PopoverTrigger,
} from "@/components/ui/popover"
import { formatDate } from "@/lib/format"

const { format: formatWeekdayLong }  = new Intl.DateTimeFormat("pt-BR", { weekday: "long" })
const { format: formatWeekdayShort } = new Intl.DateTimeFormat("pt-BR", { weekday: "short" })
const { format: formatMonth }        = new Intl.DateTimeFormat("pt-BR", { month: "long" })

const DatePickerRange = () => {
  return (
    <Calendar mode="range" numberOfMonths={2}>
      {(props) => (
        <Popover>
          <PopoverTrigger<typeof Button>
            as={(triggerProps) => (
              <Button
                variant="outline"
                class="min-w-56 justify-between font-normal"
                {...triggerProps}
              >
                <Show
                  when={props.value.from && props.value.to}
                  fallback="Selecione um período"
                >
                  {formatDate(props.value.from!)} – {formatDate(props.value.to!)}
                </Show>
                <svg xmlns="http://www.w3.org/2000/svg" class="size-4" viewBox="0 0 24 24">
                  <path
                    fill="none"
                    stroke="currentColor"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="m6 9 6 6 6-6"
                  />
                </svg>
              </Button>
            )}
          />
          <PopoverPortal>
            <PopoverContent class="w-auto overflow-hidden p-0">
              <div class="rounded-md p-3 shadow-sm">
                {/* Navegação única para os dois meses */}
                <div class="relative w-full">
                  <CalendarNav
                    action="prev-month"
                    class="absolute left-1"
                    aria-label="Mês anterior"
                  />
                  <CalendarNav
                    action="next-month"
                    class="absolute right-1"
                    aria-label="Próximo mês"
                  />
                </div>
                <div class="space-y-4 md:flex md:space-y-0 md:space-x-4">
                  <Index each={props.months}>
                    {(month, index) => (
                      <div class="flex flex-col gap-4">
                        <div class="flex h-7 items-center justify-center">
                          <CalendarLabel index={index}>
                            {formatMonth(month().month)}{" "}
                            {month().month.getFullYear()}
                          </CalendarLabel>
                        </div>
                        <CalendarTable index={index}>
                          <thead>
                            <tr class="flex">
                              <Index each={props.weekdays}>
                                {(weekday) => (
                                  <CalendarHeadCell abbr={formatWeekdayLong(weekday())}>
                                    {formatWeekdayShort(weekday())}
                                  </CalendarHeadCell>
                                )}
                              </Index>
                            </tr>
                          </thead>
                          <tbody>
                            <Index each={month().weeks}>
                              {(week) => (
                                <tr class="mt-2 flex w-full">
                                  <Index each={week()}>
                                    {(day) => (
                                      <CalendarCell>
                                        <CalendarCellTrigger
                                          day={day()}
                                          month={month().month}
                                        >
                                          {day().getDate()}
                                        </CalendarCellTrigger>
                                      </CalendarCell>
                                    )}
                                  </Index>
                                </tr>
                              )}
                            </Index>
                          </tbody>
                        </CalendarTable>
                      </div>
                    )}
                  </Index>
                </div>
              </div>
            </PopoverContent>
          </PopoverPortal>
        </Popover>
      )}
    </Calendar>
  )
}
```

---

## Exemplo 3 — Integração com TanStack Form

Campos de data em formulários (ex.: `due_date`, `paid_date`) armazenam o valor como **string ISO `YYYY-MM-DD`**.  
A conversão entre `Date` (Calendar) e `string` (form) deve ser feita manualmente dentro do `form.Field`.

```tsx
<form.Field name="due_date">
    {(field) => (
        <Calendar
            mode="single"
            // parseISODate interpreta YYYY-MM-DD como meia-noite LOCAL (não UTC).
            // new Date("YYYY-MM-DD") usa UTC, o que em UTC-3 resulta no dia anterior.
            value={field().state.value ? parseISODate(field().state.value) : undefined}
            onValueChange={(date) => {
                // Converte Date para string ISO e notifica o formulário
                field().handleChange(date ? date.toISOString().slice(0, 10) : "")
                field().handleBlur()
            }}
        >
            {(calProps) => (
                <Popover>
                    <PopoverTrigger<typeof Button>
                        as={(triggerProps) => (
                            <Button
                                variant="outline"
                                class="w-full justify-between font-normal"
                                aria-invalid={
                                    calProps /* acessa validationState via field */ &&
                                    field().state.meta.isTouched &&
                                    !field().state.meta.isValid
                                        ? true
                                        : undefined
                                }
                                {...triggerProps}
                            >
                                <Show when={field().state.value} fallback="Selecione uma data">
                                    {formatDate(field().state.value)}
                                </Show>
                                <svg xmlns="http://www.w3.org/2000/svg" class="size-4" viewBox="0 0 24 24">
                                    <path
                                        fill="none"
                                        stroke="currentColor"
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                        stroke-width="2"
                                        d="m6 9 6 6 6-6"
                                    />
                                </svg>
                            </Button>
                        )}
                    />
                    <PopoverPortal>
                        <PopoverContent class="w-auto overflow-hidden p-0">
                            <div class="rounded-md p-3 shadow-sm">
                                <div class="relative flex items-center justify-between mb-1">
                                    <CalendarNav action="prev-month" aria-label="Mês anterior"/>
                                    <CalendarLabel>
                                        {formatMonth(calProps.months[0].month)}{" "}
                                        {calProps.months[0].month.getFullYear()}
                                    </CalendarLabel>
                                    <CalendarNav action="next-month" aria-label="Próximo mês"/>
                                </div>
                                <CalendarTable>
                                    <thead>
                                    <tr class="flex">
                                        <Index each={calProps.weekdays}>
                                            {(weekday) => (
                                                <CalendarHeadCell abbr={formatWeekdayLong(weekday())}>
                                                    {formatWeekdayShort(weekday())}
                                                </CalendarHeadCell>
                                            )}
                                        </Index>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    <Index each={calProps.months[0].weeks}>
                                        {(week) => (
                                            <tr class="mt-2 flex w-full">
                                                <Index each={week()}>
                                                    {(day) => (
                                                        <CalendarCell>
                                                            <CalendarCellTrigger
                                                                day={day()}
                                                                month={calProps.months[0].month}
                                                            >
                                                                {day().getDate()}
                                                            </CalendarCellTrigger>
                                                        </CalendarCell>
                                                    )}
                                                </Index>
                                            </tr>
                                        )}
                                    </Index>
                                    </tbody>
                                </CalendarTable>
                            </div>
                        </PopoverContent>
                    </PopoverPortal>
                </Popover>
            )}
        </Calendar>
    )}
</form.Field>
```

### Schema Valibot correspondente

```ts
import * as v from "valibot"

// Campo obrigatório
due_date: v.pipe(v.string(), v.minLength(1, "Informe a data de vencimento."))

// Campo opcional
paid_date: v.string()
```

---

## Regras

### ✅ Faça

- Use **sempre** `<PopoverPortal>` para renderizar o conteúdo do popover fora do DOM do Dialog/Drawer e evitar problemas
  de `z-index` e overflow.
- Use **sempre** `formatDate` de `@/lib/format` para exibir a data no botão trigger (locale pt-BR, formato
  `dd/mm/aaaa`).
- Use **sempre** `parseISODate` de `@/lib/format` para converter a string `YYYY-MM-DD` em `Date` no prop `value` do
  `<Calendar>` — isso interpreta a data como meia-noite local, evitando o bug de deslocamento de fuso horário.
- Use os wrappers locais `@/components/ui/calendar` e `@/components/ui/popover`.
- Declare os formatadores `Intl.DateTimeFormat` **fora** do componente para não recriar instâncias a cada render.
- Forneça sempre `abbr={formatWeekdayLong(weekday())}` no `<CalendarHeadCell>` para acessibilidade.

### ❌ Não faça

- **Não** importe diretamente de `@corvu/calendar` ou `@kobalte/core/popover`.
- **Não** use `<input type="date">` nos formulários que exigem date picker visual — use a composição Calendar + Popover
  acima.
- **Não** use `new Date("YYYY-MM-DD")` para converter a string ISO em `Date` — strings no formato `YYYY-MM-DD` são
  interpretadas como **UTC meia-noite**, o que em fusos negativos (ex: UTC-3/Brasil) resulta no dia anterior. Use
  `parseISODate` de `@/lib/format`.
- **Não** omita `<CalendarLabel index={index}>` ao renderizar múltiplos meses (`mode="range"`) — o índice é necessário
  para associar corretamente o rótulo a cada grid de calendário.




