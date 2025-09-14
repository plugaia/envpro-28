import { FileText, Plus, BarChart3, Settings, Users, Mail, Moon, Sun, Monitor, ChevronLeft, ChevronRight, LayoutTemplate } from "lucide-react";
const logoIcon = "/lovable-uploads/636d6934-d768-4999-a23b-9d1f4a733139.png";
import { NavLink, useLocation } from "react-router-dom";
import { useTheme } from "@/components/ThemeProvider";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarTrigger, useSidebar } from "@/components/ui/sidebar";

const items = [{
  title: "Propostas",
  url: "/",
  icon: FileText
}, {
  title: "Relatórios",
  url: "/relatorios",
  icon: BarChart3
}, {
  title: "Clientes",
  url: "/clientes",
  icon: Users
}, {
  title: "Templates",
  url: "/templates",
  icon: LayoutTemplate
}, {
  title: "Configurações",
  url: "/configuracoes",
  icon: Settings
}];

export function AppSidebar() {
  const {
    state
  } = useSidebar();
  const {
    theme,
    setTheme
  } = useTheme();
  const location = useLocation();
  const currentPath = location.pathname;
  const collapsed = state === "collapsed";
  const isActive = (path: string) => currentPath === path;

  return <Sidebar className={`${collapsed ? "w-16" : "w-64"} bg-sidebar border-r border-sidebar-border transition-all duration-300 ease-in-out`} collapsible="icon">
      <SidebarContent className="bg-sidebar">
        <div className="p-4 border-b border-sidebar-border bg-sidebar h-16 flex items-center">
          <div className="flex items-center justify-between w-full">
            {!collapsed && (
              <div className="flex items-center gap-2 flex-1 fade-in-up">
                <img src={logoIcon} alt="EnvPRO" className="w-8 h-8 object-contain" />
                <div>
                  <h2 className="font-bold text-lg text-sidebar-foreground">EnvPRO</h2>
                </div>
              </div>
            )}
            <SidebarTrigger className="p-1.5 h-8 w-8 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground rounded-md transition-colors">
              {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </SidebarTrigger>
          </div>
        </div>

        <SidebarGroup className="bg-sidebar p-2">
          <SidebarMenu>
            {items.map(item => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton asChild variant="ghost" className={`w-full justify-start hover:bg-sidebar-accent hover:text-sidebar-accent-foreground data-[active=true]:bg-sidebar-primary data-[active=true]:text-sidebar-primary-foreground ${collapsed ? "h-10 w-10 p-0 justify-center" : "h-10"}`}>
                  <NavLink to={item.url} end={item.url === "/"} className={({ isActive }) => `flex items-center rounded-md text-sm font-medium transition-colors ${collapsed ? "justify-center p-2.5" : "gap-3 px-3 py-2"} ${isActive ? "bg-sidebar-primary text-sidebar-primary-foreground" : "text-sidebar-foreground/80 hover:text-sidebar-foreground"}`}>
                    <item.icon className="h-4 w-4 flex-shrink-0" />
                    {!collapsed && <span>{item.title}</span>}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size={collapsed ? "icon" : "default"} className={`w-full hover:bg-sidebar-accent hover:text-sidebar-accent-foreground text-sidebar-foreground/80 ${collapsed ? "h-10 w-10" : "justify-start"}`}>
              {theme === "light" ? <Sun className="h-4 w-4" /> : theme === "dark" ? <Moon className="h-4 w-4" /> : <Monitor className="h-4 w-4" />}
              {!collapsed && <span className="ml-2">Tema</span>}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="center" side={collapsed ? "right" : "top"}>
            <DropdownMenuItem onClick={() => setTheme("light")}><Sun className="mr-2 h-4 w-4" />Claro</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme("dark")}><Moon className="mr-2 h-4 w-4" />Escuro</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme("system")}><Monitor className="mr-2 h-4 w-4" />Sistema</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
    </Sidebar>;
}