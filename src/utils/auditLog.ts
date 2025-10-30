import { supabase } from "@/integrations/supabase/client";

export type AuditAction = 'create' | 'update' | 'delete' | 'view' | 'export';
export type AuditEntityType = 'control' | 'risk' | 'asset' | 'threat' | 'policy' | 'soa' | 'audit';

interface AuditLogParams {
  action: AuditAction;
  entityType: AuditEntityType;
  entityId?: string;
  entityName?: string;
  oldValues?: any;
  newValues?: any;
  notes?: string;
}

export const logAuditEvent = async (params: AuditLogParams) => {
  try {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.warn('No user found for audit log');
      return;
    }

    // Get organization ID from first organization in database
    const { data: orgData } = await supabase
      .from('organization')
      .select('id')
      .limit(1)
      .maybeSingle();

    if (!orgData) {
      console.warn('No organization found for audit log');
      return;
    }

    // Insert audit log
    const { error } = await supabase
      .from('audit_logs')
      .insert({
        organization_id: orgData.id,
        user_id: user.id,
        user_email: user.email,
        user_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Unknown User',
        action: params.action,
        entity_type: params.entityType,
        entity_id: params.entityId,
        entity_name: params.entityName,
        old_values: params.oldValues || null,
        new_values: params.newValues || null,
        notes: params.notes,
        user_agent: navigator.userAgent,
        timestamp: new Date().toISOString()
      });

    if (error) {
      console.error('Audit log failed:', error);
      // Don't throw - logging failure shouldn't break the app
    } else {
      console.log('✅ Audit event logged:', params.action, params.entityType);
    }
  } catch (err) {
    console.error('Audit logging error:', err);
    // Don't throw - logging failure shouldn't break the app
  }
};
