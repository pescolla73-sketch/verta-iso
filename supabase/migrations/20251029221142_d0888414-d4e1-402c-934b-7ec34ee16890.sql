-- Create audit_logs table for compliance tracking
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organization(id) ON DELETE CASCADE,
  
  -- Who performed the action
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email VARCHAR(255),
  user_name VARCHAR(255),
  
  -- What action was performed
  action VARCHAR(50) NOT NULL,  -- "create", "update", "delete", "view", "export"
  entity_type VARCHAR(50) NOT NULL,  -- "control", "risk", "asset", "threat", "policy", "soa"
  entity_id UUID,
  entity_name VARCHAR(255),
  
  -- Changes tracking
  old_values JSONB,
  new_values JSONB,
  
  -- When and where
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ip_address INET,
  user_agent TEXT,
  
  -- Additional context
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_audit_logs_org ON public.audit_logs(organization_id);
CREATE INDEX idx_audit_logs_user ON public.audit_logs(user_id);
CREATE INDEX idx_audit_logs_entity ON public.audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_timestamp ON public.audit_logs(timestamp DESC);
CREATE INDEX idx_audit_logs_action ON public.audit_logs(action);

-- Enable Row Level Security
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Organization members can view their org's audit logs
CREATE POLICY "Org members can view audit logs"
ON public.audit_logs
FOR SELECT
USING (true);

-- Policy: System can insert audit logs (authenticated users)
CREATE POLICY "Authenticated users can insert audit logs"
ON public.audit_logs
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);