import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Permission {
  resource: string;
  action: string;
}

interface UserRole {
  role_code: string;
  role_name: string;
}

// Matrice permessi per ruolo
const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  SUPER_ADMIN: [
    { resource: '*', action: '*' }, // Accesso totale
  ],
  ORG_ADMIN: [
    { resource: 'users', action: '*' },
    { resource: 'roles', action: 'read' },
    { resource: 'organizations', action: '*' },
    { resource: 'policies', action: '*' },
    { resource: 'procedures', action: '*' },
    { resource: 'documents', action: '*' },
    { resource: 'risks', action: '*' },
    { resource: 'assets', action: '*' },
    { resource: 'controls', action: '*' },
    { resource: 'soa', action: '*' },
    { resource: 'trainings', action: '*' },
    { resource: 'incidents', action: '*' },
    { resource: 'audits', action: '*' },
    { resource: 'non_conformities', action: '*' },
    { resource: 'improvements', action: '*' },
    { resource: 'management_review', action: '*' },
    { resource: 'certification_audits', action: '*' },
  ],
  CISO: [
    { resource: 'policies', action: 'read' },
    { resource: 'policies', action: 'create' },
    { resource: 'policies', action: 'update' },
    { resource: 'procedures', action: 'read' },
    { resource: 'procedures', action: 'create' },
    { resource: 'procedures', action: 'update' },
    { resource: 'documents', action: 'read' },
    { resource: 'documents', action: 'create' },
    { resource: 'documents', action: 'update' },
    { resource: 'risks', action: '*' },
    { resource: 'assets', action: '*' },
    { resource: 'controls', action: '*' },
    { resource: 'soa', action: '*' },
    { resource: 'trainings', action: '*' },
    { resource: 'incidents', action: '*' },
    { resource: 'audits', action: '*' },
    { resource: 'non_conformities', action: '*' },
    { resource: 'improvements', action: '*' },
    { resource: 'management_review', action: '*' },
  ],
  AUDITOR: [
    { resource: 'audits', action: '*' },
    { resource: 'non_conformities', action: 'read' },
    { resource: 'non_conformities', action: 'create' },
    { resource: 'policies', action: 'read' },
    { resource: 'procedures', action: 'read' },
    { resource: 'documents', action: 'read' },
    { resource: 'risks', action: 'read' },
    { resource: 'assets', action: 'read' },
    { resource: 'controls', action: 'read' },
    { resource: 'soa', action: 'read' },
    { resource: 'trainings', action: 'read' },
    { resource: 'incidents', action: 'read' },
    { resource: 'improvements', action: 'read' },
    { resource: 'management_review', action: 'read' },
    { resource: 'certification_audits', action: 'read' },
  ],
  PROCESS_OWNER: [
    { resource: 'assets', action: 'read' },
    { resource: 'assets', action: 'create' },
    { resource: 'assets', action: 'update' },
    { resource: 'trainings', action: 'read' },
    { resource: 'trainings', action: 'create' },
    { resource: 'trainings', action: 'update' },
    { resource: 'incidents', action: '*' },
    { resource: 'improvements', action: 'read' },
    { resource: 'improvements', action: 'create' },
    { resource: 'improvements', action: 'update' },
    { resource: 'policies', action: 'read' },
    { resource: 'procedures', action: 'read' },
    { resource: 'controls', action: 'read' },
    { resource: 'risks', action: 'read' },
  ],
  EMPLOYEE: [
    { resource: 'policies', action: 'read' },
    { resource: 'procedures', action: 'read' },
    { resource: 'trainings', action: 'read' },
    { resource: 'incidents', action: 'read' },
    { resource: 'incidents', action: 'create' },
    { resource: 'controls', action: 'read' },
  ],
  EXTERNAL_AUDITOR: [
    { resource: 'policies', action: 'read' },
    { resource: 'procedures', action: 'read' },
    { resource: 'documents', action: 'read' },
    { resource: 'risks', action: 'read' },
    { resource: 'assets', action: 'read' },
    { resource: 'controls', action: 'read' },
    { resource: 'soa', action: 'read' },
    { resource: 'audits', action: 'read' },
    { resource: 'non_conformities', action: 'read' },
    { resource: 'certification_audits', action: 'read' },
  ],
};

export function usePermissions() {
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserRoles();
  }, []);

  const loadUserRoles = async () => {
    try {
      // In DEMO mode, assegna ORG_ADMIN di default
      // TODO: Quando implementi auth, carica ruoli utente reale

      const demoRole: UserRole = {
        role_code: 'EMPLOYEE',
        role_name: 'Employee',
      };

      setUserRoles([demoRole]);
      setLoading(false);
    } catch (error) {
      console.error('Error loading user roles:', error);
      setLoading(false);
    }
  };

  const hasPermission = (resource: string, action: string): boolean => {
    if (userRoles.length === 0) return false;

    for (const role of userRoles) {
      const permissions = ROLE_PERMISSIONS[role.role_code] || [];

      // Check for wildcard permissions
      if (permissions.some((p) => p.resource === '*' && p.action === '*')) {
        return true;
      }

      // Check for resource wildcard
      if (permissions.some((p) => p.resource === resource && p.action === '*')) {
        return true;
      }

      // Check for exact match
      if (permissions.some((p) => p.resource === resource && p.action === action)) {
        return true;
      }
    }

    return false;
  };

  const canCreate = (resource: string) => hasPermission(resource, 'create');
  const canRead = (resource: string) => hasPermission(resource, 'read');
  const canUpdate = (resource: string) => hasPermission(resource, 'update');
  const canDelete = (resource: string) => hasPermission(resource, 'delete');

  const hasAnyRole = (roleCodes: string[]): boolean => {
    return userRoles.some((role) => roleCodes.includes(role.role_code));
  };

  return {
    userRoles,
    loading,
    hasPermission,
    canCreate,
    canRead,
    canUpdate,
    canDelete,
    hasAnyRole,
  };
}
