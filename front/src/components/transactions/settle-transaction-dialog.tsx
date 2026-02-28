import {createSignal} from "solid-js"
import {CheckCheck} from "lucide-solid"
import {toast} from "somoto"

import {Button} from "@/components/ui/button"
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
  TextField,
  TextFieldInput,
  TextFieldLabel,
} from "@/components/ui/text-field"

export interface SettleTransactionDialogProps {
  onSettle: (paid_date: string) => Promise<void>
}

const SettleTransactionDialog = (props: SettleTransactionDialogProps) => {
  const [open, setOpen]         = createSignal(false)
  const [settling, setSettling] = createSignal(false)
  const [paidDate, setPaidDate] = createSignal(todayStr())

  function todayStr() {
    return new Date().toISOString().slice(0, 10)
  }

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
        if (v) setPaidDate(todayStr())
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

          <TextField value={paidDate()} onChange={setPaidDate}>
            <TextFieldLabel>Data do Pagamento</TextFieldLabel>
            <TextFieldInput type="date"/>
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

