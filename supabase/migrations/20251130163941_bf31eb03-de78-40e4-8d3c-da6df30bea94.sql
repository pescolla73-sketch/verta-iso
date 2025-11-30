-- Tabella Documenti Controllati
CREATE TABLE IF NOT EXISTS controlled_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
  
  -- Identificazione Documento
  document_code TEXT NOT NULL,
  document_title TEXT NOT NULL,
  document_type TEXT NOT NULL CHECK (document_type IN ('policy', 'procedure', 'instruction', 'form', 'plan', 'report', 'other')),
  document_category TEXT,
  
  -- Versione Corrente
  current_version TEXT NOT NULL DEFAULT '1.0',
  version_date DATE NOT NULL DEFAULT CURRENT_DATE,
  
  -- Stato Documento
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'review', 'approved', 'active', 'obsolete', 'archived')),
  
  -- Ownership e Responsabilità
  document_owner TEXT NOT NULL,
  approver TEXT,
  reviewer TEXT,
  
  -- Approvazione
  approval_date DATE,
  approval_notes TEXT,
  
  -- Review Scheduling
  review_frequency_months INTEGER DEFAULT 12,
  next_review_date DATE,
  last_review_date DATE,
  
  -- Location e Access
  document_location TEXT,
  access_level TEXT DEFAULT 'internal' CHECK (access_level IN ('public', 'internal', 'confidential', 'restricted')),
  
  -- Descrizione e Note
  description TEXT,
  purpose TEXT,
  scope TEXT,
  notes TEXT,
  
  -- Collegamenti
  related_policy_id UUID REFERENCES policies(id),
  related_procedure_id UUID REFERENCES procedures(id),
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID,
  
  UNIQUE(organization_id, document_code)
);

-- Tabella Versioni Documento (Storico)
CREATE TABLE IF NOT EXISTS document_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES controlled_documents(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
  
  -- Versione
  version_number TEXT NOT NULL,
  version_date DATE NOT NULL DEFAULT CURRENT_DATE,
  
  -- Cambiamenti
  change_summary TEXT NOT NULL,
  change_type TEXT NOT NULL CHECK (change_type IN ('major', 'minor', 'correction', 'initial')),
  change_reason TEXT,
  
  -- Approvazione Versione
  approved_by TEXT,
  approval_date DATE,
  
  -- Contenuto/Location
  file_url TEXT,
  file_size INTEGER,
  file_hash TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID,
  
  UNIQUE(document_id, version_number)
);

-- Tabella Change Requests (Richieste di Modifica)
CREATE TABLE IF NOT EXISTS document_change_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES controlled_documents(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
  
  -- Richiesta
  request_code TEXT NOT NULL,
  request_date DATE NOT NULL DEFAULT CURRENT_DATE,
  requested_by TEXT NOT NULL,
  
  -- Descrizione Modifica
  change_description TEXT NOT NULL,
  change_justification TEXT NOT NULL,
  urgency TEXT DEFAULT 'normal' CHECK (urgency IN ('low', 'normal', 'high', 'critical')),
  
  -- Stato Richiesta
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'implemented', 'cancelled')),
  
  -- Review e Approvazione
  reviewed_by TEXT,
  review_date DATE,
  review_notes TEXT,
  decision TEXT,
  decision_date DATE,
  
  -- Implementazione
  implementation_date DATE,
  new_version_id UUID REFERENCES document_versions(id),
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(organization_id, request_code)
);

-- Indici
CREATE INDEX IF NOT EXISTS idx_doc_org ON controlled_documents(organization_id);
CREATE INDEX IF NOT EXISTS idx_doc_status ON controlled_documents(status);
CREATE INDEX IF NOT EXISTS idx_doc_type ON controlled_documents(document_type);
CREATE INDEX IF NOT EXISTS idx_doc_review_date ON controlled_documents(next_review_date);
CREATE INDEX IF NOT EXISTS idx_doc_version_doc ON document_versions(document_id);
CREATE INDEX IF NOT EXISTS idx_doc_change_doc ON document_change_requests(document_id);
CREATE INDEX IF NOT EXISTS idx_doc_change_status ON document_change_requests(status);

-- RLS Policies
ALTER TABLE controlled_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_change_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view documents of their org"
  ON controlled_documents FOR SELECT
  USING (organization_id IN (SELECT id FROM organization LIMIT 1));

