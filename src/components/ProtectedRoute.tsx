import type { ReactNode } from 'react';
import { usePermissions } from '@/hooks/usePermissions';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ShieldAlert } from 'lucide-react';

interface ProtectedRouteProps {
  children: ReactNode;
  resource?: string;
  action?: string;
  requiredRoles?: string[];
  fallback?: ReactNode;
}

export function ProtectedRoute({
  children,
  resource,
  action = 'read',
  requiredRoles,
  fallback,
}: ProtectedRouteProps) {
  const { hasPermission, hasAnyRole, loading } = usePermissions();

  if (loading) {
    return <div className="flex items-center justify-center p-8">Caricamento...</div>;
  }

  // Check role-based access
  if (requiredRoles && !hasAnyRole(requiredRoles)) {
    return (
      fallback || (
        <div className="container mx-auto p-6">
          <Alert variant="destructive">
            <ShieldAlert className="h-4 w-4" />
            <AlertTitle>Accesso Negato</AlertTitle>
            <AlertDescription>
              Non hai i permessi necessari per accedere a questa pagina.
              Ruoli richiesti: {requiredRoles.join(', ')}
            </AlertDescription>
          </Alert>
        </div>
      )
    );
  }

  // Check resource/action permission
  if (resource && !hasPermission(resource, action)) {
    return (
      fallback || (
        <div className="container mx-auto p-6">
          <Alert variant="destructive">
            <ShieldAlert className="h-4 w-4" />
            <AlertTitle>Accesso Negato</AlertTitle>
            <AlertDescription>
              Non hai i permessi necessari per {action} su {resource}.
            </AlertDescription>
          </Alert>
        </div>
      )
    );
  }

  return <>{children}</>;
}
