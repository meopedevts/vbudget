import {createResource, createSignal, For, Show} from "solid-js"
import {createForm} from "@tanstack/solid-form"
import {toast} from "somoto"
import * as v from "valibot"
import {Pencil, Plus, Trash2} from "lucide-solid"

import {Badge} from "@/components/ui/badge"
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  TextField,
  TextFieldErrorMessage,
  TextFieldInput,
  TextFieldLabel,
} from "@/components/ui/text-field"
import {categoriesService} from "@/lib/api"
import type {Category, CategoryKind} from "@/lib/api"

// ── helpers ───────────────────────────────────────────────────────────────────

const kindLabel   = (k: string) => k === "income" ? "Receita" : "Despesa"
const KIND_OPTIONS: CategoryKind[] = ["income", "expense"]

const KIND_COLORS: Record<string, string> = {
  "#22c55e": "Verde",
  "#3b82f6": "Azul",
  "#f59e0b": "Amarelo",
  "#ef4444": "Vermelho",
  "#8b5cf6": "Roxo",
  "#ec4899": "Rosa",
  "#14b8a6": "Teal",
  "#f97316": "Laranja",
  "#6b7280": "Cinza",
}
const COLOR_OPTIONS = Object.keys(KIND_COLORS)

// ── schema ────────────────────────────────────────────────────────────────────

const formSchema = v.object({
  name:  v.pipe(v.string(), v.minLength(1, "Nome é obrigatório."), v.maxLength(40, "Máximo 40 caracteres.")),
  kind:  v.pipe(v.string(), v.minLength(1, "Selecione o tipo.")),
  color: v.pipe(v.string(), v.minLength(1, "Selecione a cor.")),
})

type FormSchema = v.InferInput<typeof formSchema>

// ── inner form dialog (create / edit) ────────────────────────────────────────

interface CategoryFormDialogProps {
  category?: Category
  onSave: (data: {name: string; kind: CategoryKind; color: string}) => Promise<void>
}