CREATE POLICY "Users can insert documents for their org"
  ON controlled_documents FOR INSERT
  WITH CHECK (organization_id IN (SELECT id FROM organization LIMIT 1));

CREATE POLICY "Users can update documents of their org"
  ON controlled_documents FOR UPDATE
  USING (organization_id IN (SELECT id FROM organization LIMIT 1));

CREATE POLICY "Users can delete documents of their org"
  ON controlled_documents FOR DELETE
  USING (organization_id IN (SELECT id FROM organization LIMIT 1));

CREATE POLICY "Users can view versions of their org"
  ON document_versions FOR SELECT
  USING (organization_id IN (SELECT id FROM organization LIMIT 1));

CREATE POLICY "Users can insert versions for their org"
  ON document_versions FOR INSERT
  WITH CHECK (organization_id IN (SELECT id FROM organization LIMIT 1));

CREATE POLICY "Users can view change requests of their org"
  ON document_change_requests FOR SELECT
  USING (organization_id IN (SELECT id FROM organization LIMIT 1));

CREATE POLICY "Users can insert change requests for their org"
  ON document_change_requests FOR INSERT
  WITH CHECK (organization_id IN (SELECT id FROM organization LIMIT 1));

CREATE POLICY "Users can update change requests of their org"
  ON document_change_requests FOR UPDATE
  USING (organization_id IN (SELECT id FROM organization LIMIT 1));

CREATE POLICY "Users can delete change requests of their org"
  ON document_change_requests FOR DELETE
  USING (organization_id IN (SELECT id FROM organization LIMIT 1));

-- Triggers
CREATE OR REPLACE FUNCTION update_controlled_documents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER controlled_documents_updated_at
  BEFORE UPDATE ON controlled_documents
  FOR EACH ROW
  EXECUTE FUNCTION update_controlled_documents_updated_at();

CREATE TRIGGER document_change_requests_updated_at
  BEFORE UPDATE ON document_change_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_controlled_documents_updated_at();

-- Funzione auto-generazione codici documenti
CREATE OR REPLACE FUNCTION generate_document_code(org_id UUID, doc_type TEXT)
RETURNS TEXT AS $$
DECLARE
  next_number INTEGER;
  prefix TEXT;
  new_code TEXT;
BEGIN
  prefix := CASE doc_type
    WHEN 'policy' THEN 'DOC-POL-'
    WHEN 'procedure' THEN 'DOC-PROC-'
    WHEN 'instruction' THEN 'DOC-INST-'
    WHEN 'form' THEN 'DOC-FORM-'
    WHEN 'plan' THEN 'DOC-PLAN-'
    WHEN 'report' THEN 'DOC-REP-'
    ELSE 'DOC-'
  END;
  
  SELECT COALESCE(
    MAX(CAST(SUBSTRING(document_code FROM prefix || '(\d+)') AS INTEGER)), 
    0
  ) + 1
  INTO next_number
  FROM controlled_documents
  WHERE organization_id = org_id
    AND document_code LIKE prefix || '%';
  
  new_code := prefix || LPAD(next_number::TEXT, 3, '0');
  
  RETURN new_code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Funzione auto-generazione codici change request
CREATE OR REPLACE FUNCTION generate_change_request_code(org_id UUID)
RETURNS TEXT AS $$
DECLARE
  next_number INTEGER;
  current_year TEXT;
  new_code TEXT;
BEGIN
  current_year := TO_CHAR(CURRENT_DATE, 'YYYY');
  
  SELECT COALESCE(
    MAX(CAST(SUBSTRING(request_code FROM 'CR-\d{4}-(\d+)') AS INTEGER)), 
    0
  ) + 1
  INTO next_number
  FROM document_change_requests
  WHERE organization_id = org_id
    AND request_code LIKE 'CR-' || current_year || '-%';
  
  new_code := 'CR-' || current_year || '-' || LPAD(next_number::TEXT, 3, '0');
  
  RETURN new_code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Commenti
COMMENT ON TABLE controlled_documents IS 'Registro Documenti Controllati - Clausola 7.5';
COMMENT ON TABLE document_versions IS 'Storico Versioni Documenti';
COMMENT ON TABLE document_change_requests IS 'Richieste di Modifica Documenti';