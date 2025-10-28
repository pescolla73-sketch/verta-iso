-- Enhanced Asset Inventory Schema for ISO 27001 Compliance

-- Drop existing table to recreate with new schema
DROP TABLE IF EXISTS public.assets CASCADE;

-- Create enhanced assets table
CREATE TABLE public.assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organization(id),
  
  -- Basic Info
  asset_id VARCHAR(20) UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  
  -- Classification
  asset_type TEXT NOT NULL,
  category TEXT,
  
  -- Criticality & Security
  criticality TEXT NOT NULL DEFAULT 'Medio',
  confidentiality TEXT DEFAULT 'Interno',
  integrity_required BOOLEAN DEFAULT true,
  availability_required BOOLEAN DEFAULT true,
  
  -- Ownership
  owner TEXT,
  department TEXT,
  location TEXT,
  
  -- Technical Details
  vendor TEXT,
  version TEXT,
  license_info TEXT,
  purchase_date DATE,
  warranty_expiry DATE,
  
  -- Related Controls
  related_controls TEXT[],
  
  -- Status
  status TEXT DEFAULT 'Attivo',
  notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT unique_org_asset_id UNIQUE(organization_id, asset_id)
);

-- Create indexes for performance
CREATE INDEX idx_assets_org ON public.assets(organization_id);
CREATE INDEX idx_assets_type ON public.assets(asset_type);
CREATE INDEX idx_assets_criticality ON public.assets(criticality);
CREATE INDEX idx_assets_status ON public.assets(status);

-- Enable RLS
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Everyone can view assets"
  ON public.assets
  FOR SELECT
  USING (true);

CREATE POLICY "Admins and auditors can manage assets"
  ON public.assets
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'auditor'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_assets_updated_at
  BEFORE UPDATE ON public.assets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();