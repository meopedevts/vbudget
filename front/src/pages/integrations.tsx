import {createSignal, For} from "solid-js"
import {Construction, Landmark, MessageCircle, Plug, RefreshCw, Unplug} from "lucide-solid"
import {Card, CardContent, CardFooter, CardHeader, CardTitle} from "@/components/ui/card"
import {Badge} from "@/components/ui/badge"
import {Button} from "@/components/ui/button"
import {Separator} from "@/components/ui/separator"
import type {ConnectionStatus} from "@/lib/api"

interface IntegrationCard {
  id: string
  provider: string
  label: string
  description: string
  icon: typeof Landmark
  status: ConnectionStatus
  lastSync: string | null
}

const initialIntegrations: IntegrationCard[] = [
  {
    id: "openfinance",
    provider: "openfinance",
    label: "Open Finance",
    description: "Conecte suas contas bancárias via Open Finance para importar transações automaticamente.",
    icon: Landmark,
    status: "disconnected",
    lastSync: null,
  },
  {
    id: "whatsapp",
    provider: "whatsapp",
    label: "WhatsApp",
    description: "Receba notificações e alertas financeiros diretamente no seu WhatsApp.",
    icon: MessageCircle,
    status: "disconnected",
    lastSync: null,
  },
]

export default function Integrations() {
  const [integrations, setIntegrations] = createSignal<IntegrationCard[]>(initialIntegrations)

  const toggleConnection = (id: string) => {
    setIntegrations((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item
        const connected = item.status === "connected"
        return {
          ...item,
          status: connected ? "disconnected" as const : "connected" as const,
          lastSync: connected ? null : new Date().toISOString(),
        }
      })
    )
  }

  const statusBadge = (status: ConnectionStatus) => {
    switch (status) {
      case "connected":
        return <Badge variant="default"
                      class="bg-emerald-600 hover:bg-emerald-600">Conectado</Badge>
      case "disconnected":
        return <Badge variant="secondary">Desconectado</Badge>
      case "error":
        return <Badge variant="destructive">Erro</Badge>
    }
  }

  const formatSyncDate = (date: string | null) => {
    if (!date) return "Nunca sincronizado"
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(date))
  }

  return (
    <div class="space-y-6">
      {/* WIP banner */}
      <div
        class="flex items-center gap-3 rounded-lg border border-amber-400 bg-amber-50 px-4 py-3 text-amber-800 dark:border-amber-500 dark:bg-amber-950/40 dark:text-amber-300">
        <Construction class="size-5 shrink-0"/>
        <div>
          <p class="font-semibold text-sm">Em desenvolvimento</p>
          <p class="text-xs opacity-80">
            Esta página ainda não está implementada. Essa é apenas uma prévia do conteúdo final.
          </p>
        </div>
      </div>

      {/* Mockup (visual reference only — not functional) */}
      <div class="pointer-events-none select-none opacity-40">

        <div>
          <h1 class="text-2xl font-bold">Integrações</h1>
          <p class="text-sm text-muted-foreground mt-1">
            Gerencie suas conexões com serviços externos.
          </p>
        </div>

        <div class="grid gap-6 md:grid-cols-2">
          <For each={integrations()}>
            {(integration) => (
              <Card>
                <CardHeader>
                  <div class="flex items-center justify-between">
                    <div class="flex items-center gap-3">
                      <div class="flex size-10 items-center justify-center rounded-lg bg-muted">
                        <integration.icon class="size-5"/>
                      </div>
                      <div>
                        <CardTitle class="text-base">{integration.label}</CardTitle>
                      </div>
                    </div>
                    {statusBadge(integration.status)}
                  </div>
                </CardHeader>
                <CardContent>
                  <p class="text-sm text-muted-foreground">{integration.description}</p>
                  <Separator class="my-4"/>
                  <div class="flex items-center gap-2 text-xs text-muted-foreground">
                    <RefreshCw class="size-3"/>
                    <span>Último sync: {formatSyncDate(integration.lastSync)}</span>
                  </div>
                </CardContent>
                <CardFooter class="gap-2">
                  {integration.status === "connected" ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleConnection(integration.id)}
                    >
                      <Unplug class="size-4"/>
                      Desconectar
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => toggleConnection(integration.id)}
                    >
                      <Plug class="size-4"/>
                      Conectar
                    </Button>
                  )}
                </CardFooter>
              </Card>
            )}
          </For>
        </div>

      </div>
      {/* end mockup */}
    </div>
  )
}
