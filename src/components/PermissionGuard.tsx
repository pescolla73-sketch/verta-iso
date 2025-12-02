import type { ReactNode } from 'react';
import { usePermissions } from '@/hooks/usePermissions';

interface PermissionGuardProps {
  children: ReactNode;
  resource?: string;
  action?: string;
  requiredRoles?: string[];
  fallback?: ReactNode;
}

export function PermissionGuard({
  children,
  resource,
  action = 'read',
  requiredRoles,
  fallback = null,
}: PermissionGuardProps) {
  const { hasPermission, hasAnyRole } = usePermissions();

  // Check role-based access
  if (requiredRoles && !hasAnyRole(requiredRoles)) {
    return <>{fallback}</>;
  }

  // Check resource/action permission
  if (resource && !hasPermission(resource, action)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
