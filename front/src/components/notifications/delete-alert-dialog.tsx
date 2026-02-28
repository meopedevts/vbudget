import {createSignal} from "solid-js"
import {Trash2} from "lucide-solid"

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

export interface DeleteAlertDialogProps {
  onDelete: () => void
}

const DeleteAlertDialog = (props: DeleteAlertDialogProps) => {
  const [open, setOpen] = createSignal(false)

  return (
    <Dialog open={open()} onOpenChange={setOpen}>
      <DialogTrigger<typeof Button>
        as={(triggerProps) => (
          <Button variant="ghost" size="icon-sm" {...triggerProps}>
            <Trash2 class="size-3.5 text-destructive"/>
          </Button>
        )}
      />
      <DialogPortal>
        <DialogContent class="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir esta regra de notificação? Esta ação não
              pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                props.onDelete()
                setOpen(false)
              }}
            >
              <Trash2 class="size-4"/>
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </DialogPortal>
    </Dialog>
  )
}

export default DeleteAlertDialog

