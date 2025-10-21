-- Drop the existing authenticated users policy
DROP POLICY IF EXISTS "Authenticated users can view policies" ON public.policies;

-- Create new public read policy for testing
CREATE POLICY "Public can view all policies for testing"
ON public.policies
FOR SELECT
USING (true);

-- Also update the insert policy to be public (already exists but making sure)
DROP POLICY IF EXISTS "Public can insert policies temporarily" ON public.policies;

CREATE POLICY "Public can insert policies for testing"
ON public.policies
FOR INSERT
WITH CHECK (true);