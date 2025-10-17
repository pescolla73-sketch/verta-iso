-- Drop the restrictive update policy
DROP POLICY IF EXISTS "Admins and auditors can update controls" ON public.controls;

-- Create a new policy that allows authenticated users to update controls
CREATE POLICY "Authenticated users can update controls"
ON public.controls
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Also allow anonymous users to update for testing (remove this in production)
CREATE POLICY "Allow public updates for testing"
ON public.controls
FOR UPDATE
TO anon
USING (true)
WITH CHECK (true);