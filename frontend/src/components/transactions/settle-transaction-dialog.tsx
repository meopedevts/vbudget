import {createSignal, Index, Show} from "solid-js"
import {CheckCheck} from "lucide-solid"
import {toast} from "somoto"

import {Button} from "@/components/ui/button"
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Popover,
  PopoverContent,
  PopoverPortal,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  TextField,
  TextFieldLabel,
} from "@/components/ui/text-field"
import {dateToISOLocal, formatDate, parseISODate, todayISODate} from "@/lib/format"

// ── helpers ───────────────────────────────────────────────────────────────────

// (todayISODate is imported from @/lib/format)

// ── date formatters ───────────────────────────────────────────────────────────

const {format: formatWeekdayLong}  = new Intl.DateTimeFormat("pt-BR", {weekday: "long"})
const {format: formatWeekdayShort} = new Intl.DateTimeFormat("pt-BR", {weekday: "short"})
const {format: formatMonth}        = new Intl.DateTimeFormat("pt-BR", {month: "long"})

// ── types ─────────────────────────────────────────────────────────────────────

export interface SettleTransactionDialogProps {
  onSettle: (paid_date: string) => Promise<void>
}

// ── component ─────────────────────────────────────────────────────────────────

const SettleTransactionDialog = (props: SettleTransactionDialogProps) => {
  const [open, setOpen]         = createSignal(false)
  const [settling, setSettling] = createSignal(false)
  const [paidDate, setPaidDate] = createSignal(todayISODate())

  const handleSettle = async () => {
    setSettling(true)
    try {
      await props.onSettle(paidDate())
      setOpen(false)
    } catch (e) {
      console.error(e)
      toast.error("Erro ao baixar lançamento.")
    } finally {
      setSettling(false)
    }
  }

  return (
    <Dialog
      open={open()}
      onOpenChange={(v) => {
        if (v) setPaidDate(todayISODate())
        setOpen(v)
      }}
    >
      <DialogTrigger<typeof Button>
        as={(triggerProps) => (
          <Button variant="outline" size="sm" class="gap-1" {...triggerProps}>
            <CheckCheck class="size-3.5"/>
            Baixar
          </Button>
        )}
      />
      <DialogPortal>
        <DialogContent class="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Baixar Lançamento</DialogTitle>
            <DialogDescription>
              Confirme a data de pagamento para liquidar este lançamento. A data padrão é hoje.
            </DialogDescription>
          </DialogHeader>

          <TextField>
            <TextFieldLabel>Data do Pagamento</TextFieldLabel>
            <Calendar
              mode="single"
              value={paidDate() ? parseISODate(paidDate()) : undefined}
              onValueChange={(date) => setPaidDate(date ? dateToISOLocal(date) : todayISODate())}
            >
              {(calProps) => (
                <Popover>
                  <PopoverTrigger<typeof Button>
                    as={(triggerProps) => (
                      <Button
                        variant="outline"
                        class="w-full justify-between font-normal"
                        {...triggerProps}
                      >
                        <Show when={paidDate()} fallback="Selecione uma data">
                          {formatDate(paidDate())}
                        </Show>
                        <svg xmlns="http://www.w3.org/2000/svg" class="size-4" viewBox="0 0 24 24">
                          <path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m6 9 6 6 6-6"/>
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
                                        <CalendarCellTrigger day={day()} month={calProps.months[0].month}>
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
          </TextField>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={settling()}
            >
              Cancelar
            </Button>
            <Button onClick={handleSettle} disabled={settling() || !paidDate()}>
              <CheckCheck class="size-4"/>
              {settling() ? "Baixando..." : "Confirmar Baixa"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </DialogPortal>
    </Dialog>
  )
}

export default SettleTransactionDialog

