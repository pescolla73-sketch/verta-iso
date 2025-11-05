-- PARTE 1: Creazione tabella SoA Items (Statement of Applicability)
CREATE TABLE IF NOT EXISTS public.soa_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  control_reference TEXT NOT NULL,
  control_title TEXT NOT NULL,
  applicability TEXT NOT NULL DEFAULT 'applicable',
  justification TEXT,
  
  -- IMPLEMENTAZIONE
  implementation_status TEXT NOT NULL DEFAULT 'not_implemented',
  implementation_date DATE,
  responsible_person TEXT,
  
  -- VERIFICA AUDIT
  last_audit_date DATE,
  last_audit_result TEXT,
  last_audit_id UUID REFERENCES public.internal_audits(id) ON DELETE SET NULL,
  verified_by TEXT,
  
  -- EVIDENZE
  evidence_documents JSONB DEFAULT '[]'::jsonb,
  
  -- COLLEGAMENTI
  related_risks UUID[],
  related_assets UUID[],
  
  -- METRICHE
  compliance_score INTEGER DEFAULT 0,
  last_review_date DATE,
  next_review_date DATE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  UNIQUE(organization_id, control_reference)
);

-- PARTE 2: Aggiungi colonne a risks per verifica audit
ALTER TABLE public.risks 
ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'not_verified',
ADD COLUMN IF NOT EXISTS last_verification_date DATE,
ADD COLUMN IF NOT EXISTS verification_audit_id UUID REFERENCES public.internal_audits(id) ON DELETE SET NULL;

-- PARTE 3: Aggiungi colonne a controls per storico audit
ALTER TABLE public.controls
ADD COLUMN IF NOT EXISTS last_audit_date DATE,
ADD COLUMN IF NOT EXISTS last_audit_result TEXT,
ADD COLUMN IF NOT EXISTS audit_history JSONB DEFAULT '[]'::jsonb;

-- PARTE 4: Aggiungi colonne a audit_checklist_items per collegamenti
ALTER TABLE public.audit_checklist_items
ADD COLUMN IF NOT EXISTS pre_audit_status TEXT,
ADD COLUMN IF NOT EXISTS source_type TEXT,
ADD COLUMN IF NOT EXISTS evidence_required TEXT,
ADD COLUMN IF NOT EXISTS evidence_found TEXT,
ADD COLUMN IF NOT EXISTS update_linked BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS auto_create_nc BOOLEAN DEFAULT true;

-- PARTE 5: Aggiungi colonne a non_conformities per tracking
ALTER TABLE public.non_conformities
ADD COLUMN IF NOT EXISTS related_control TEXT,
ADD COLUMN IF NOT EXISTS detection_method TEXT,
ADD COLUMN IF NOT EXISTS effectiveness_verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS closure_notes TEXT;

-- PARTE 6: Indici per performance
CREATE INDEX IF NOT EXISTS idx_soa_items_org_id ON public.soa_items(organization_id);
CREATE INDEX IF NOT EXISTS idx_soa_items_control_ref ON public.soa_items(control_reference);
CREATE INDEX IF NOT EXISTS idx_soa_items_status ON public.soa_items(implementation_status);
CREATE INDEX IF NOT EXISTS idx_risks_verification ON public.risks(verification_status);
CREATE INDEX IF NOT EXISTS idx_controls_audit_date ON public.controls(last_audit_date);

-- PARTE 7: Trigger per updated_at su soa_items
CREATE OR REPLACE FUNCTION public.update_soa_items_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER update_soa_items_updated_at
BEFORE UPDATE ON public.soa_items
FOR EACH ROW
EXECUTE FUNCTION public.update_soa_items_updated_at();

-- PARTE 8: RLS Policies per soa_items
ALTER TABLE public.soa_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view soa_items for testing"
ON public.soa_items FOR SELECT
USING (true);

CREATE POLICY "Public can insert soa_items for testing"
ON public.soa_items FOR INSERT
WITH CHECK (true);

CREATE POLICY "Public can update soa_items for testing"
ON public.soa_items FOR UPDATE
USING (true);

CREATE POLICY "Public can delete soa_items for testing"
ON public.soa_items FOR DELETE
USING (true);

-- PARTE 9: Popola soa_items con controlli ISO esistenti
INSERT INTO public.soa_items (
  organization_id,
  control_reference,
  control_title,
  applicability,
  implementation_status,
  compliance_score
)
SELECT 
  (SELECT id FROM public.organization LIMIT 1) as organization_id,
  control_id,
  title,
  CASE 
    WHEN status = 'not_applicable' THEN 'not_applicable'
    ELSE 'applicable'
  END as applicability,
  status as implementation_status,
  CASE 
    WHEN status = 'implemented' THEN 100
    WHEN status = 'partially_implemented' THEN 50
    ELSE 0
  END as compliance_score
FROM public.controls
WHERE NOT EXISTS (
  SELECT 1 FROM public.soa_items 
  WHERE soa_items.control_reference = controls.control_id
)
ON CONFLICT (organization_id, control_reference) DO NOTHING;