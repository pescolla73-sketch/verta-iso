-- Add new columns for ISO 27001/NIS2 compliance to assets table

-- Technical Data
ALTER TABLE public.assets ADD COLUMN IF NOT EXISTS brand text;
ALTER TABLE public.assets ADD COLUMN IF NOT EXISTS model text;
ALTER TABLE public.assets ADD COLUMN IF NOT EXISTS processor_ram text;
ALTER TABLE public.assets ADD COLUMN IF NOT EXISTS serial_number text;

-- Traceability
ALTER TABLE public.assets ADD COLUMN IF NOT EXISTS asset_status text DEFAULT 'Attivo';
ALTER TABLE public.assets ADD COLUMN IF NOT EXISTS assigned_user_id uuid;
ALTER TABLE public.assets ADD COLUMN IF NOT EXISTS assigned_user_name text;
ALTER TABLE public.assets ADD COLUMN IF NOT EXISTS delivery_date date;
ALTER TABLE public.assets ADD COLUMN IF NOT EXISTS return_date date;

-- Data Evaluation
ALTER TABLE public.assets ADD COLUMN IF NOT EXISTS data_types text[] DEFAULT '{}';
ALTER TABLE public.assets ADD COLUMN IF NOT EXISTS confidentiality_level integer DEFAULT 1;
ALTER TABLE public.assets ADD COLUMN IF NOT EXISTS integrity_level integer DEFAULT 1;
ALTER TABLE public.assets ADD COLUMN IF NOT EXISTS availability_level integer DEFAULT 1;

-- Create table for auto-learning suggestions
CREATE TABLE IF NOT EXISTS public.asset_suggestions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id uuid,
  field_name text NOT NULL,
  field_value text NOT NULL,
  usage_count integer DEFAULT 1,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(organization_id, field_name, field_value)
);

-- Enable RLS on asset_suggestions
ALTER TABLE public.asset_suggestions ENABLE ROW LEVEL SECURITY;

-- RLS policies for asset_suggestions
CREATE POLICY "Public can view asset_suggestions for testing"
ON public.asset_suggestions FOR SELECT
USING (true);

CREATE POLICY "Public can insert asset_suggestions for testing"
ON public.asset_suggestions FOR INSERT
WITH CHECK (true);

CREATE POLICY "Public can update asset_suggestions for testing"
ON public.asset_suggestions FOR UPDATE
USING (true);

CREATE POLICY "Public can delete asset_suggestions for testing"
ON public.asset_suggestions FOR DELETE
USING (true);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_asset_suggestions_field ON public.asset_suggestions(field_name, organization_id);

-- Comment on new columns for documentation
COMMENT ON COLUMN public.assets.brand IS 'Marca del dispositivo/asset';
COMMENT ON COLUMN public.assets.model IS 'Modello del dispositivo/asset';
COMMENT ON COLUMN public.assets.processor_ram IS 'Specifiche processore e RAM';
COMMENT ON COLUMN public.assets.serial_number IS 'Numero seriale univoco';
COMMENT ON COLUMN public.assets.asset_status IS 'Stato asset: Attivo, Magazzino, Dismesso';
COMMENT ON COLUMN public.assets.assigned_user_id IS 'ID utente assegnatario';
COMMENT ON COLUMN public.assets.assigned_user_name IS 'Nome utente assegnatario';
COMMENT ON COLUMN public.assets.delivery_date IS 'Data consegna asset';
COMMENT ON COLUMN public.assets.return_date IS 'Data riconsegna asset';
COMMENT ON COLUMN public.assets.data_types IS 'Tipi di dati trattati: Personali, Sensibili, Finanziari';
COMMENT ON COLUMN public.assets.confidentiality_level IS 'Livello riservatezza 1-5';
COMMENT ON COLUMN public.assets.integrity_level IS 'Livello integrità 1-5';
COMMENT ON COLUMN public.assets.availability_level IS 'Livello disponibilità 1-5';