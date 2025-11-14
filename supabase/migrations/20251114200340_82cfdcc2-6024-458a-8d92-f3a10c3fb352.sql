-- Add new columns for hybrid architecture to policies table

-- 1. Add columns for auto-generated sections (READ-ONLY in frontend)
ALTER TABLE public.policies
ADD COLUMN IF NOT EXISTS generated_scope TEXT,
ADD COLUMN IF NOT EXISTS generated_controls JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS generated_roles JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS generated_compliance TEXT,
ADD COLUMN IF NOT EXISTS generated_references TEXT;

-- 2. Add columns for custom editable sections
ALTER TABLE public.policies
ADD COLUMN IF NOT EXISTS custom_purpose TEXT,
ADD COLUMN IF NOT EXISTS custom_policy_statement TEXT,
ADD COLUMN IF NOT EXISTS custom_procedures TEXT,
ADD COLUMN IF NOT EXISTS custom_exceptions TEXT,
ADD COLUMN IF NOT EXISTS custom_notes TEXT;

-- 3. Add metadata columns
ALTER TABLE public.policies
ADD COLUMN IF NOT EXISTS last_auto_update TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS is_legacy BOOLEAN DEFAULT false;

-- 4. Migrate existing data
-- Mark all existing policies as legacy
UPDATE public.policies
SET is_legacy = true
WHERE custom_purpose IS NULL;

-- Migrate existing fields to new custom fields
UPDATE public.policies
SET 
  custom_purpose = purpose,
  custom_policy_statement = policy_statement,
  custom_procedures = procedures
WHERE purpose IS NOT NULL AND custom_purpose IS NULL;

-- 5. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_policies_organization_id ON public.policies(organization_id);
CREATE INDEX IF NOT EXISTS idx_policies_policy_type ON public.policies(policy_type);
CREATE INDEX IF NOT EXISTS idx_policies_status ON public.policies(status);
CREATE INDEX IF NOT EXISTS idx_policies_is_legacy ON public.policies(is_legacy);