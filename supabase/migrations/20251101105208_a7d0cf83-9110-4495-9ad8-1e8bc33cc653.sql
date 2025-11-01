-- Add new columns to policies table for enhanced policy management
ALTER TABLE public.policies 
ADD COLUMN IF NOT EXISTS template_id text,
ADD COLUMN IF NOT EXISTS iso_reference text[],
ADD COLUMN IF NOT EXISTS nis2_reference text[],
ADD COLUMN IF NOT EXISTS next_review_date date,
ADD COLUMN IF NOT EXISTS sections jsonb,
ADD COLUMN IF NOT EXISTS category text DEFAULT 'custom';

-- Update status column to use proper enum-like values
-- (keeping it as text for flexibility but documenting valid values)
COMMENT ON COLUMN public.policies.status IS 'Valid values: draft, in_review, approved, archived';

-- Add index for faster template lookups
CREATE INDEX IF NOT EXISTS idx_policies_template_id ON public.policies(template_id);
CREATE INDEX IF NOT EXISTS idx_policies_status ON public.policies(status);

-- Create policy_versions table for version history
CREATE TABLE IF NOT EXISTS public.policy_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  policy_id uuid REFERENCES public.policies(id) ON DELETE CASCADE NOT NULL,
  version text NOT NULL,
  content text,
  sections jsonb,
  changed_by uuid REFERENCES auth.users(id),
  change_description text,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(policy_id, version)
);

-- Enable RLS on policy_versions
ALTER TABLE public.policy_versions ENABLE ROW LEVEL SECURITY;

-- Policy for viewing versions
CREATE POLICY "Users can view policy versions"
ON public.policy_versions FOR SELECT
USING (true);

-- Policy for creating versions
CREATE POLICY "Users can create policy versions"
ON public.policy_versions FOR INSERT
WITH CHECK (true);

-- Add trigger to auto-create version on policy update
CREATE OR REPLACE FUNCTION public.create_policy_version()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'UPDATE' AND OLD.content IS DISTINCT FROM NEW.content) THEN
    INSERT INTO public.policy_versions (
      policy_id,
      version,
      content,
      sections,
      changed_by,
      change_description
    ) VALUES (
      NEW.id,
      OLD.version,
      OLD.content,
      OLD.sections,
      auth.uid(),
      'Auto-saved version before update'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER create_policy_version_trigger
  BEFORE UPDATE ON public.policies
  FOR EACH ROW
  EXECUTE FUNCTION public.create_policy_version();