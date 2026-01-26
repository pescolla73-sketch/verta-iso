-- Add responsible_role_id column to asset_tests for linking tests to roles/mansioni
ALTER TABLE public.asset_tests 
ADD COLUMN IF NOT EXISTS responsible_role_id UUID REFERENCES public.roles(id) ON DELETE SET NULL;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_asset_tests_responsible_role ON public.asset_tests(responsible_role_id);

-- Comment for documentation
COMMENT ON COLUMN public.asset_tests.responsible_role_id IS 'Links the test to a specific role/mansione responsible for execution';