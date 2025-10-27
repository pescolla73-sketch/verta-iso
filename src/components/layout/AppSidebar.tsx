import { NavLink, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  LayoutDashboard,
  Box,
  Shield,
  FileText,
  ClipboardCheck,
  ScrollText,
  Users,
  Settings,
  Building2,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;
  const isCollapsed = state === "collapsed";

  // Fetch controls to calculate wizard progress
  const { data: controls } = useQuery({
    queryKey: ["controls"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("controls")
        .select("*");
      if (error) throw error;
      return data;
    },
  });

  const wizardProgress = controls
    ? Math.round(
        ((controls.filter((c) => c.status && c.status !== "not_implemented").length) / 
         controls.length) * 100
      )
    : 0;

  const hasWizardProgress = wizardProgress > 0 && wizardProgress < 100;

  const menuItems = [
    { title: "Dashboard", url: "/", icon: LayoutDashboard },
    { 
      title: "Controlli", 
      url: "/controls", 
      icon: Shield, 
      badge: hasWizardProgress ? `${wizardProgress}%` : undefined,
      subItems: [
        { title: "🧙 Wizard Guidato", url: "/controls/wizard" },
        { title: "📊 Vista Tabella", url: "/controls/table" }
      ]
    },
    { title: "Asset", url: "/assets", icon: Box },
    { title: "SoA", url: "/soa", icon: FileText },
    { title: "Audit", url: "/audits", icon: ClipboardCheck },
    { title: "Politiche", url: "/policies", icon: ScrollText },
    { title: "Ruoli", url: "/roles", icon: Users },
    { title: "Setup Azienda", url: "/setup-azienda", icon: Building2 },
    { title: "Impostazioni", url: "/settings", icon: Settings },
  ];

  const isActive = (path: string) => currentPath === path;
  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive
      ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
      : "hover:bg-sidebar-accent/50 text-sidebar-foreground/80 hover:text-sidebar-foreground";

  return (
    <Sidebar className={isCollapsed ? "w-14" : "w-64"}>
      <SidebarContent>
        <div className="flex items-center justify-between p-4 border-b border-sidebar-border">
          {!isCollapsed && (
            <div className="flex items-center gap-2">
              <Shield className="h-6 w-6 text-sidebar-primary" />
              <span className="font-semibold text-sidebar-foreground">
                ISO 27001
              </span>
            </div>
          )}
        </div>

        <SidebarGroup>
          <SidebarGroupLabel>Menu Principale</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} end className={getNavCls}>
                      <item.icon className="h-4 w-4" />
                      {!isCollapsed && (
                        <div className="flex items-center justify-between flex-1">
                          <span>{item.title}</span>
                          {item.badge && (
                            <Badge variant="destructive" className="ml-2 text-xs">
                              {item.badge}
                            </Badge>
                          )}
                        </div>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                  {!isCollapsed && item.subItems && (
                    <div className="ml-6 mt-1 space-y-1">
                      {item.subItems.map((subItem) => (
                        <SidebarMenuButton key={subItem.url} asChild size="sm">
                          <NavLink to={subItem.url} className={getNavCls}>
                            <span className="text-sm">{subItem.title}</span>
                          </NavLink>
                        </SidebarMenuButton>
                      ))}
                    </div>
                  )}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
