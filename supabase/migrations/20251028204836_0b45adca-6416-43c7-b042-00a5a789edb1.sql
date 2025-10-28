-- Fix Asset RLS Policies for Testing/Demo Mode

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Everyone can view assets" ON public.assets;
DROP POLICY IF EXISTS "Admins and auditors can manage assets" ON public.assets;

-- Create permissive policies for testing (similar to controls table)
CREATE POLICY "Public can view all assets for testing"
  ON public.assets
  FOR SELECT
  USING (true);

CREATE POLICY "Public can insert assets for testing"
  ON public.assets
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Public can update assets for testing"
  ON public.assets
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Public can delete assets for testing"
  ON public.assets
  FOR DELETE
  USING (true);