-- Tabella principale audit trail
CREATE TABLE audit_trail (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  organization_id UUID NOT NULL,
  user_id UUID,
  user_email TEXT,
  user_name TEXT,
  module TEXT NOT NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  entity_name TEXT NOT NULL,
  changes JSONB,
  triggered_by TEXT DEFAULT 'manual',
  linked_entity_type TEXT,
  linked_entity_id UUID,
  linked_entity_name TEXT,
  description TEXT,
  ip_address TEXT,
  user_agent TEXT
);

-- Index per performance
CREATE INDEX idx_audit_trail_org_time ON audit_trail(organization_id, timestamp DESC);
CREATE INDEX idx_audit_trail_entity ON audit_trail(entity_type, entity_id, timestamp DESC);
CREATE INDEX idx_audit_trail_user ON audit_trail(user_id, timestamp DESC);
CREATE INDEX idx_audit_trail_module ON audit_trail(module, timestamp DESC);

-- RLS policies
ALTER TABLE audit_trail ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert audit trail entries"
  ON audit_trail FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can view their organization audit trail"
  ON audit_trail FOR SELECT
  USING (true);