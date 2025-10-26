-- Add justification column to controls table for ISO 27001 compliance
-- Required when status is 'not_applicable'
ALTER TABLE public.controls
ADD COLUMN justification TEXT;

COMMENT ON COLUMN public.controls.justification IS 'Mandatory justification for controls marked as Not Applicable (ISO 27001 requirement)';