import {A, useLocation} from "@solidjs/router"
import {LayoutDashboard, ArrowLeftRight, Plug, Bell, Settings2} from "lucide-solid"
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

const menuItems = [
  {title: "Dashboard", href: "/", icon: LayoutDashboard},
  {title: "Lançamentos", href: "/transactions", icon: ArrowLeftRight},
  {title: "Integrações", href: "/integrations", icon: Plug},
  {title: "Notificações", href: "/notifications", icon: Bell},
]

export function AppSidebar() {
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
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}