const CategoryFormDialog = (props: CategoryFormDialogProps) => {
  const [open, setOpen]     = createSignal(false)
  const [saving, setSaving] = createSignal(false)

  const isEditing = () => props.category != null

  const getDefaults = (): FormSchema => ({
    name:  props.category?.name  ?? "",
    kind:  props.category?.kind  ?? "expense",
    color: props.category?.color ?? COLOR_OPTIONS[0],
  })

  const form = createForm(() => ({
    defaultValues: getDefaults(),
    validators: {onSubmit: formSchema},
    onSubmit: async ({value}) => {
      setSaving(true)
      try {
        await props.onSave({name: value.name, kind: value.kind as CategoryKind, color: value.color})
        setOpen(false)
      } catch {
        toast.error("Erro ao salvar categoria.")
      } finally {
        setSaving(false)
      }
    },
  }))

  const vs = (field: () => {state: {meta: {isTouched: boolean; isValid: boolean}}}) =>
    field().state.meta.isTouched && !field().state.meta.isValid ? "invalid" : "valid"

  return (
    <Dialog open={open()} onOpenChange={(v) => { if (v) form.reset(getDefaults()); setOpen(v) }}>
      <DialogTrigger<typeof Button>
        as={(triggerProps) => (
          <Button
            variant={isEditing() ? "ghost" : "default"}
            size={isEditing() ? "icon-sm" : "sm"}
            {...triggerProps}
          >
            <Show when={isEditing()} fallback={<><Plus class="size-3.5"/>Nova Categoria</>}>
              <Pencil class="size-3.5"/>
            </Show>
          </Button>
        )}
      />
      <DialogPortal>
        <DialogContent class="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{isEditing() ? "Editar Categoria" : "Nova Categoria"}</DialogTitle>
            <DialogDescription>
              Categorias organizam seus lançamentos por tipo e cor.
            </DialogDescription>
          </DialogHeader>

          <form
            id="form-category"
            onSubmit={(e) => { e.preventDefault(); void form.handleSubmit() }}
            class="grid gap-4 py-2"
          >
            <form.Field name="name">
              {(field) => (
                <TextField
                  validationState={vs(field)}
                  name={field().name}
                  value={field().state.value}
                  onBlur={field().handleBlur}
                  onChange={field().handleChange}
                >
                  <TextFieldLabel>Nome</TextFieldLabel>
                  <TextFieldInput placeholder="Ex: Alimentação, Salário..."/>
                  <TextFieldErrorMessage errors={field().state.meta.errors}/>
                </TextField>
              )}
            </form.Field>

            <div class="grid grid-cols-2 gap-4">
              <form.Field name="kind">
                {(field) => (
                  <TextField validationState={vs(field)}>
                    <TextFieldLabel>Tipo</TextFieldLabel>
                    <Select<string>
                      value={field().state.value}
                      onChange={(v) => { if (v != null) { field().handleChange(v); field().handleBlur() } }}
                      options={KIND_OPTIONS}
                      itemComponent={(p) => (
                        <SelectItem item={p.item}>{kindLabel(p.item.rawValue)}</SelectItem>
                      )}
                    >
                      <SelectTrigger class="w-full">
                        <SelectValue<string>>
                          {(state) => kindLabel(state.selectedOption())}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent/>
                    </Select>
                    <TextFieldErrorMessage errors={field().state.meta.errors}/>
                  </TextField>
                )}
              </form.Field>

              <form.Field name="color">
                {(field) => (
                  <TextField validationState={vs(field)}>
                    <TextFieldLabel>Cor</TextFieldLabel>
                    <Select<string>
                      value={field().state.value}
                      onChange={(v) => { if (v != null) { field().handleChange(v); field().handleBlur() } }}
                      options={COLOR_OPTIONS}
                      itemComponent={(p) => (
                        <SelectItem item={p.item}>
                          <div class="flex items-center gap-2">
                            <div class="size-3 rounded-full shrink-0" style={{background: p.item.rawValue}}/>
                            {KIND_COLORS[p.item.rawValue]}
                          </div>
                        </SelectItem>
                      )}
                    >
                      <SelectTrigger class="w-full">
                        <SelectValue<string>>
                          {(state) => (
                            <div class="flex items-center gap-2">
                              <div class="size-3 rounded-full shrink-0" style={{background: state.selectedOption()}}/>
                              {KIND_COLORS[state.selectedOption()]}
                            </div>
                          )}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent/>
                    </Select>
                    <TextFieldErrorMessage errors={field().state.meta.errors}/>
                  </TextField>
                )}
              </form.Field>
            </div>
          </form>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button type="submit" form="form-category" disabled={saving()}>
              {saving() ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </DialogPortal>
    </Dialog>
  )
}

// ── delete confirm ────────────────────────────────────────────────────────────

interface DeleteCategoryDialogProps {
  onDelete: () => Promise<void>
}

const DeleteCategoryDialog = (props: DeleteCategoryDialogProps) => {
  const [open, setOpen]         = createSignal(false)
  const [deleting, setDeleting] = createSignal(false)

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await props.onDelete()
      setOpen(false)
    } catch {
      toast.error("Erro ao excluir categoria.")
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
        <DialogContent class="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Excluir Categoria</DialogTitle>
            <DialogDescription>
              Tem certeza? Categorias vinculadas a lançamentos não poderão ser removidas.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={deleting()}>Cancelar</Button>
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

// ── main categories dialog ────────────────────────────────────────────────────

export const CategoriesDialog = () => {
  const [open, setOpen] = createSignal(false)

  const [categories, {refetch}] = createResource(
    open,
    (isOpen) => isOpen
      ? categoriesService.list().catch(() => [] as Category[])
      : Promise.resolve([] as Category[]),
  )

  const handleSave = async (id: number | undefined, data: {name: string; kind: CategoryKind; color: string}) => {
    if (id != null) {
      await categoriesService.update(id, data)
      toast.success("Categoria atualizada!")
    } else {
      await categoriesService.create(data)
      toast.success("Categoria criada!")
    }
    refetch()
  }

  const handleDelete = async (id: number) => {
    await categoriesService.delete(id)
    toast.success("Categoria excluída!")
    refetch()
  }

  return (
    <Dialog open={open()} onOpenChange={setOpen}>
      <DialogTrigger<typeof Button>
        as={(triggerProps) => (
          <Button variant="outline" size="sm" {...triggerProps}>
            Gerenciar
          </Button>
        )}
      />
      <DialogPortal>
        <DialogContent class="sm:max-w-xl">
          <DialogHeader>
            <div class="flex items-center justify-between pr-6">
              <div class="grid gap-1">
                <DialogTitle>Categorias</DialogTitle>
                <DialogDescription>
                  Categorias organizam seus lançamentos por tipo e cor.
                </DialogDescription>
              </div>
              <CategoryFormDialog onSave={(data) => handleSave(undefined, data)}/>
            </div>
          </DialogHeader>

          <Show
            when={!categories.loading}
            fallback={<p class="py-8 text-center text-sm text-muted-foreground">Carregando...</p>}
          >
            <Show
              when={(categories() ?? []).length > 0}
              fallback={
                <p class="py-8 text-center text-sm text-muted-foreground">
                  Nenhuma categoria cadastrada.
                </p>
              }
            >
              <div class="max-h-[55vh] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Cor</TableHead>
                      <TableHead class="w-[72px]"/>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <For each={categories()}>
                      {(cat) => (
                        <TableRow>
                          <TableCell class="font-medium">{cat.name}</TableCell>
                          <TableCell>
                            <Badge
                              variant={cat.kind === "income" ? "default" : "secondary"}
                              class={cat.kind === "income" ? "text-emerald-600 border-emerald-200 bg-emerald-50" : "text-red-600 border-red-200 bg-red-50"}
                            >
                              {kindLabel(cat.kind)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div class="flex items-center gap-2">
                              <div
                                class="size-3 rounded-full shrink-0"
                                style={{background: cat.color || "#6b7280"}}
                              />
                              <span class="text-sm text-muted-foreground">
                                {KIND_COLORS[cat.color] ?? cat.color}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div class="flex items-center gap-1 justify-end">
                              <CategoryFormDialog
                                category={cat}
                                onSave={(data) => handleSave(cat.id, data)}
                              />
                              <DeleteCategoryDialog onDelete={() => handleDelete(cat.id)}/>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </For>
                  </TableBody>
                </Table>
              </div>
            </Show>
          </Show>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </DialogPortal>
    </Dialog>
  )
}
