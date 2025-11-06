-- SoA: traccia ultimo audit
ALTER TABLE soa_items ADD COLUMN IF NOT EXISTS last_audit_date DATE;
ALTER TABLE soa_items ADD COLUMN IF NOT EXISTS last_audit_result TEXT;
ALTER TABLE soa_items ADD COLUMN IF NOT EXISTS last_audit_id UUID REFERENCES internal_audits(id);
ALTER TABLE soa_items ADD COLUMN IF NOT EXISTS verified_by TEXT;
ALTER TABLE soa_items ADD COLUMN IF NOT EXISTS compliance_score INTEGER DEFAULT 0;

-- Risks: traccia verifica audit
ALTER TABLE risks ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'not_verified';
ALTER TABLE risks ADD COLUMN IF NOT EXISTS last_verification_date DATE;
ALTER TABLE risks ADD COLUMN IF NOT EXISTS verification_audit_id UUID REFERENCES internal_audits(id);

-- Audit checklist: aggiungi flag aggiornamento
ALTER TABLE audit_checklist_items ADD COLUMN IF NOT EXISTS update_linked BOOLEAN DEFAULT true;
ALTER TABLE audit_checklist_items ADD COLUMN IF NOT EXISTS pre_audit_status TEXT;
ALTER TABLE audit_checklist_items ADD COLUMN IF NOT EXISTS source_type TEXT;
ALTER TABLE audit_checklist_items ADD COLUMN IF NOT EXISTS evidence_required TEXT;

-- Internal audits: aggiungi data completamento
ALTER TABLE internal_audits ADD COLUMN IF NOT EXISTS completed_date DATE;

-- Non conformities: aggiungi campi audit
ALTER TABLE non_conformities ADD COLUMN IF NOT EXISTS source_type TEXT;
ALTER TABLE non_conformities ADD COLUMN IF NOT EXISTS detected_date DATE;