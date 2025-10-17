-- Temporarily disable RLS on controls table for testing
ALTER TABLE public.controls DISABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Everyone can view controls" ON public.controls;
DROP POLICY IF EXISTS "Admins and auditors can update controls" ON public.controls;
DROP POLICY IF EXISTS "Admins can delete controls" ON public.controls;
DROP POLICY IF EXISTS "Admins can insert controls" ON public.controls;