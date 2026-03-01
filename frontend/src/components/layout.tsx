import {createMemo, type ParentProps, Show} from "solid-js"
import {A, useLocation} from "@solidjs/router"
import {SidebarInset, SidebarProvider, SidebarTrigger} from "@/components/ui/sidebar"
import {Separator} from "@/components/ui/separator"
import {AppSidebar} from "@/components/app-sidebar"
import {AuthProvider, useAuth} from "@/lib/auth-context"
import {
  BreadcrumbList,
  Breadcrumbs,
  BreadcrumbsItem,
  BreadcrumbsLink,
  BreadcrumbsSeparator,
} from "@/components/ui/breadcrumbs"

const routeLabels: Record<string, string> = {
  "/app": "Dashboard",
  "/app/transactions": "Lançamentos",
  "/app/integrations": "Integrações",
  "/app/notifications": "Notificações",
  "/app/settings": "Configurações",
}

function LayoutInner(props: ParentProps) {
  const auth = useAuth()
  const location = useLocation()

  const isRoot = createMemo(() => location.pathname === "/")
  const currentLabel = createMemo(() => routeLabels[location.pathname] ?? routeLabels[location.pathname])

  return (
    <SidebarProvider>
      <AppSidebar onLogout={() => {
        void auth.logout()
      }} user={auth.user()}/>
      <SidebarInset>
        <header class="flex h-14 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger class="-ml-1"/>
          <Separator orientation="vertical" class="mr-2 !h-4"/>
          <Breadcrumbs>
            <BreadcrumbList>
              <BreadcrumbsItem>
                <BreadcrumbsLink as={A} href="/" current={isRoot()}>
                  VBudget
                </BreadcrumbsLink>
              </BreadcrumbsItem>
              <Show when={!isRoot()}>
                <BreadcrumbsSeparator/>
                <BreadcrumbsItem>
                  <BreadcrumbsLink current>{currentLabel()}</BreadcrumbsLink>
                </BreadcrumbsItem>
              </Show>
            </BreadcrumbList>
          </Breadcrumbs>
        </header>
        <main class="flex-1 overflow-auto p-4 md:p-6">
          {props.children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}

export function Layout(props: ParentProps) {
  return (
    <AuthProvider>
      <LayoutInner>{props.children}</LayoutInner>
    </AuthProvider>
  )
}
