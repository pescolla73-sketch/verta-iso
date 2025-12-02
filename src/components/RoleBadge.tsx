import { usePermissions } from "@/hooks/usePermissions";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { Shield } from "lucide-react";

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
          {role.role_name}
        </Badge>
      ))}
    </div>
  );
}
