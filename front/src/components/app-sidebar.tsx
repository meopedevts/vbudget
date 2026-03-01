import {A, useLocation} from "@solidjs/router"
import {LayoutDashboard, ArrowLeftRight, Plug, Bell, Settings2, LogOut, User} from "lucide-solid"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import type {User as UserType} from "@/lib/api/types"

const menuItems = [
  {title: "Dashboard", href: "/", icon: LayoutDashboard},
  {title: "Lançamentos", href: "/transactions", icon: ArrowLeftRight},
  {title: "Integrações", href: "/integrations", icon: Plug},
  {title: "Notificações", href: "/notifications", icon: Bell},
]

interface AppSidebarProps {
  user?: UserType
  onLogout?: () => void
}

export function AppSidebar(props: AppSidebarProps) {
  const location = useLocation()

  const isActive = (href: string) => {
    if (href === "/") return location.pathname === "/"
    return location.pathname.startsWith(href)
  }

  return (
    <Sidebar>
      <SidebarHeader class="px-4 py-4">
        <div class="flex items-center gap-2">
          <div class="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <span class="text-sm font-bold">V</span>
          </div>
          <span class="text-lg font-semibold">VBudget</span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem>
                  <SidebarMenuButton
                    as={A}
                    href={item.href}
                    isActive={isActive(item.href)}
                    tooltip={item.title}
                  >
                    <item.icon />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter class="px-2 py-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              as={A}
              href="/settings"
              isActive={isActive("/settings")}
              tooltip="Configurações"
            >
              <Settings2/>
              <span>Configurações</span>
            </SidebarMenuButton>
          </SidebarMenuItem>

          {/* Current user + logout */}
          {props.user && (
            <SidebarMenuItem>
              <div class="flex w-full items-center justify-between gap-2 px-2 py-1.5">
                <div class="flex items-center gap-2 text-sm">
                  <User class="size-4 text-muted-foreground" />
                  <span class="truncate font-medium">{props.user.name}</span>
                </div>
                <button
                  type="button"
                  title="Sair"
                  class="rounded p-1 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  onClick={props.onLogout}
                >
                  <LogOut class="size-4" />
                </button>
              </div>
            </SidebarMenuItem>
          )}
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
