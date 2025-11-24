-- Drop existing policies first to avoid conflicts
DROP POLICY IF EXISTS "Public can manage certification_audits for testing" ON certification_audits;
DROP POLICY IF EXISTS "Public can manage certifier_findings for testing" ON certifier_findings;

-- ALTER certification_audits table to add new columns
ALTER TABLE certification_audits 
  ADD COLUMN IF NOT EXISTS audit_code TEXT,
  ADD COLUMN IF NOT EXISTS audit_end_date DATE,
  ADD COLUMN IF NOT EXISTS certification_body TEXT,
  ADD COLUMN IF NOT EXISTS lead_auditor TEXT,
  ADD COLUMN IF NOT EXISTS audit_team TEXT,
  ADD COLUMN IF NOT EXISTS audit_scope TEXT,
  ADD COLUMN IF NOT EXISTS standards TEXT DEFAULT 'ISO/IEC 27001:2022',
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'scheduled',
  ADD COLUMN IF NOT EXISTS audit_result TEXT,
  ADD COLUMN IF NOT EXISTS major_findings_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS minor_findings_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS observations_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS certificate_number TEXT,
  ADD COLUMN IF NOT EXISTS certificate_issue_date DATE,
  ADD COLUMN IF NOT EXISTS certificate_expiry_date DATE,
  ADD COLUMN IF NOT EXISTS audit_report_url TEXT,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS created_by UUID;

-- Rename/migrate existing columns if needed
UPDATE certification_audits SET certification_body = certifier_name WHERE certification_body IS NULL AND certifier_name IS NOT NULL;
UPDATE certification_audits SET audit_result = outcome WHERE audit_result IS NULL AND outcome IS NOT NULL;
UPDATE certification_audits SET audit_report_url = report_url WHERE audit_report_url IS NULL AND report_url IS NOT NULL;

-- Add constraints to certification_audits
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'certification_audits_audit_type_check'
  ) THEN
    ALTER TABLE certification_audits 
      ADD CONSTRAINT certification_audits_audit_type_check 
      CHECK (audit_type IN ('stage1', 'stage2', 'surveillance', 'recertification', 'special'));
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'certification_audits_status_check'
  ) THEN
    ALTER TABLE certification_audits 
      ADD CONSTRAINT certification_audits_status_check 
      CHECK (status IN ('scheduled', 'in_progress', 'completed', 'certificate_issued'));
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'certification_audits_audit_result_check'
  ) THEN
    ALTER TABLE certification_audits 
      ADD CONSTRAINT certification_audits_audit_result_check 
      CHECK (audit_result IN ('passed', 'passed_with_nc', 'failed', 'pending'));
  END IF;
END $$;

-- ALTER certifier_findings table to add new columns
ALTER TABLE certifier_findings
  ADD COLUMN IF NOT EXISTS audit_id UUID,
  ADD COLUMN IF NOT EXISTS finding_code TEXT,
  ADD COLUMN IF NOT EXISTS finding_type TEXT,
  ADD COLUMN IF NOT EXISTS iso_clause TEXT,
  ADD COLUMN IF NOT EXISTS iso_control TEXT,
  ADD COLUMN IF NOT EXISTS organization_response TEXT,
  ADD COLUMN IF NOT EXISTS evidence_provided TEXT,
  ADD COLUMN IF NOT EXISTS response_deadline DATE,
  ADD COLUMN IF NOT EXISTS closed_date DATE,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Migrate data from old to new columns
UPDATE certifier_findings SET audit_id = certification_audit_id WHERE audit_id IS NULL AND certification_audit_id IS NOT NULL;
UPDATE certifier_findings SET finding_type = severity WHERE finding_type IS NULL AND severity IS NOT NULL;
UPDATE certifier_findings SET organization_response = required_action WHERE organization_response IS NULL AND required_action IS NOT NULL;

