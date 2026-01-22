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
  FileCheck,
  Wrench,
  Search,
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
import { ProtectedMenuItem } from "@/components/ProtectedMenuItem";

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
        { title: "📋 Piano d'Azione", url: "/action-plan", icon: ClipboardList },
        { title: "🎯 Percorso ISO 27001", url: "/progress", icon: TrendingUp },
      ],
    },
    {
      label: "Setup (Clausole 4-5)",
      items: [
        {
          title: "Setup Azienda",
          url: "/setup-azienda",
          icon: Building2,
          requiredRoles: ["SUPER_ADMIN", "ORG_ADMIN", "CISO"],
        },
      ],
    },
    {
      label: "Pianificazione (Clausola 6)",
      items: [
        {
          title: "Risk Assessment",
          url: "/risk-assessment",
          icon: AlertTriangle,
          resource: "risks",
          action: "read",
        },
        {
          title: "Asset",
          url: "/assets",
          icon: Box,
          resource: "assets",
          action: "read",
        },
        {
          title: "Controlli",
          url: "/controls",
          icon: Shield,
          resource: "controls",
          action: "read",
          badge: hasWizardProgress ? `${wizardProgress}%` : undefined,
        },
        {
          title: "SoA",
          url: "/soa",
          icon: FileText,
          resource: "soa",
          action: "read",
        },
      ],
    },
    {
      label: "Supporto (Clausola 7)",
      items: [
        {
          title: "Politiche",
          url: "/policies",
          icon: FileText,
          resource: "policies",
          action: "read",
        },
        {
          title: "Procedure",
          url: "/procedures",
          icon: ClipboardList,
          resource: "procedures",
          action: "read",
        },
        {
          title: "Controllo Documenti",
          url: "/documents",
          icon: FileCheck,
          resource: "documents",
          action: "read",
        },
        {
          title: "Training",
          url: "/training",
          icon: GraduationCap,
          resource: "trainings",
          action: "read",
        },
      ],
    },
    {
      label: "Operatività (Clausola 8)",
      items: [
        {
          title: "Registro Eventi",
          url: "/audit",
          icon: ScrollText,
          resource: "audits",
          action: "read",
        },
        {
          title: "Incidenti",
          url: "/incidents",
          icon: ShieldAlert,
          resource: "incidents",
          action: "read",
        },
      ],
    },
    {
      label: "Valutazione (Clausola 9)",
      items: [
        {
          title: "Audit Interni",
          url: "/audit-interni",
          icon: ClipboardCheck,
          resource: "audits",
          action: "read",
        },
        {
          title: "Management Review",
          url: "/management-review",
          icon: TrendingUp,
          requiredRoles: ["SUPER_ADMIN", "ORG_ADMIN", "CISO"],
        },
      ],
    },
    {
      label: "Miglioramento (Clausola 10)",
      items: [
        {
          title: "Non Conformità",
          url: "/non-conformity",
          icon: AlertTriangle,
          resource: "non_conformities",
          action: "read",
        },
        {
          title: "Miglioramento Continuo",
          url: "/improvement",
          icon: TrendingUp,
          resource: "improvements",
          action: "read",
        },
      ],
    },
    {
      label: "Certificazione",
      items: [
        {
          title: "Audit Certificazione",
          url: "/audit-certificazione",
          icon: Award,
          resource: "certification_audits",
          action: "read",
        },
      ],
    },
    {
      label: "Amministrazione",
      items: [
        {
          title: "🔒 Security Check",
          url: "/security-check",
          icon: ShieldAlert,
          requiredRoles: ["SUPER_ADMIN", "ORG_ADMIN"],
        },
        {
          title: "Security Audit Finale",
          url: "/final-security-audit",
          icon: Shield,
          requiredRoles: ["SUPER_ADMIN", "ORG_ADMIN"],
        },
        {
          title: "Setup RBAC",
          url: "/setup-rbac",
          icon: Wrench,
          requiredRoles: ["SUPER_ADMIN", "ORG_ADMIN"],
        },
        {
          title: "Analizza RBAC",
          url: "/analyze-rbac",
          icon: Search,
          requiredRoles: ["SUPER_ADMIN", "ORG_ADMIN"],
        },
        {
          title: "Gestione Utenti",
          url: "/users",
          icon: Users,
          requiredRoles: ["SUPER_ADMIN", "ORG_ADMIN"],
        },
        {
          title: "Utenti",
          url: "/roles",
          icon: Users,
          requiredRoles: ["SUPER_ADMIN", "ORG_ADMIN"],
        },
        {
          title: "Impostazioni",
          url: "/settings",
          icon: Settings,
          requiredRoles: ["SUPER_ADMIN", "ORG_ADMIN"],
        },
        {
          title: "Audit Trail",
          url: "/audit-trail",
          icon: History,
          requiredRoles: ["SUPER_ADMIN", "ORG_ADMIN", "AUDITOR"],
        },
      ],
    },
  ];

  const isActive = (path: string) => currentPath === path;
  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive
      ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
      : "hover:bg-sidebar-accent/50 text-sidebar-foreground/80 hover:text-sidebar-foreground";

  return (
    <Sidebar className={isCollapsed ? "w-14" : "w-60"} collapsible="icon">
      <SidebarContent className="overflow-x-hidden overflow-y-auto">
        {/* Header */}
        <div className="flex items-center gap-2 p-3 border-b border-sidebar-border min-h-[48px]">
          <Shield className="h-5 w-5 text-sidebar-primary flex-shrink-0" />
          {!isCollapsed && (
            <span className="font-semibold text-sidebar-foreground text-sm whitespace-nowrap">
              ISO 27001
            </span>
          )}
        </div>

        {/* Menu sections */}
        {menuSections.map((section) => (
          <SidebarGroup key={section.label} className="py-1 px-1">
            {!isCollapsed && (
              <SidebarGroupLabel className="text-[10px] uppercase tracking-wider text-sidebar-foreground/50 px-2 py-1 truncate">
                {section.label}
              </SidebarGroupLabel>
            )}
            <SidebarGroupContent>
              <SidebarMenu className="space-y-0.5">
                {section.items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    {("requiredRoles" in item) || ("resource" in item) ? (
                      <ProtectedMenuItem
                        label={item.title}
                        path={item.url}
                        icon={item.icon}
                        requiredRoles={item.requiredRoles}
                        resource={item.resource}
                        action={item.action}
                        isActive={isActive(item.url)}
                        showLabel={!isCollapsed}
                        badge={
                          !isCollapsed && item.badge ? (
                            <Badge variant="secondary" className="ml-auto text-[10px] px-1.5 flex-shrink-0">
                              {item.badge}
                            </Badge>
                          ) : undefined
                        }
                      />
                    ) : (
                      <SidebarMenuButton asChild className="h-9 px-2">
                        <NavLink to={item.url} end className={getNavCls}>
                          <item.icon className="h-4 w-4 flex-shrink-0" />
                          {!isCollapsed && (
                            <span className="flex-1 truncate text-sm ml-2">{item.title}</span>
                          )}
                          {!isCollapsed && item.badge && (
                            <Badge variant="secondary" className="ml-auto text-[10px] px-1.5 flex-shrink-0">
                              {item.badge}
                            </Badge>
                          )}
                        </NavLink>
                      </SidebarMenuButton>
                    )}
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
