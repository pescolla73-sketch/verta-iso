-- Create non_conformities table if not exists (needed for linking)
CREATE TABLE IF NOT EXISTS non_conformities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  nc_code TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  source TEXT,
  source_id UUID,
  severity TEXT NOT NULL,
  status TEXT DEFAULT 'open',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  closed_at TIMESTAMPTZ
);

ALTER TABLE non_conformities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can manage non_conformities for testing"
  ON non_conformities
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Create internal_audits table
CREATE TABLE internal_audits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  audit_code TEXT NOT NULL,
  audit_type TEXT NOT NULL,
  audit_scope TEXT NOT NULL,
  audit_date DATE NOT NULL,
  planned_date DATE,
  auditor_name TEXT NOT NULL,
  auditee_name TEXT,
  status TEXT NOT NULL DEFAULT 'planned',
  objective TEXT,
  conclusion TEXT,
  overall_result TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE internal_audits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can manage internal_audits for testing"
  ON internal_audits
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Create audit_checklist_items table
CREATE TABLE audit_checklist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_id UUID REFERENCES internal_audits(id) ON DELETE CASCADE,
  control_reference TEXT NOT NULL,
  control_title TEXT NOT NULL,
  requirement TEXT NOT NULL,
  evidence_found TEXT,
  audit_notes TEXT,
  result TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE audit_checklist_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can manage audit_checklist_items for testing"
  ON audit_checklist_items
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Create audit_findings table if not exists and add columns
CREATE TABLE IF NOT EXISTS audit_findings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  severity TEXT NOT NULL,
  control_reference TEXT,
  status TEXT DEFAULT 'open',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE audit_findings ADD COLUMN IF NOT EXISTS audit_id UUID REFERENCES internal_audits(id);
ALTER TABLE audit_findings ADD COLUMN IF NOT EXISTS recommended_action TEXT;

ALTER TABLE audit_findings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can manage audit_findings for testing" ON audit_findings;
CREATE POLICY "Public can manage audit_findings for testing"
  ON audit_findings
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Create certification_audits table
CREATE TABLE certification_audits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  audit_type TEXT NOT NULL,
  audit_date DATE NOT NULL,
  certifier_name TEXT NOT NULL,
  report_url TEXT,
  outcome TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE certification_audits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can manage certification_audits for testing"
  ON certification_audits
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Create certifier_findings table
CREATE TABLE certifier_findings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  certification_audit_id UUID REFERENCES certification_audits(id),
  organization_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  severity TEXT NOT NULL,
  required_action TEXT,
  status TEXT DEFAULT 'open',
  linked_nc_id UUID REFERENCES non_conformities(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE certifier_findings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can manage certifier_findings for testing"
  ON certifier_findings
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Create update trigger for internal_audits
CREATE TRIGGER update_internal_audits_updated_at
  BEFORE UPDATE ON internal_audits
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();