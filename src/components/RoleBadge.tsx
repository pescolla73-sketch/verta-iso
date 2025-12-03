import { usePermissions } from "@/hooks/usePermissions";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { Shield } from "lucide-react";

const ROLE_TRANSLATIONS: Record<string, string> = {
  SUPER_ADMIN: "Super Amministratore",
  ORG_ADMIN: "Amministratore Organizzazione",
  CISO: "CISO / Responsabile Sicurezza",
  AUDITOR: "Auditor Interno",
  PROCESS_OWNER: "Responsabile Processo",
  EMPLOYEE: "Dipendente",
  EXTERNAL_AUDITOR: "Auditor Esterno",
};
export function RoleBadge() {
  const { userRoles, loading } = usePermissions();

  if (loading || userRoles.length === 0) return null;

  const getRoleVariant = (roleCode: string): BadgeProps["variant"] => {
    switch (roleCode) {
      case "SUPER_ADMIN":
        return "destructive";
      case "ORG_ADMIN":
        return "default";
      case "CISO":
        return "secondary";
      case "AUDITOR":
        return "secondary";
      case "PROCESS_OWNER":
        return "outline";
      case "EMPLOYEE":
        return "outline";
      case "EXTERNAL_AUDITOR":
        return "outline";
      default:
        return "outline";
    }
  };

  return (
    <div className="flex items-center gap-2 text-xs md:text-sm text-muted-foreground">
      <Shield className="h-4 w-4" />
      {userRoles.map((role) => (
        <Badge
          key={role.role_code}
          variant={getRoleVariant(role.role_code)}
          className="uppercase tracking-wide"
        >
          {ROLE_TRANSLATIONS[role.role_code] || role.role_name}
        </Badge>
      ))}
    </div>
  );
}
