-- Security incidents table
CREATE TABLE IF NOT EXISTS security_incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organization(id),
  
  -- Incident identification
  incident_id VARCHAR(50) NOT NULL UNIQUE,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  
  -- Classification
  severity VARCHAR(20) NOT NULL, -- 'critical', 'high', 'medium', 'low'
  category VARCHAR(50) NOT NULL, -- 'data_breach', 'malware', 'unauthorized_access', 'ddos', 'phishing', 'physical', 'other'
  nis2_incident_type VARCHAR(100), -- Link to NIS2 types
  
  -- Impact
  affected_assets TEXT[],
  affected_users_count INTEGER,
  data_compromised BOOLEAN DEFAULT false,
  estimated_impact VARCHAR(20), -- 'critical', 'high', 'medium', 'low', 'minimal'
  financial_impact_eur DECIMAL(12,2),
  
  -- Timeline
  detected_at TIMESTAMPTZ NOT NULL,
  reported_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ,
  
  -- Response
  status VARCHAR(30) DEFAULT 'open', -- 'open', 'investigating', 'contained', 'resolved', 'closed'
  assigned_to VARCHAR(255),
  response_team TEXT[],
  immediate_actions TEXT,
  containment_actions TEXT,
  eradication_actions TEXT,
  recovery_actions TEXT,
  
  -- Root cause & lessons learned
  root_cause TEXT,
  lessons_learned TEXT,
  preventive_actions TEXT,
  
  -- Reporting
  reported_to_authorities BOOLEAN DEFAULT false,
  authority_reference VARCHAR(255),
  reported_to_dpo BOOLEAN DEFAULT false,
  
  -- Related
  related_controls UUID[],
  related_risks UUID[],
  
  -- Metadata
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_incidents_org ON security_incidents(organization_id);
CREATE INDEX idx_incidents_severity ON security_incidents(severity);
CREATE INDEX idx_incidents_status ON security_incidents(status);
CREATE INDEX idx_incidents_detected ON security_incidents(detected_at DESC);

-- Auto-generate incident ID
CREATE OR REPLACE FUNCTION generate_incident_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.incident_id IS NULL OR NEW.incident_id = '' THEN
    NEW.incident_id := 'INC-' || TO_CHAR(NOW(), 'YYYY') || '-' || 
                       LPAD(CAST(EXTRACT(EPOCH FROM NOW())::INTEGER % 10000 AS TEXT), 4, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_incident_id
  BEFORE INSERT ON security_incidents
  FOR EACH ROW
  EXECUTE FUNCTION generate_incident_id();

-- Update timestamp trigger
CREATE TRIGGER update_security_incidents_updated_at
  BEFORE UPDATE ON security_incidents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE security_incidents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view incidents for testing"
ON security_incidents FOR SELECT
USING (true);

CREATE POLICY "Public can insert incidents for testing"
ON security_incidents FOR INSERT
WITH CHECK (true);

CREATE POLICY "Public can update incidents for testing"
ON security_incidents FOR UPDATE
USING (true);

CREATE POLICY "Public can delete incidents for testing"
ON security_incidents FOR DELETE
USING (true);