import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  ChevronDown,
  ChevronRight,
  LogOut,
  Shield,
  Home,
  Map,
  Target,
  FileText,
  BookOpen,
  FolderOpen,
  GraduationCap,
  Package,
  AlertTriangle,
  CheckCircle,
  Calendar,
  AlertCircle,
  ClipboardCheck,
  TrendingUp,
  XCircle,
  Award,
  Users,
  Lock,
  Settings,
  BarChart,
  History,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface MenuItem {
  title: string;
  icon: any;
  path?: string;
  badge?: string | number;
  badgeVariant?: "default" | "destructive" | "outline" | "secondary";
  requiredRoles?: string[];
  children?: MenuItem[];
}

export function ModernSidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut } = useAuth();
  const { userRoles, hasAnyRole } = usePermissions();

  const [expandedSections, setExpandedSections] = useState<string[]>([
    "setup",
    "docs",
    "controls",
    "evaluation",
    "improvement",
  ]);

  const toggleSection = (section: string) => {
    setExpandedSections((prev) =>
      prev.includes(section)
        ? prev.filter((s) => s !== section)
        : [...prev, section]
    );
  };

  const isActive = (path: string) => {
    return (
      location.pathname === path ||
      location.pathname.startsWith(path + "/")
    );
  };

  const operationalMenu: MenuItem[] = [
    {
      title: "Setup & Pianificazione",
      icon: Target,
      children: [
        {
          title: "Setup Azienda",
          icon: Target,
          path: "/setup-azienda",
        },
        {
          title: "Risk Assessment",
          icon: AlertTriangle,
          path: "/risk-assessment",
        },
        { title: "Asset Inventory", icon: Package, path: "/assets" },
      ],
    },
    {
      title: "Documenti",
      icon: FileText,
      children: [
        { title: "Politiche", icon: FileText, path: "/policies" },
        { title: "Procedure", icon: BookOpen, path: "/procedures" },
        {
          title: "Controllo Documenti",
          icon: FolderOpen,
          path: "/documents",
        },
        { title: "Training", icon: GraduationCap, path: "/training" },
      ],
    },
    {
      title: "Controlli & Sicurezza",
      icon: Shield,
      badge: "12%",
      badgeVariant: "secondary",
      children: [
        {
          title: "93 Controlli",
          icon: Shield,
          path: "/controls",
          badge: "125%",
        },
        { title: "SoA", icon: CheckCircle, path: "/soa" },
        {
          title: "Registro Eventi",
          icon: Calendar,
          path: "/audit",
        },
        { title: "Incidenti", icon: AlertCircle, path: "/incidents" },
      ],
    },
    {
      title: "Audit & Review",
      icon: ClipboardCheck,
      children: [
        {
          title: "Audit Interni",
          icon: ClipboardCheck,
          path: "/audit-interni",
        },
        {
          title: "Management Review",
          icon: TrendingUp,
          path: "/management-review",
        },
      ],
    },
    {
      title: "Miglioramento",
      icon: TrendingUp,
      badge: 7,
      badgeVariant: "destructive",
      children: [
        {
          title: "Non Conformità",
          icon: XCircle,
          path: "/non-conformity",
          badge: 7,
        },
        {
          title: "Azioni Correttive",
          icon: Target,
          path: "/improvement",
        },
      ],
    },
  ];

  const adminMenu: MenuItem[] = [
    {
      title: "Gestione Utenti",
      icon: Users,
      path: "/users",
      requiredRoles: ["SUPER_ADMIN", "ORG_ADMIN"],
    },
    {
      title: "Security Audit",
      icon: Lock,
      path: "/final-security-audit",
      requiredRoles: ["SUPER_ADMIN", "ORG_ADMIN"],
    },
    {
      title: "Setup RBAC",
      icon: Settings,
      path: "/setup-rbac",
      requiredRoles: ["SUPER_ADMIN", "ORG_ADMIN"],
    },
    {
      title: "Analytics RBAC",
      icon: BarChart,
      path: "/security-check",
      requiredRoles: ["SUPER_ADMIN", "ORG_ADMIN"],
    },
    {
      title: "Audit Trail",
      icon: History,
      path: "/audit-trail",
      requiredRoles: ["SUPER_ADMIN", "ORG_ADMIN", "AUDITOR"],
    },
    {
      title: "🔄 Reset Database",
      icon: RefreshCw,
      path: "/admin/reset",
      requiredRoles: ["SUPER_ADMIN", "ORG_ADMIN"],
    },
  ];

  const hasAdminAccess = hasAnyRole(["SUPER_ADMIN", "ORG_ADMIN"]);

  const renderMenuItem = (item: MenuItem, depth: number = 0) => {
    if (item.requiredRoles && !hasAnyRole(item.requiredRoles)) {
      return null;
    }

    const hasChildren = item.children && item.children.length > 0;
    const sectionKey = item.title.toLowerCase().replace(/\s+/g, "-");
    const isExpanded = expandedSections.includes(sectionKey);
    const active = item.path ? isActive(item.path) : false;
    const Icon = item.icon;

    if (hasChildren) {
      return (
        <div key={item.title}>
          <button
            onClick={() => toggleSection(sectionKey)}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm font-medium",
              depth === 0
                ? "hover:bg-indigo-50 text-gray-700"
                : "hover:bg-gray-100 text-gray-600",
              depth === 0 && "mt-1"
            )}
          >
            <Icon className="h-4 w-4 flex-shrink-0" />
            <span className="flex-1 text-left">{item.title}</span>
            {item.badge && (
              <Badge variant={item.badgeVariant || "default"} className="text-xs">
                {item.badge}
              </Badge>
            )}
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </button>

          {isExpanded && (
            <div className="ml-4 mt-1 space-y-0.5 border-l-2 border-gray-200 pl-2">
              {item.children?.map((child) => renderMenuItem(child, depth + 1))}
            </div>
          )}
        </div>
      );
    }

    return (
      <button
        key={item.title}
        onClick={() => item.path && navigate(item.path)}
        className={cn(
          "w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all text-sm",
          active
            ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-medium shadow-md"
            : "hover:bg-gray-100 text-gray-700",
          depth > 0 && "text-sm"
        )}
      >
        <Icon className={cn("h-4 w-4 flex-shrink-0", active && "text-white")} />
        <span className="flex-1 text-left">{item.title}</span>
        {item.badge && (
          <Badge
            variant={active ? "outline" : item.badgeVariant || "default"}
            className={cn("text-xs", active && "bg-white/20 text-white border-white/30")}
          >
            {item.badge}
          </Badge>
        )}
      </button>
    );
  };

  return (
    <div className="h-screen w-64 bg-white border-r border-gray-200 flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg">
            <Shield className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              ISO 27001
            </h1>
            <p className="text-xs text-gray-500">ISMS Platform</p>
          </div>
        </div>
      </div>

      {user && (
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-400 to-purple-400 rounded-full flex items-center justify-center text-white font-bold">
              {user.email?.[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user.email?.split("@")[0]}
              </p>
              {userRoles.length > 0 && (
                <p className="text-xs text-gray-500 truncate">
                  {userRoles[0].role_name}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-3 space-y-1">
        <button
          onClick={() => navigate("/")}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-sm font-medium",
            location.pathname === "/"
              ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-md"
              : "hover:bg-indigo-50 text-gray-700"
          )}
        >
          <Home className="h-5 w-5" />
          <span>Dashboard</span>
        </button>

        <button
          onClick={() => navigate("/progress")}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-sm font-medium",
            isActive("/progress")
              ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-md"
              : "hover:bg-indigo-50 text-gray-700"
          )}
        >
          <Map className="h-5 w-5" />
          <span>Percorso Certificazione</span>
        </button>

        <button
          onClick={() => navigate("/guida")}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-sm font-medium",
            isActive("/guida")
              ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-md"
              : "hover:bg-indigo-50 text-gray-700"
          )}
        >
          <BookOpen className="h-5 w-5" />
          <span>📖 Guida</span>
          <Badge variant="outline" className="ml-auto text-xs">NUOVO</Badge>
        </button>

        <Separator className="my-3" />

        <div className="space-y-0.5">
          <div className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
            🚀 Operativo
          </div>
          {operationalMenu.map((item) => renderMenuItem(item))}
        </div>

        <Separator className="my-3" />
        <button
          onClick={() => navigate("/certification-audit")}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-sm font-medium",
            isActive("/certification-audit")
              ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-md"
              : "hover:bg-yellow-50 text-gray-700 border-2 border-yellow-200"
          )}
        >
          <Award className="h-5 w-5" />
          <span>🏆 Certificazione</span>
        </button>

        {hasAdminAccess && (
          <>
            <Separator className="my-4" />
            <div className="space-y-0.5">
              <div className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                <Lock className="h-3 w-3" />
                ⚙️ Amministrazione
              </div>
              {adminMenu.map((item) => renderMenuItem(item))}
            </div>
          </>
        )}
      </div>

      {user && (
        <div className="p-3 border-t border-gray-200">
          <Button
            variant="ghost"
            onClick={signOut}
            className="w-full justify-start text-gray-700 hover:bg-red-50 hover:text-red-600"
          >
            <LogOut className="h-4 w-4 mr-3" />
            Esci
          </Button>
        </div>
      )}
    </div>
  );
}
