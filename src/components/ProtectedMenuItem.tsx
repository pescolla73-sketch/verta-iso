import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { usePermissions } from "@/hooks/usePermissions";
import { Lock, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ProtectedMenuItemProps {
  label: string;
  path: string;
  icon: LucideIcon;
  requiredRoles?: string[];
  resource?: string;
  action?: string;
  isActive?: boolean;
  badge?: ReactNode;
  showLabel?: boolean;
}

export function ProtectedMenuItem({
  label,
  path,
  icon: Icon,
  requiredRoles,
  resource,
  action = "read",
  isActive = false,
  badge,
  showLabel = true,
}: ProtectedMenuItemProps) {
  const navigate = useNavigate();
  const { hasPermission, hasAnyRole } = usePermissions();

  const hasAccess = requiredRoles
    ? hasAnyRole(requiredRoles)
    : resource
      ? hasPermission(resource, action)
      : true;

  const handleClick = () => {
    if (hasAccess) {
      navigate(path);
    }
  };

  const content = (
    <button
      type="button"
      onClick={handleClick}
      disabled={!hasAccess}
      className={cn(
        "w-full flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
        hasAccess
          ? "text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground cursor-pointer"
          : "text-muted-foreground opacity-60 cursor-not-allowed",
        isActive && hasAccess &&
          "bg-sidebar-accent text-sidebar-accent-foreground font-medium",
      )}
    >
      <Icon
        className={cn(
          "h-4 w-4 flex-shrink-0",
          !hasAccess && "text-muted-foreground",
        )}
      />
      {showLabel && (
        <span className="flex-1 text-left truncate">{label}</span>
      )}
      {showLabel && badge}
      {!hasAccess && (
        <Lock className="h-3 w-3 text-destructive flex-shrink-0" />
      )}
    </button>
  );

  if (!hasAccess) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>{content}</TooltipTrigger>
          <TooltipContent side="right">
            <p className="text-xs">
              🔒 Accesso negato
              {requiredRoles && (
                <span className="block text-xs text-muted-foreground mt-1">
                  {requiredRoles.length === 1 ? "Ruolo richiesto" : "Ruoli richiesti"}: {requiredRoles
                    .map((code) => {
                      const translations: Record<string, string> = {
                        SUPER_ADMIN: "Super Amministratore",
                        ORG_ADMIN: "Amministratore",
                        CISO: "CISO",
                        AUDITOR: "Auditor",
                        PROCESS_OWNER: "Process Owner",
                        EMPLOYEE: "Dipendente",
                        EXTERNAL_AUDITOR: "Auditor Esterno",
                      };
                      return translations[code] || code;
                    })
                    .join(", ")}
                </span>
              )}
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return content;
}
