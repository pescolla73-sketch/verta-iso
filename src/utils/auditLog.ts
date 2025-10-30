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
    // Get current user (or use demo user if not authenticated)
    const { data: { user } } = await supabase.auth.getUser();
    
    // Get organization ID from first organization in database
    const { data: orgData } = await supabase
      .from('organization')
      .select('id')
      .limit(1)
      .maybeSingle();

    if (!orgData) {
      console.warn('⚠️ No organization found for audit log');
      return;
    }

    // Use demo user data if not authenticated (for demo mode)
    const userId = user?.id || '00000000-0000-0000-0000-000000000000';
    const userEmail = user?.email || 'demo@example.com';
    const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Demo User';

    console.log('📝 Logging audit event:', {
      action: params.action,
      entityType: params.entityType,
      entityName: params.entityName,
      user: userName
    });

    // Insert audit log
    const { error } = await supabase
      .from('audit_logs')
      .insert({
        organization_id: orgData.id,
        user_id: userId,
        user_email: userEmail,
        user_name: userName,
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
      console.error('❌ Audit log failed:', error);
      // Don't throw - logging failure shouldn't break the app
    } else {
      console.log('✅ Audit event logged successfully:', params.action, params.entityType);
    }
  } catch (err) {
    console.error('❌ Audit logging exception:', err);
    // Don't throw - logging failure shouldn't break the app
  }
};
