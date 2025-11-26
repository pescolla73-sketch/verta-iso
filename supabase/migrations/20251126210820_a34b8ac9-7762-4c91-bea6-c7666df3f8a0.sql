-- Tabella Azioni di Miglioramento (Clausola 10.2)
CREATE TABLE IF NOT EXISTS improvement_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
  
  -- Identificazione
  action_code TEXT NOT NULL,
  action_type TEXT NOT NULL CHECK (action_type IN ('corrective', 'preventive', 'improvement')),
  
  -- Origine
  source TEXT NOT NULL CHECK (source IN ('nc', 'audit', 'incident', 'management_review', 'risk_assessment', 'self_identified', 'other')),
  source_id UUID, -- Link a NC, Audit, Incident, etc.
  
  -- Descrizione
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  problem_statement TEXT, -- Descrizione problema (per azioni correttive)
  opportunity_statement TEXT, -- Descrizione opportunità (per azioni preventive)
  
  -- Root Cause (per azioni correttive)
  root_cause_analysis TEXT,
  
  -- Piano d'Azione
  action_plan TEXT NOT NULL,
  expected_benefit TEXT,
  success_criteria TEXT,
  
  -- Responsabilità e Timing
  responsible_person TEXT NOT NULL,
  support_team TEXT,
  start_date DATE,
  target_date DATE NOT NULL,
  completion_date DATE,
  
  -- Risorse
  estimated_effort TEXT,
  estimated_cost DECIMAL(10,2),
  resources_required TEXT,
  
  -- Implementazione
  implementation_notes TEXT,
  implementation_status TEXT DEFAULT 'planned' CHECK (implementation_status IN ('planned', 'in_progress', 'implemented', 'on_hold', 'cancelled')),
  
  -- Verifica Efficacia
  effectiveness_check_date DATE,
  effectiveness_verified BOOLEAN DEFAULT false,
  effectiveness_notes TEXT,
  verified_by TEXT,
  
  -- Stato e Priorità
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'completed', 'verified', 'closed')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('critical', 'high', 'medium', 'low')),
  
  -- Chiusura
  closure_date DATE,
  closure_notes TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID,
  
  UNIQUE(organization_id, action_code)
);

-- Indici
CREATE INDEX IF NOT EXISTS idx_improvement_org ON improvement_actions(organization_id);
CREATE INDEX IF NOT EXISTS idx_improvement_status ON improvement_actions(status);
CREATE INDEX IF NOT EXISTS idx_improvement_type ON improvement_actions(action_type);
CREATE INDEX IF NOT EXISTS idx_improvement_priority ON improvement_actions(priority);
CREATE INDEX IF NOT EXISTS idx_improvement_target_date ON improvement_actions(target_date);
CREATE INDEX IF NOT EXISTS idx_improvement_source ON improvement_actions(source, source_id);

-- RLS Policies
ALTER TABLE improvement_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view improvement actions of their org"
  ON improvement_actions FOR SELECT
  USING (organization_id IN (SELECT id FROM organization LIMIT 1));

CREATE POLICY "Users can insert improvement actions for their org"
  ON improvement_actions FOR INSERT
  WITH CHECK (organization_id IN (SELECT id FROM organization LIMIT 1));

CREATE POLICY "Users can update improvement actions of their org"
  ON improvement_actions FOR UPDATE
  USING (organization_id IN (SELECT id FROM organization LIMIT 1));

CREATE POLICY "Users can delete improvement actions of their org"
  ON improvement_actions FOR DELETE
  USING (organization_id IN (SELECT id FROM organization LIMIT 1));

-- Trigger updated_at
CREATE OR REPLACE FUNCTION update_improvement_actions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER improvement_actions_updated_at
  BEFORE UPDATE ON improvement_actions
  FOR EACH ROW
  EXECUTE FUNCTION update_improvement_actions_updated_at();

-- Funzione auto-generazione codice
CREATE OR REPLACE FUNCTION generate_improvement_code(org_id UUID, action_type_param TEXT)
RETURNS TEXT AS $$
DECLARE
  next_number INTEGER;
  current_year TEXT;
  prefix TEXT;
  new_code TEXT;
BEGIN
  current_year := TO_CHAR(CURRENT_DATE, 'YYYY');
  
  -- Prefisso basato sul tipo
  prefix := CASE action_type_param
    WHEN 'corrective' THEN 'CA-'
    WHEN 'preventive' THEN 'PA-'
    ELSE 'IA-'
  END;
  
  -- Trova numero successivo per tipo e anno
  SELECT COALESCE(
    MAX(CAST(SUBSTRING(action_code FROM prefix || '\d{4}-(\d+)') AS INTEGER)), 
    0
  ) + 1
  INTO next_number
  FROM improvement_actions
  WHERE organization_id = org_id
    AND action_type = action_type_param
    AND action_code LIKE prefix || current_year || '-%';
  
  -- Genera codice: CA-2025-001, PA-2025-001, IA-2025-001
  new_code := prefix || current_year || '-' || LPAD(next_number::TEXT, 3, '0');
  
  RETURN new_code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Commenti
COMMENT ON TABLE improvement_actions IS 'Azioni di Miglioramento Continuo - Clausola 10.2';
COMMENT ON COLUMN improvement_actions.action_type IS 'corrective: Azione Correttiva, preventive: Azione Preventiva, improvement: Miglioramento Generico';
COMMENT ON COLUMN improvement_actions.status IS 'open: Aperta, in_progress: In corso, completed: Completata, verified: Verificata, closed: Chiusa';