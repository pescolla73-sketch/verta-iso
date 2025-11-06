import { supabase } from '@/integrations/supabase/client';

interface AuditTrailEntry {
  organizationId: string;
  module: string;
  action: 'create' | 'update' | 'delete' | 'approve' | 'verify' | 'close';
  entityType: string;
  entityId: string;
  entityName: string;
  changes?: {
    field: string;
    oldValue: any;
    newValue: any;
    reason?: string;
  }[];
  triggeredBy?: string;
  linkedEntityType?: string;
  linkedEntityId?: string;
  linkedEntityName?: string;
  description?: string;
}

export const logAuditTrail = async (entry: AuditTrailEntry) => {
  try {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();

    const auditEntry = {
      organization_id: entry.organizationId,
      user_id: user?.id || null,
      user_email: user?.email || 'system',
      user_name: user?.user_metadata?.name || user?.email || 'System',
      module: entry.module,
      action: entry.action,
      entity_type: entry.entityType,
      entity_id: entry.entityId,
      entity_name: entry.entityName,
      changes: entry.changes || null,
      triggered_by: entry.triggeredBy || 'manual',
      linked_entity_type: entry.linkedEntityType || null,
      linked_entity_id: entry.linkedEntityId || null,
      linked_entity_name: entry.linkedEntityName || null,
      description: entry.description || generateDescription(entry),
      user_agent: navigator.userAgent
    };

    const { error } = await supabase
      .from('audit_trail')
      .insert([auditEntry]);

    if (error) {
      console.error('❌ Audit trail error:', error);
    } else {
      console.log('✅ Audit trail logged:', entry.entityName);
    }
  } catch (error) {
    console.error('❌ Audit trail exception:', error);
  }
};

const generateDescription = (entry: AuditTrailEntry): string => {
  const actionLabels = {
    create: 'creato',
    update: 'aggiornato',
    delete: 'eliminato',
    approve: 'approvato',
    verify: 'verificato',
    close: 'chiuso'
  };

  let desc = `${entry.entityType} "${entry.entityName}" ${actionLabels[entry.action]}`;

  if (entry.changes && entry.changes.length > 0) {
    const changesDesc = entry.changes.map(c => 
      `${c.field}: ${c.oldValue} → ${c.newValue}`
    ).join(', ');
    desc += ` (${changesDesc})`;
  }

  if (entry.triggeredBy && entry.triggeredBy !== 'manual') {
    desc += ` via ${entry.triggeredBy}`;
  }

  if (entry.linkedEntityName) {
    desc += ` tramite ${entry.linkedEntityName}`;
  }

  return desc;
};

// Helper per confrontare oggetti e estrarre changes
export const extractChanges = (oldObj: any, newObj: any, fields: string[]) => {
  const changes = [];
  
  for (const field of fields) {
    if (oldObj[field] !== newObj[field]) {
      changes.push({
        field,
        oldValue: oldObj[field],
        newValue: newObj[field]
      });
    }
  }
  
  return changes;
};
