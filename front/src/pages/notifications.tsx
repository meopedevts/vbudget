import {createSignal, For, Show} from "solid-js"
import {Bell, Mail, MessageCircle} from "lucide-solid"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {Badge} from "@/components/ui/badge"
import {Button} from "@/components/ui/button"
import {Separator} from "@/components/ui/separator"
import {formatCurrency} from "@/lib/format"
import type {AlertType, NotificationChannel, NotificationRule} from "@/lib/api"
import CreateEditAlertDialog, {type RuleSaveData} from "@/components/notifications/create-edit-alert-dialog"
import DeleteAlertDialog from "@/components/notifications/delete-alert-dialog"

// ── helpers ───────────────────────────────────────────────────────────────────

const alertTypeLabel = (t: AlertType) => {
  switch (t) {
    case "low_balance":    return "Saldo Abaixo do Esperado"
    case "spending_limit": return "Limite de Gastos"
    default:               return t
  }
}

const channelLabel = (c: NotificationChannel) => {
  switch (c) {
    case "email":    return "E-mail"
    case "whatsapp": return "WhatsApp"
    default:         return c
  }
}

const channelIcon = (c: NotificationChannel) => {
  switch (c) {
    case "email":    return Mail
    case "whatsapp": return MessageCircle
  }
}

// ── mock data ─────────────────────────────────────────────────────────────────

let nextId          = 3
let nextRecipientId = 100

const initialRules: NotificationRule[] = [
  {
    id: 1,
    alert_type: "low_balance",
    threshold: 500,
    channels: ["email", "whatsapp"],
    recipients: [
      {id: 1, name: "João",  contact: "joao@email.com"},
      {id: 2, name: "Maria", contact: "+5511999999999"},
    ],
    enabled: true,
  },
  {
    id: 2,
    alert_type: "spending_limit",
    threshold: 3000,
    channels: ["email"],
    recipients: [
      {id: 3, name: "João", contact: "joao@email.com"},
    ],
    enabled: true,
  },
]

// ── component ─────────────────────────────────────────────────────────────────

export default function Notifications() {
  const [rules, setRules] = createSignal<NotificationRule[]>(initialRules)


  // ── handlers ───────────────────────────────────────────────────────────────

  const handleCreate = (data: RuleSaveData) => {
    const newRule: NotificationRule = {
      id:         nextId++,
      enabled:    true,
      alert_type: data.alert_type,
      threshold:  data.threshold,
      channels:   data.channels,
      recipients: data.recipients.map((r) => ({...r, id: nextRecipientId++})),
    }
    setRules((prev) => [...prev, newRule])
  }

  const handleUpdate = (ruleId: number, data: RuleSaveData) => {
    setRules((prev) =>
      prev.map((r) =>
        r.id === ruleId
          ? {
              ...r,
              alert_type: data.alert_type,
              threshold:  data.threshold,
              channels:   data.channels,
              recipients: data.recipients.map((rec, i) => ({
                ...rec,
                id: r.recipients[i]?.id ?? nextRecipientId++,
              })),
            }
          : r,
      ),
    )
  }

  const handleDelete = (id: number) => {
    setRules((prev) => prev.filter((r) => r.id !== id))
  }

  const toggleEnabled = (id: number) => {
    setRules((prev) =>
      prev.map((r) => (r.id === id ? {...r, enabled: !r.enabled} : r)),
    )
  }

  // ── render ─────────────────────────────────────────────────────────────────

  return (
    <div class="space-y-6">
      {/* Header */}
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold">Notificações</h1>
          <p class="text-sm text-muted-foreground mt-1">
            Configure alertas personalizados para manter o controle das suas finanças.
          </p>
        </div>
        <CreateEditAlertDialog onSave={handleCreate}/>
      </div>

      {/* Rules list */}
      <Show
        when={rules().length > 0}
        fallback={
          <Card>
            <CardContent class="py-12">
              <div class="flex flex-col items-center gap-3 text-center">
                <Bell class="size-10 text-muted-foreground"/>
                <p class="text-sm text-muted-foreground">
                  Nenhuma regra de notificação configurada.
                </p>
                <CreateEditAlertDialog onSave={handleCreate}/>
              </div>
            </CardContent>
          </Card>
        }
      >
        <div class="grid gap-4 md:grid-cols-2">
          <For each={rules()}>
            {(rule) => (
              <Card class={!rule.enabled ? "opacity-60" : ""}>
                <CardHeader>
                  <div class="flex items-center justify-between">
                    <div class="flex items-center gap-3">
                      <div class="flex size-10 items-center justify-center rounded-lg bg-muted">
                        <Bell class="size-5"/>
                      </div>
                      <div>
                        <CardTitle class="text-base">{alertTypeLabel(rule.alert_type)}</CardTitle>
                        <CardDescription>
                          Limite: {formatCurrency(rule.threshold)}
                        </CardDescription>
                      </div>
                    </div>
                    <Badge variant={rule.enabled ? "default" : "secondary"}>
                      {rule.enabled ? "Ativo" : "Inativo"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent class="space-y-3">
                  <div>
                    <p class="text-xs font-medium text-muted-foreground mb-1.5">Canais</p>
                    <div class="flex gap-2">
                      <For each={rule.channels}>
                        {(ch) => {
                          const Icon = channelIcon(ch)
                          return (
                            <Badge variant="outline" class="gap-1">
                              <Icon class="size-3"/>
                              {channelLabel(ch)}
                            </Badge>
                          )
                        }}
                      </For>
                    </div>
                  </div>
                  <Separator/>
                  <div>
                    <p class="text-xs font-medium text-muted-foreground mb-1.5">
                      Destinatários ({rule.recipients.length})
                    </p>
                    <div class="flex flex-wrap gap-1.5">
                      <For each={rule.recipients}>
                        {(r) => (
                          <Badge variant="secondary" class="gap-1 text-xs">
                            {r.name}
                            <span class="text-muted-foreground">({r.contact})</span>
                          </Badge>
                        )}
                      </For>
                    </div>
                  </div>
                </CardContent>
                <CardFooter class="gap-2">
                  <CreateEditAlertDialog
                    rule={rule}
                    onSave={(data) => handleUpdate(rule.id, data)}
                    onDelete={() => handleDelete(rule.id)}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleEnabled(rule.id)}
                  >
                    {rule.enabled ? "Desativar" : "Ativar"}
                  </Button>
                  <DeleteAlertDialog onDelete={() => handleDelete(rule.id)}/>
                </CardFooter>
              </Card>
            )}
          </For>
        </div>
      </Show>
    </div>
  )
}
