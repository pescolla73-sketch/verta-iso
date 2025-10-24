-- Add permissive policy to allow public updates for testing
CREATE POLICY "Allow public updates for testing"
ON public.organization
FOR UPDATE
USING (true)
WITH CHECK (true);