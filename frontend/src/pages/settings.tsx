import {Tag} from "lucide-solid"
import {CategoriesDialog} from "@/components/settings/categories-dialog"

export default function Settings() {
  return (
    <div class="space-y-6">
      <div>
        <h1 class="text-2xl font-bold">Configurações</h1>
        <p class="text-sm text-muted-foreground mt-1">
          Gerencie as configurações gerais do sistema.
        </p>
      </div>

      <div class="grid gap-3 max-w-lg">
        {/* Categorias */}
        <div class="rounded-xl border bg-card p-4 flex items-start gap-4">
          <div class="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted">
            <Tag class="size-4 text-muted-foreground"/>
          </div>
          <div class="flex flex-1 items-center justify-between gap-4">
            <div class="grid gap-0.5">
              <p class="text-sm font-medium">Categorias</p>
              <p class="text-xs text-muted-foreground">
                Crie e organize as categorias de receitas e despesas.
              </p>
            </div>
            <CategoriesDialog/>
          </div>
        </div>
      </div>
    </div>
  )
}