-- Add foreign key for audit_id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'certifier_findings_audit_id_fkey'
  ) THEN
    ALTER TABLE certifier_findings 
      ADD CONSTRAINT certifier_findings_audit_id_fkey 
      FOREIGN KEY (audit_id) REFERENCES certification_audits(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Add constraints to certifier_findings
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'certifier_findings_finding_type_check'
  ) THEN
    ALTER TABLE certifier_findings 
      ADD CONSTRAINT certifier_findings_finding_type_check 
      CHECK (finding_type IN ('major', 'minor', 'observation'));
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'certifier_findings_status_check'
  ) THEN
    ALTER TABLE certifier_findings 
      ADD CONSTRAINT certifier_findings_status_check 
      CHECK (status IN ('open', 'responded', 'accepted', 'closed'));
  END IF;
END $$;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_cert_audit_org ON certification_audits(organization_id);
CREATE INDEX IF NOT EXISTS idx_cert_audit_date ON certification_audits(audit_date);
CREATE INDEX IF NOT EXISTS idx_cert_audit_status ON certification_audits(status);
CREATE INDEX IF NOT EXISTS idx_cert_finding_audit ON certifier_findings(audit_id);
CREATE INDEX IF NOT EXISTS idx_cert_finding_type ON certifier_findings(finding_type);
CREATE INDEX IF NOT EXISTS idx_cert_finding_status ON certifier_findings(status);

-- Create new RLS policies
CREATE POLICY "Users can view certification audits of their org"
  ON certification_audits FOR SELECT
  USING (organization_id IN (SELECT id FROM organization LIMIT 1));

CREATE POLICY "Users can insert certification audits for their org"
  ON certification_audits FOR INSERT
  WITH CHECK (organization_id IN (SELECT id FROM organization LIMIT 1));

CREATE POLICY "Users can update certification audits of their org"
  ON certification_audits FOR UPDATE
  USING (organization_id IN (SELECT id FROM organization LIMIT 1));

CREATE POLICY "Users can delete certification audits of their org"
  ON certification_audits FOR DELETE
  USING (organization_id IN (SELECT id FROM organization LIMIT 1));

CREATE POLICY "Users can view certifier findings of their org"
  ON certifier_findings FOR SELECT
  USING (organization_id IN (SELECT id FROM organization LIMIT 1));

CREATE POLICY "Users can insert certifier findings for their org"
  ON certifier_findings FOR INSERT
  WITH CHECK (organization_id IN (SELECT id FROM organization LIMIT 1));

CREATE POLICY "Users can update certifier findings of their org"
  ON certifier_findings FOR UPDATE
  USING (organization_id IN (SELECT id FROM organization LIMIT 1));

CREATE POLICY "Users can delete certifier findings of their org"
  ON certifier_findings FOR DELETE
  USING (organization_id IN (SELECT id FROM organization LIMIT 1));

-- Create trigger function for updated_at
CREATE OR REPLACE FUNCTION update_certification_audits_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create triggers
DROP TRIGGER IF EXISTS certification_audits_updated_at ON certification_audits;
CREATE TRIGGER certification_audits_updated_at
  BEFORE UPDATE ON certification_audits
  FOR EACH ROW
  EXECUTE FUNCTION update_certification_audits_updated_at();

DROP TRIGGER IF EXISTS certifier_findings_updated_at ON certifier_findings;
CREATE TRIGGER certifier_findings_updated_at
  BEFORE UPDATE ON certifier_findings
  FOR EACH ROW
  EXECUTE FUNCTION update_certification_audits_updated_at();

-- Create function for auto-generating audit codes
CREATE OR REPLACE FUNCTION generate_audit_code(org_id UUID)
RETURNS TEXT AS $$
DECLARE
  next_number INTEGER;
  current_year TEXT;
  new_code TEXT;
BEGIN
  current_year := TO_CHAR(CURRENT_DATE, 'YYYY');
  
  SELECT COALESCE(
    MAX(CAST(SUBSTRING(audit_code FROM 'AUDIT-\d{4}-(\d+)') AS INTEGER)), 
    0
  ) + 1
  INTO next_number
  FROM certification_audits
  WHERE organization_id = org_id
    AND audit_code LIKE 'AUDIT-' || current_year || '-%';
  
  new_code := 'AUDIT-' || current_year || '-' || LPAD(next_number::TEXT, 3, '0');
  
  RETURN new_code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Add table comments
COMMENT ON TABLE certification_audits IS 'Audit di certificazione esterni ISO 27001';
COMMENT ON TABLE certifier_findings IS 'Finding rilevati dagli auditor esterni';