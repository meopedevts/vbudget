import {createSignal} from "solid-js"
import {Trash2} from "lucide-solid"
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

export interface DeleteTransactionDialogProps {
  onDelete: () => Promise<void>
}

const DeleteTransactionDialog = (props: DeleteTransactionDialogProps) => {
  const [open, setOpen]       = createSignal(false)
  const [deleting, setDeleting] = createSignal(false)

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await props.onDelete()
      setOpen(false)
    } catch (e) {
      console.error(e)
      toast.error("Erro ao excluir lançamento.")
    } finally {
      setDeleting(false)
    }
  }

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
              Tem certeza que deseja excluir este lançamento? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={deleting()}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting()}>
              <Trash2 class="size-4"/>
              {deleting() ? "Excluindo..." : "Excluir"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </DialogPortal>
    </Dialog>
  )
}

export default DeleteTransactionDialog

