import { NavLink, useLocation } from "react-router-dom";
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
  AlertTriangle,
  TrendingUp,
  GraduationCap,
  Shield as ShieldAlert,
  ClipboardList,
  Award,
  History,
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
import { useControls } from "@/hooks/useControls";

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;
  const isCollapsed = state === "collapsed";

  // Fetch controls to calculate wizard progress
  const { data: controls } = useControls();

  const wizardProgress = controls
    ? Math.round(
        ((controls.filter((c) => c.status && c.status !== "not_implemented").length) / 
         controls.length) * 100
      )
    : 0;

  const hasWizardProgress = wizardProgress > 0 && wizardProgress < 100;

  // Menu sections following ISO 27001 implementation order
  const menuSections = [
    {
      label: "Panoramica",
      items: [
        { title: "Dashboard", url: "/", icon: LayoutDashboard },
        { title: "🎯 Percorso ISO 27001", url: "/progress", icon: TrendingUp },
      ]
    },
    {
      label: "Setup (Clausole 4-5)",
      items: [
        { title: "Setup Azienda", url: "/setup-azienda", icon: Building2 },
      ]
    },
    {
      label: "Pianificazione (Clausola 6)",
      items: [
        { title: "Risk Assessment", url: "/risk-assessment", icon: AlertTriangle },
        { title: "Asset", url: "/assets", icon: Box },
        { 
          title: "Controlli", 
          url: "/controls", 
          icon: Shield, 
          badge: hasWizardProgress ? `${wizardProgress}%` : undefined
        },
        { title: "SoA", url: "/soa", icon: FileText },
      ]
    },
    {
      label: "Supporto (Clausola 7)",
      items: [
        { title: "Politiche", url: "/policies", icon: FileText },
        { title: "Procedure", url: "/procedures", icon: ClipboardList },
        { title: "Training", url: "/training", icon: GraduationCap },
      ]
    },
    {
      label: "Operatività (Clausola 8)",
      items: [
        { title: "Registro Eventi", url: "/audit", icon: ScrollText },
        { title: "Incidenti", url: "/incidents", icon: ShieldAlert },
      ]
    },
    {
      label: "Valutazione (Clausola 9)",
      items: [
        { title: "Audit Interni", url: "/audit-interni", icon: ClipboardCheck },
        { title: "Management Review", url: "/management-review", icon: TrendingUp },
      ]
    },
    {
      label: "Miglioramento (Clausola 10)",
      items: [
        { title: "Non Conformità", url: "/non-conformity", icon: AlertTriangle },
      ]
    },
    {
      label: "Certificazione",
      items: [
        { title: "Audit Certificazione", url: "/audit-certificazione", icon: Award },
      ]
    },
    {
      label: "Amministrazione",
      items: [
        { title: "Utenti", url: "/roles", icon: Users },
        { title: "Impostazioni", url: "/settings", icon: Settings },
        { title: "Audit Trail", url: "/audit-trail", icon: History },
      ]
    }
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

        {menuSections.map((section) => (
          <SidebarGroup key={section.label}>
            <SidebarGroupLabel>{section.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {section.items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink to={item.url} end className={getNavCls}>
                        <item.icon className="h-4 w-4" />
                        {!isCollapsed && (
                          <span className="flex-1">{item.title}</span>
                        )}
                        {!isCollapsed && item.badge && (
                          <Badge variant="secondary" className="ml-auto">
                            {item.badge}
                          </Badge>
                        )}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
    </Sidebar>
  );
}
