-- STEP 1: Aggiungi campi mancanti per ISO compliance
ALTER TABLE non_conformities
ADD COLUMN IF NOT EXISTS nc_date DATE DEFAULT CURRENT_DATE,
ADD COLUMN IF NOT EXISTS affected_clause TEXT,
ADD COLUMN IF NOT EXISTS evidence TEXT,
ADD COLUMN IF NOT EXISTS root_cause_analysis TEXT,
ADD COLUMN IF NOT EXISTS corrective_action TEXT,
ADD COLUMN IF NOT EXISTS responsible_person TEXT,
ADD COLUMN IF NOT EXISTS deadline DATE,
ADD COLUMN IF NOT EXISTS implementation_date DATE,
ADD COLUMN IF NOT EXISTS implementation_notes TEXT,
ADD COLUMN IF NOT EXISTS verified_by TEXT,
ADD COLUMN IF NOT EXISTS verification_date DATE,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Aggiungi indici per performance
CREATE INDEX IF NOT EXISTS idx_nc_organization ON non_conformities(organization_id);
CREATE INDEX IF NOT EXISTS idx_nc_status ON non_conformities(status);
CREATE INDEX IF NOT EXISTS idx_nc_severity ON non_conformities(severity);
CREATE INDEX IF NOT EXISTS idx_nc_deadline ON non_conformities(deadline);

-- STEP 2: Trigger per updated_at
CREATE OR REPLACE FUNCTION update_non_conformities_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS non_conformities_updated_at ON non_conformities;
CREATE TRIGGER non_conformities_updated_at
  BEFORE UPDATE ON non_conformities
  FOR EACH ROW
  EXECUTE FUNCTION update_non_conformities_updated_at();

-- Funzione per auto-generazione codice NC (formato: NC-2025-0001)
CREATE OR REPLACE FUNCTION generate_nc_code(org_id UUID)
RETURNS TEXT AS $$
DECLARE
  next_number INTEGER;
  current_year TEXT;
  new_code TEXT;
BEGIN
  current_year := TO_CHAR(CURRENT_DATE, 'YYYY');
  
  -- Trova il numero più alto per l'anno corrente
  SELECT COALESCE(
    MAX(CAST(SUBSTRING(nc_code FROM 'NC-\d{4}-(\d+)') AS INTEGER)), 
    0
  ) + 1
  INTO next_number
  FROM non_conformities
  WHERE organization_id = org_id
    AND nc_code LIKE 'NC-' || current_year || '-%';
  
  -- Genera codice formato: NC-2025-0001
  new_code := 'NC-' || current_year || '-' || LPAD(next_number::TEXT, 4, '0');
  
  RETURN new_code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;