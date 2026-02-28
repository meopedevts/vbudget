import {createEffect, createSignal, Show} from "solid-js"
import {createForm} from "@tanstack/solid-form"
import {toast} from "somoto"
import * as v from "valibot"
import {Pencil, Plus} from "lucide-solid"

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
  TextField,
  TextFieldErrorMessage,
  TextFieldInput,
  TextFieldLabel,
} from "@/components/ui/text-field"
import DeleteTransactionDialog from "@/components/transactions/delete-transaction-dialog"
import type {
  Category,
  Transaction,
  TransactionKind,
  TransactionPayload,
  TransactionStatus,
} from "@/lib/api"

// ── helpers ───────────────────────────────────────────────────────────────────

const kindLabel   = (k: string) => k === "income" ? "Receita" : "Despesa"
const statusLabel = (s: string) => s === "paid" ? "Baixado" : "Pendente"
const todayStr    = ()          => new Date().toISOString().slice(0, 10)

// ── options ───────────────────────────────────────────────────────────────────

const KIND_OPTIONS:   TransactionKind[]   = ["income", "expense"]
const STATUS_OPTIONS: TransactionStatus[] = ["pending", "paid"]

// ── schema ────────────────────────────────────────────────────────────────────

const formSchema = v.object({
  description: v.pipe(
    v.string(),
    v.minLength(1, "Descrição é obrigatória."),
    v.maxLength(100, "Descrição deve ter no máximo 100 caracteres."),
  ),
  amount: v.pipe(
    v.string(),
    v.minLength(1, "Informe o valor."),
    v.check(
      (val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0,
      "O valor deve ser maior que zero.",
    ),
  ),
  kind:        v.pipe(v.string(), v.minLength(1, "Selecione o tipo.")),
  status:      v.pipe(v.string(), v.minLength(1, "Selecione o status.")),
  category_id: v.pipe(v.string(), v.minLength(1, "Selecione uma categoria.")),
  due_date:    v.pipe(v.string(), v.minLength(1, "Informe a data de vencimento.")),
  paid_date:   v.string(),
})

type formSchemaType = v.InferInput<typeof formSchema>

// ── public types ──────────────────────────────────────────────────────────────

export interface CreateEditTransactionDialogProps {
  transaction?: Transaction
  categories:   Category[]
  onSave:       (data: TransactionPayload) => Promise<void>
  onDelete?:    () => Promise<void>
}

// ── component ─────────────────────────────────────────────────────────────────

const CreateEditTransactionDialog = (props: CreateEditTransactionDialogProps) => {
  const [open, setOpen]     = createSignal(false)
  const [saving, setSaving] = createSignal(false)

  const isEditing = () => props.transaction != null

  const getDefaultValues = (): formSchemaType => ({
    description: props.transaction?.description ?? "",
    amount:      props.transaction ? String(props.transaction.amount) : "",
    kind:        props.transaction?.kind   ?? "expense",
    status:      props.transaction?.status ?? "pending",
    category_id: props.transaction ? String(props.transaction.category_id) : "",
    due_date:    props.transaction?.due_date ?? todayStr(),
    paid_date:   props.transaction?.paid_date ?? "",
  })

  const form = createForm(() => ({
    defaultValues: getDefaultValues(),
    validators: {onSubmit: formSchema},
    onSubmit: async ({value}) => {
      setSaving(true)
      try {
        await props.onSave({
          description: value.description,
          amount:      parseFloat(value.amount),
          kind:        value.kind   as TransactionKind,
          status:      value.status as TransactionStatus,
          category_id: parseInt(value.category_id),
          due_date:    value.due_date,
          paid_date:   value.paid_date || "",
        })
        toast.success(isEditing() ? "Lançamento atualizado!" : "Lançamento criado!")
        setOpen(false)
      } catch (e) {
        console.error(e)
        toast.error("Erro ao salvar lançamento.")
      } finally {
        setSaving(false)
      }
    },
  }))

  createEffect(() => {
    if (open()) form.reset(getDefaultValues())
  })

  // shorthand for validationState
  const vs = (field: () => {state: {meta: {isTouched: boolean; isValid: boolean}}}) =>
    field().state.meta.isTouched && !field().state.meta.isValid ? "invalid" : "valid"

  // resolve Category object from string id stored in the field
  const selectedCategory = (id: string) =>
    props.categories.find((c) => c.id === parseInt(id)) ?? null

  return (
    <Dialog open={open()} onOpenChange={setOpen}>
      <DialogTrigger<typeof Button>
        as={(triggerProps) => (
          <Button
            variant={isEditing() ? "ghost" : "default"}
            size={isEditing() ? "icon-sm" : "default"}
            {...triggerProps}
          >
            <Show when={isEditing()} fallback={<><Plus class="size-4"/>Novo Lançamento</>}>
              <Pencil class="size-3.5"/>
            </Show>
          </Button>
        )}
      />
      <DialogPortal>
        <DialogContent class="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {isEditing() ? "Editar Lançamento" : "Novo Lançamento"}
            </DialogTitle>
            <DialogDescription>
              Lançamentos pendentes aguardam baixa. Ao liquidar, informe a data de pagamento.
            </DialogDescription>
          </DialogHeader>

          <form
            id="form-transaction"
            onSubmit={(e) => {
              e.preventDefault()
              void form.handleSubmit()
            }}
            class="grid gap-4 py-2"
          >
            {/* Descrição */}
            <form.Field name="description">
              {(field) => (
                <TextField
                  validationState={vs(field)}
                  name={field().name}
                  value={field().state.value}
                  onBlur={field().handleBlur}
                  onChange={field().handleChange}
                >
                  <TextFieldLabel>Descrição</TextFieldLabel>
                  <TextFieldInput placeholder="Ex: Salário, Aluguel, Supermercado..."/>
                  <TextFieldErrorMessage errors={field().state.meta.errors}/>
                </TextField>
              )}
            </form.Field>

            {/* Valor + Vencimento */}
            <div class="grid grid-cols-2 gap-4">
              <form.Field name="amount">
                {(field) => (
                  <TextField
                    validationState={vs(field)}
                    name={field().name}
                    value={field().state.value}
                    onBlur={field().handleBlur}
                    onChange={field().handleChange}
                  >
                    <TextFieldLabel>Valor (R$)</TextFieldLabel>
                    <TextFieldInput type="number" step="0.01" min="0" placeholder="0,00"/>
                    <TextFieldErrorMessage errors={field().state.meta.errors}/>
                  </TextField>
                )}
              </form.Field>

              <form.Field name="due_date">
                {(field) => (
                  <TextField
                    validationState={vs(field)}
                    name={field().name}
                    value={field().state.value}
                    onBlur={field().handleBlur}
                    onChange={field().handleChange}
                  >
                    <TextFieldLabel>Vencimento</TextFieldLabel>
                    <TextFieldInput type="date"/>
                    <TextFieldErrorMessage errors={field().state.meta.errors}/>
                  </TextField>
                )}
              </form.Field>
            </div>

            {/* Tipo + Categoria — nested so category options filter reactively by kind */}
            <form.Field name="kind">
              {(kindField) => (
                <div class="grid grid-cols-2 gap-4">
                  <TextField validationState={vs(kindField)}>
                    <TextFieldLabel>Tipo</TextFieldLabel>
                    <Select<string>
                      value={kindField().state.value}
                      onChange={(v) => {
                        if (v != null) {
                          kindField().handleChange(v)
                          kindField().handleBlur()
                          // Reset category when kind changes — old value may not match
                          form.setFieldValue("category_id", "")
                        }
                      }}
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
                    <TextFieldErrorMessage errors={kindField().state.meta.errors}/>
                  </TextField>

                  {/*
                    Category: nested inside kind so that filtering by kind is reactive.
                    `optionValue="id"` lets Kobalte compare by id (number) instead of
                    object reference — works correctly when categories load asynchronously.
                  */}
                  <form.Field name="category_id">
                    {(field) => (
                      <TextField validationState={vs(field)}>
                        <TextFieldLabel>Categoria</TextFieldLabel>
                        <Select<Category>
                          value={selectedCategory(field().state.value)}
                          onChange={(cat) => {
                            if (cat != null) {
                              field().handleChange(String(cat.id))
                              field().handleBlur()
                            }
                          }}
                          options={props.categories.filter(
                            (c) => !kindField().state.value || c.kind === kindField().state.value,
                          )}
                          optionValue="id"
                          optionTextValue="name"
                          itemComponent={(p) => (
                            <SelectItem item={p.item}>
                              {(p.item.rawValue as Category).name}
                            </SelectItem>
                          )}
                        >
                          <SelectTrigger class="w-full">
                            <SelectValue<Category>>
                              {(state) => state.selectedOption()?.name}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent/>
                        </Select>
                        <TextFieldErrorMessage errors={field().state.meta.errors}/>
                      </TextField>
                    )}
                  </form.Field>
                </div>
              )}
            </form.Field>

            {/*
              Status + paid_date (conditional).
              paid_date is nested inside the status field's render callback so that
              `statusField().state.value` is a reactive accessor — <Show> responds
              immediately when the user changes the status Select.
            */}
            <form.Field name="status">
              {(statusField) => (
                <div class="grid grid-cols-2 gap-4 items-start">
                  <TextField validationState={vs(statusField)}>
                    <TextFieldLabel>Status</TextFieldLabel>
                    <Select<string>
                      value={statusField().state.value}
                      onChange={(v) => {
                        if (v != null) {
                          statusField().handleChange(v)
                          statusField().handleBlur()
                          // auto-fill paid_date with today when marking as paid
                          form.setFieldValue("paid_date", v === "paid" ? todayStr() : "")
                        }
                      }}
                      options={STATUS_OPTIONS}
                      itemComponent={(p) => (
                        <SelectItem item={p.item}>{statusLabel(p.item.rawValue)}</SelectItem>
                      )}
                    >
                      <SelectTrigger class="w-full">
                        <SelectValue<string>>
                          {(state) => statusLabel(state.selectedOption())}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent/>
                    </Select>
                    <TextFieldErrorMessage errors={statusField().state.meta.errors}/>
                  </TextField>

                  <Show when={statusField().state.value === "paid"}>
                    <form.Field name="paid_date">
                      {(field) => (
                        <TextField
                          name={field().name}
                          value={field().state.value}
                          onBlur={field().handleBlur}
                          onChange={field().handleChange}
                        >
                          <TextFieldLabel>Data do Pagamento</TextFieldLabel>
                          <TextFieldInput type="date"/>
                        </TextField>
                      )}
                    </form.Field>
                  </Show>
                </div>
              )}
            </form.Field>
          </form>

          <DialogFooter>
            <Show when={isEditing() && props.onDelete != null}>
              <DeleteTransactionDialog
                onDelete={async () => {
                  await props.onDelete?.()
                  setOpen(false)
                }}
              />
            </Show>
            <div class="flex-1"/>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" form="form-transaction" disabled={saving()}>
              {saving() ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </DialogPortal>
    </Dialog>
  )
}

export default CreateEditTransactionDialog

