-- Fix RLS policies to allow public UPDATE for DEMO mode

-- Add public UPDATE policy for policies table
DROP POLICY IF EXISTS "Public can update policies for testing" ON public.policies;
CREATE POLICY "Public can update policies for testing"
  ON public.policies
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

-- Add public UPDATE policy for procedures table (already has insert/select/delete but missing update check)
-- The existing "Public can update procedures for testing" has WITH CHECK missing, let's ensure it's complete
DROP POLICY IF EXISTS "Public can update procedures for testing" ON public.procedures;
CREATE POLICY "Public can update procedures for testing"
  ON public.procedures
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

-- Add public UPDATE policy for training_records table
DROP POLICY IF EXISTS "Public can update training records for testing" ON public.training_records;
CREATE POLICY "Public can update training records for testing"
  ON public.training_records
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

-- Add public UPDATE policy for internal_audits table
DROP POLICY IF EXISTS "Public can update internal_audits for testing" ON public.internal_audits;
CREATE POLICY "Public can update internal_audits for testing"
  ON public.internal_audits
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);