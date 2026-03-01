import {batch, createEffect, createSignal, For, Show} from "solid-js"
import {createForm} from "@tanstack/solid-form"
import {toast} from "somoto"
import * as v from "valibot"
import {Mail, MessageCircle, Plus, UserPlus, X} from "lucide-solid"

import {Badge} from "@/components/ui/badge"
import {Button} from "@/components/ui/button"
import DeleteAlertDialog from "@/components/notifications/delete-alert-dialog"
import {
  Checkbox,
  CheckboxControl,
  CheckboxInput,
  CheckboxLabel,
} from "@/components/ui/checkbox"
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
import {Separator} from "@/components/ui/separator"
import {
  TextField,
  TextFieldErrorMessage,
  TextFieldInput,
  TextFieldLabel,
} from "@/components/ui/text-field"
import type {AlertType, NotificationChannel, NotificationRule} from "@/lib/api"

// ── helpers ───────────────────────────────────────────────────────────────────

const alertTypeLabel = (t: string) => {
  switch (t) {
    case "low_balance":    return "Saldo Abaixo do Esperado"
    case "spending_limit": return "Limite de Gastos"
    default:               return t
  }
}

const ALERT_TYPES: AlertType[]          = ["low_balance", "spending_limit"]
const NOTIFICATION_CHANNELS: NotificationChannel[] = ["email", "whatsapp"]

// ── schema ────────────────────────────────────────────────────────────────────

