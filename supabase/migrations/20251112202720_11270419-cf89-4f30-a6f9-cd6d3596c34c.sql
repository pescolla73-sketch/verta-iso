-- Drop conflicting user_id based policies that don't match the data model
DROP POLICY IF EXISTS "Users can update own policies" ON public.policies;
DROP POLICY IF EXISTS "Users can delete own policies" ON public.policies;

-- Ensure clean public policies for DEMO mode on policies table
DROP POLICY IF EXISTS "Public can view all policies for testing" ON public.policies;
DROP POLICY IF EXISTS "Public can insert policies for testing" ON public.policies;
DROP POLICY IF EXISTS "Public can update policies for testing" ON public.policies;
DROP POLICY IF EXISTS "Public can delete policies for testing" ON public.policies;

CREATE POLICY "Public can view all policies for testing"
  ON public.policies FOR SELECT TO public
  USING (true);

CREATE POLICY "Public can insert policies for testing"
  ON public.policies FOR INSERT TO public
  WITH CHECK (true);

CREATE POLICY "Public can update policies for testing"
  ON public.policies FOR UPDATE TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Public can delete policies for testing"
  ON public.policies FOR DELETE TO public
  USING (true);

-- Same for procedures table
DROP POLICY IF EXISTS "Public can view procedures for testing" ON public.procedures;
DROP POLICY IF EXISTS "Public can insert procedures for testing" ON public.procedures;
DROP POLICY IF EXISTS "Public can update procedures for testing" ON public.procedures;
DROP POLICY IF EXISTS "Public can delete procedures for testing" ON public.procedures;

CREATE POLICY "Public can view procedures for testing"
  ON public.procedures FOR SELECT TO public
  USING (true);

CREATE POLICY "Public can insert procedures for testing"
  ON public.procedures FOR INSERT TO public
  WITH CHECK (true);

CREATE POLICY "Public can update procedures for testing"
  ON public.procedures FOR UPDATE TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Public can delete procedures for testing"
  ON public.procedures FOR DELETE TO public
  USING (true);

-- Same for training_records table
DROP POLICY IF EXISTS "Public can view training records for testing" ON public.training_records;
DROP POLICY IF EXISTS "Public can insert training records for testing" ON public.training_records;
DROP POLICY IF EXISTS "Public can update training records for testing" ON public.training_records;
DROP POLICY IF EXISTS "Public can delete training records for testing" ON public.training_records;

CREATE POLICY "Public can view training records for testing"
  ON public.training_records FOR SELECT TO public
  USING (true);

CREATE POLICY "Public can insert training records for testing"
  ON public.training_records FOR INSERT TO public
  WITH CHECK (true);

CREATE POLICY "Public can update training records for testing"
  ON public.training_records FOR UPDATE TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Public can delete training records for testing"
  ON public.training_records FOR DELETE TO public
  USING (true);

-- Same for internal_audits table
DROP POLICY IF EXISTS "Public can view internal_audits for testing" ON public.internal_audits;
DROP POLICY IF EXISTS "Public can insert internal_audits for testing" ON public.internal_audits;
DROP POLICY IF EXISTS "Public can update internal_audits for testing" ON public.internal_audits;
DROP POLICY IF EXISTS "Public can delete internal_audits for testing" ON public.internal_audits;

CREATE POLICY "Public can view internal_audits for testing"
  ON public.internal_audits FOR SELECT TO public
  USING (true);

CREATE POLICY "Public can insert internal_audits for testing"
  ON public.internal_audits FOR INSERT TO public
  WITH CHECK (true);

CREATE POLICY "Public can update internal_audits for testing"
  ON public.internal_audits FOR UPDATE TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Public can delete internal_audits for testing"
  ON public.internal_audits FOR DELETE TO public
  USING (true);