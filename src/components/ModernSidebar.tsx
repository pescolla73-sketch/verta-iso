import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";
import { Button } from "@/components/ui/button";
import {
  LogOut,
  Shield,
  LayoutDashboard,
  Target,
  Package,
  FileText,
  BookOpen,
  FolderOpen,
  GraduationCap,
  CheckCircle,
  Calendar,
  AlertCircle,
  ClipboardCheck,
  TrendingUp,
  XCircle,
  Users,
  Settings,
  Activity,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface MenuItem {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
  badge?: string | number;
  badgeVariant?: "default" | "error" | "warning";
}

interface MenuSection {
  title: string;
  items: MenuItem[];
}

interface SidebarProps {
  openNC?: number;
  overdueNC?: number;
  implementedControls?: number;
}

export function ModernSidebar({
  openNC = 0,
  overdueNC = 0,
  implementedControls = 0,
}: SidebarProps) {
  const location = useLocation();
  const { user, signOut } = useAuth();
  const { hasAnyRole } = usePermissions();

  const isActive = (path: string) => {
    if (path === "/") {
      return location.pathname === "/";
    }
    return (
      location.pathname === path || location.pathname.startsWith(path + "/")
    );
  };

  const hasAdminAccess = hasAnyRole(["SUPER_ADMIN", "ORG_ADMIN"]);

  const menuSections: MenuSection[] = [
    {
      title: "PANORAMICA",
      items: [
        {
          title: "Dashboard",
          icon: LayoutDashboard,
          path: "/",
        },
        {
          title: "Guida ISO 27001",
          icon: BookOpen,
          path: "/guida",
        },
      ],
    },
    {
      title: "PIANIFICAZIONE (PLAN)",
      items: [
        {
          title: "Setup Organizzazione",
          icon: Settings,
          path: "/setup-azienda",
        },
        {
          title: "Inventario Asset",
          icon: Package,
          path: "/assets",
        },
        {
          title: "Test e Verifiche",
          icon: ClipboardCheck,
          path: "/test-verifiche",
        },
        {
          title: "Valutazione Rischi",
          icon: Target,
          path: "/risk-assessment",
        },
      ],
    },
    {
      title: "DOCUMENTAZIONE (DO)",
      items: [
        {
          title: "Policy di Sicurezza",
          icon: FileText,
          path: "/policies",
        },
        {
          title: "Controlli ISO (Annex A)",
          icon: Shield,
          path: "/controls",
          badge:
            implementedControls > 0 ? `${implementedControls}/93` : undefined,
        },
        {
          title: "Statement of Applicability",
          icon: CheckCircle,
          path: "/soa",
        },
        {
          title: "Procedure Operative",
          icon: BookOpen,
          path: "/procedures",
        },
        {
          title: "Formazione",
          icon: GraduationCap,
          path: "/training",
        },
        {
          title: "Registro Documenti",
          icon: FolderOpen,
          path: "/documents",
        },
      ],
    },
    {
      title: "MONITORAGGIO (CHECK)",
      items: [
        {
          title: "Gestione Incidenti",
          icon: AlertCircle,
          path: "/incidents",
        },
        {
          title: "Registro Eventi",
          icon: Activity,
          path: "/audit",
        },
        {
          title: "Audit Interni",
          icon: ClipboardCheck,
          path: "/audit-interni",
        },
        {
          title: "Riesame Direzione",
          icon: TrendingUp,
          path: "/management-review",
        },
      ],
    },
    {
      title: "MIGLIORAMENTO (ACT)",
      items: [
        {
          title: "Non-Conformita",
          icon: XCircle,
          path: "/non-conformity",
          badge: openNC > 0 ? openNC.toString() : undefined,
          badgeVariant: overdueNC > 0 ? "error" : "warning",
        },
        {
          title: "Azioni di Miglioramento",
          icon: Target,
          path: "/improvement",
        },
        {
          title: "Calendario Compliance",
          icon: Calendar,
          path: "/compliance-calendar",
        },
      ],
    },
    {
      title: "CERTIFICAZIONE",
      items: [
        {
          title: "Audit di Certificazione",
          icon: CheckCircle,
          path: "/certification-audit",
        },
      ],
    },
  ];

  const adminSection: MenuSection = {
    title: "AMMINISTRAZIONE",
    items: [
      {
        title: "Gestione Utenti",
        icon: Users,
        path: "/users",
      },
      {
        title: "Configurazione",
        icon: Settings,
        path: "/settings",
      },
    ],
  };

  return (
    <div className="h-screen w-[280px] bg-prof-primary-dark flex flex-col border-r border-white/10">
      {/* Logo & Title */}
      <div className="p-5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/10 rounded-lg">
            <Shield className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg text-white">ISO 27001 ISMS</h1>
            <p className="text-xs text-white/60">Management System</p>
          </div>
        </div>
      </div>

      {/* User Info */}
      {user && (
        <div className="px-4 py-3 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center text-white text-sm font-semibold">
              {user.email?.[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {user.email?.split("@")[0]}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Menu Sections */}
      <div className="flex-1 overflow-y-auto py-4 px-3">
        {menuSections.map((section, sectionIndex) => (
          <div key={section.title} className={cn(sectionIndex > 0 && "mt-6")}>
            <div className="px-3 mb-2">
              <span className="text-[11px] font-semibold text-white/50 uppercase tracking-wider">
                {section.title}
              </span>
            </div>

            <div className="space-y-0.5">
              {section.items.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);

                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-all",
                      "border-l-[3px] border-transparent",
                      active
                        ? "bg-white/15 border-l-[hsl(var(--prof-accent))] text-white font-medium"
                        : "text-white/70 hover:bg-white/10 hover:text-white"
                    )}
                  >
                    <Icon
                      className={cn(
                        "h-[18px] w-[18px] flex-shrink-0",
                        active ? "opacity-100" : "opacity-70"
                      )}
                    />
                    <span className="flex-1">{item.title}</span>
                    {item.badge && (
                      <span
                        className={cn(
                          "px-2 py-0.5 text-[10px] font-semibold rounded-full",
                          item.badgeVariant === "error"
                            ? "bg-red-500/20 text-red-300 border border-red-400/30"
                            : item.badgeVariant === "warning"
                            ? "bg-amber-500/20 text-amber-300 border border-amber-400/30"
                            : "bg-white/20 text-white/80"
                        )}
                      >
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}

        {/* Admin Section */}
        {hasAdminAccess && (
          <div className="mt-6">
            <div className="px-3 mb-2">
              <span className="text-[11px] font-semibold text-white/50 uppercase tracking-wider">
                {adminSection.title}
              </span>
            </div>

            <div className="space-y-0.5">
              {adminSection.items.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);

                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-all",
                      "border-l-[3px] border-transparent",
                      active
                        ? "bg-white/15 border-l-[hsl(var(--prof-accent))] text-white font-medium"
                        : "text-white/70 hover:bg-white/10 hover:text-white"
                    )}
                  >
                    <Icon
                      className={cn(
                        "h-[18px] w-[18px] flex-shrink-0",
                        active ? "opacity-100" : "opacity-70"
                      )}
                    />
                    <span className="flex-1">{item.title}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-white/10">
        {user && (
          <Button
            variant="ghost"
            onClick={signOut}
            className="w-full justify-start text-white/70 hover:text-white hover:bg-white/10 mb-3"
          >
            <LogOut className="h-4 w-4 mr-3" />
            Esci
          </Button>
        )}
        <div className="text-center">
          <p className="text-[10px] font-medium text-white/40 uppercase tracking-wide">
            ISO/IEC 27001:2022
          </p>
          <p className="text-[9px] text-white/30 mt-0.5">
            Information Security Management
          </p>
        </div>
      </div>
    </div>
  );
}