const formSchema = v.object({
  alert_type: v.pipe(
    v.string(),
    v.minLength(1, "Selecione o tipo de alerta."),
  ),
  threshold: v.pipe(
    v.string(),
    v.minLength(1, "Informe o valor limite."),
    v.check(
      (val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0,
      "O valor limite deve ser maior que zero.",
    ),
  ),
  channels: v.pipe(
    v.array(v.string()),
    v.minLength(1, "Selecione pelo menos um canal de disparo."),
  ),
  recipients: v.pipe(
    v.array(
      v.object({
        name:    v.pipe(v.string(), v.minLength(1, "Nome é obrigatório.")),
        contact: v.pipe(v.string(), v.minLength(1, "Contato é obrigatório.")),
      }),
    ),
    v.minLength(1, "Adicione pelo menos um destinatário."),
  ),
})

type formSchemaType = v.InferInput<typeof formSchema>

// ── public types ──────────────────────────────────────────────────────────────

export type RuleSaveData = {
  alert_type: AlertType
  threshold:  number
  channels:   NotificationChannel[]
  recipients: {name: string; contact: string}[]
}

export interface CreateEditAlertDialogProps {
  rule?:     NotificationRule
  onSave:    (data: RuleSaveData) => void
  onDelete?: () => void
}

// ── component ─────────────────────────────────────────────────────────────────

const CreateEditAlertDialog = (props: CreateEditAlertDialogProps) => {
  const [open, setOpen]           = createSignal(false)
  const [newName, setNewName]     = createSignal("")
  const [newContact, setNewContact] = createSignal("")

  const isEditing = () => props.rule != null

  const getDefaultValues = (): formSchemaType => ({
    alert_type: props.rule?.alert_type ?? "",
    threshold:  props.rule ? String(props.rule.threshold) : "",
    channels:   (props.rule?.channels ?? []) as string[],
    recipients: props.rule?.recipients.map((r) => ({name: r.name, contact: r.contact})) ?? [],
  })

  const form = createForm(() => ({
    defaultValues: getDefaultValues(),
    validators: {
      onSubmit: formSchema,
    },
    onSubmit: ({value}) => {
      props.onSave({
        alert_type: value.alert_type as AlertType,
        threshold:  parseFloat(value.threshold),
        channels:   value.channels as NotificationChannel[],
        recipients: value.recipients,
      })
      toast.success(isEditing() ? "Regra atualizada com sucesso!" : "Regra criada com sucesso!")
      setOpen(false)
    },
  }))

  // Reset form and temp inputs every time the dialog opens
  createEffect(() => {
    if (open()) {
      form.reset(getDefaultValues())
      batch(() => {
        setNewName("")
        setNewContact("")
      })
    }
  })

  const handleAddRecipient = (pushValue: (v: {name: string; contact: string}) => void) => {
    const name    = newName().trim()
    const contact = newContact().trim()
    if (!name || !contact) return
    pushValue({name, contact})
    batch(() => {
      setNewName("")
      setNewContact("")
    })
  }

  return (
    <Dialog open={open()} onOpenChange={setOpen}>
      <DialogTrigger<typeof Button>
        as={(triggerProps) => (
          <Button
            variant={isEditing() ? "outline" : "default"}
            size={isEditing() ? "sm" : "default"}
            {...triggerProps}
          >
            <Show when={!isEditing()}>
              <Plus class="size-4"/>
            </Show>
            {isEditing() ? "Editar" : "Nova Regra"}
          </Button>
        )}
      />
      <DialogPortal>
        <DialogContent class="sm:max-w-[580px]">
          <DialogHeader>
            <DialogTitle>
              {isEditing() ? "Editar Regra" : "Nova Regra de Notificação"}
            </DialogTitle>
            <DialogDescription>
              Configure alertas para saldo abaixo do esperado ou limite de gastos.
            </DialogDescription>
          </DialogHeader>

          <form
            id="form-alert-rule"
            onSubmit={(e) => {
              e.preventDefault()
              void form.handleSubmit()
            }}
            class="grid gap-5 py-2"
          >
            {/* Tipo de Alerta */}
            <form.Field name="alert_type">
              {(field) => (
                <TextField
                  validationState={
                    field().state.meta.isTouched && !field().state.meta.isValid
                      ? "invalid"
                      : "valid"
                  }
                >
                  <TextFieldLabel>Tipo de Alerta</TextFieldLabel>
                  <Select<string>
                    value={field().state.value}
                    onChange={(v) => {
                      if (v != null) {
                        field().handleChange(v)
                        field().handleBlur()
                      }
                    }}
                    options={ALERT_TYPES}
                    itemComponent={(p) => (
                      <SelectItem item={p.item}>
                        {alertTypeLabel(p.item.rawValue)}
                      </SelectItem>
                    )}
                  >
                    <SelectTrigger class="w-full">
                      <SelectValue<string>>
                        {(state) => alertTypeLabel(state.selectedOption())}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent/>
                  </Select>
                  <TextFieldErrorMessage errors={field().state.meta.errors}/>
                </TextField>
              )}
            </form.Field>

            {/* Valor Limite */}
            <form.Field name="threshold">
              {(field) => (
                <TextField
                  validationState={
                    field().state.meta.isTouched && !field().state.meta.isValid
                      ? "invalid"
                      : "valid"
                  }
                  name={field().name}
                  value={field().state.value}
                  onBlur={field().handleBlur}
                  onChange={field().handleChange}
                >
                  <TextFieldLabel>Valor Limite (R$)</TextFieldLabel>
                  <TextFieldInput type="number" step="0.01" min="0" placeholder="0,00"/>
                  <TextFieldErrorMessage errors={field().state.meta.errors}/>
                </TextField>
              )}
            </form.Field>

            {/* Canais de Disparo */}
            <form.Field name="channels">
              {(field) => (
                <TextField
                  validationState={
                    field().state.meta.isTouched && !field().state.meta.isValid
                      ? "invalid"
                      : "valid"
                  }
                >
                  <TextFieldLabel>Canais de Disparo</TextFieldLabel>
                  <div class="flex gap-4">
                    <For each={NOTIFICATION_CHANNELS}>
                      {(channel) => (
                        <Checkbox
                          validationState={
                            field().state.meta.isTouched && !field().state.meta.isValid
                              ? "invalid"
                              : "valid"
                          }
                          name={field().name}
                          checked={field().state.value.includes(channel)}
                          onChange={(checked) => {
                            if (checked) {
                              field().pushValue(channel)
                            } else {
                              const index = field().state.value.indexOf(channel)
                              if (index > -1) field().removeValue(index)
                            }
                          }}
                          class="flex items-center gap-2"
                        >
                          <CheckboxInput/>
                          <CheckboxControl/>
                          <CheckboxLabel class="flex items-center gap-1.5">
                            {channel === "email"
                              ? <Mail class="size-4"/>
                              : <MessageCircle class="size-4"/>
                            }
                            {channel === "email" ? "E-mail" : "WhatsApp"}
                          </CheckboxLabel>
                        </Checkbox>
                      )}
                    </For>
                  </div>
                  <TextFieldErrorMessage errors={field().state.meta.errors}/>
                </TextField>
              )}
            </form.Field>

            <Separator/>

            {/* Destinatários */}
            <form.Field name="recipients">
              {(field) => (
                <TextField
                  validationState={
                    field().state.meta.isTouched && !field().state.meta.isValid
                      ? "invalid"
                      : "valid"
                  }
                >
                  <TextFieldLabel>Destinatários</TextFieldLabel>

                  <Show when={field().state.value.length > 0}>
                    <div class="flex flex-wrap gap-1.5">
                      <For each={field().state.value}>
                        {(r, i) => (
                          <Badge variant="secondary" class="gap-1 pr-1">
                            {r.name} ({r.contact})
                            <button
                              type="button"
                              class="ml-0.5 rounded-full p-0.5 hover:bg-muted-foreground/20"
                              onClick={() => field().removeValue(i())}
                            >
                              <X class="size-3"/>
                            </button>
                          </Badge>
                        )}
                      </For>
                    </div>
                  </Show>

                  <div class="flex items-end gap-2">
                    <TextField class="flex-1" value={newName()} onChange={setNewName}>
                      <TextFieldLabel class="text-xs">Nome</TextFieldLabel>
                      <TextFieldInput placeholder="Nome"/>
                    </TextField>
                    <TextField class="flex-1" value={newContact()} onChange={setNewContact}>
                      <TextFieldLabel class="text-xs">Contato</TextFieldLabel>
                      <TextFieldInput placeholder="Email ou telefone"/>
                    </TextField>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => handleAddRecipient(field().pushValue)}
                    >
                      <UserPlus class="size-4"/>
                    </Button>
                  </div>

                  <TextFieldErrorMessage errors={field().state.meta.errors}/>
                </TextField>
              )}
            </form.Field>
          </form>

          <DialogFooter>
            <Show when={isEditing() && props.onDelete != null}>
              <DeleteAlertDialog
                onDelete={() => {
                  props.onDelete?.()
                  setOpen(false)
                }}
              />
            </Show>
            <div class="flex-1"/>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" form="form-alert-rule">
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </DialogPortal>
    </Dialog>
  )
}

export default CreateEditAlertDialog
