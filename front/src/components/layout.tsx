import type {ParentProps} from "solid-js"
import {SidebarInset, SidebarProvider, SidebarTrigger} from "@/components/ui/sidebar"
import {Separator} from "@/components/ui/separator"
import {AppSidebar} from "@/components/app-sidebar"
import {AuthProvider, useAuth} from "@/lib/auth-context"

function LayoutInner(props: ParentProps) {
  const auth = useAuth()

  return (
    <SidebarProvider>
      <AppSidebar onLogout={() => { void auth.logout() }} user={auth.user()} />
      <SidebarInset>
        <header class="flex h-14 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger class="-ml-1" />
          <Separator orientation="vertical" class="mr-2 !h-4" />
          <span class="text-sm font-medium text-muted-foreground">VBudget</span>
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
