-- Add user_id column to policies table to track ownership
ALTER TABLE public.policies 
ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add organization_id column to link policies to organizations
ALTER TABLE public.policies 
ADD COLUMN organization_id uuid REFERENCES public.organization(id) ON DELETE SET NULL;

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Admins can manage policies" ON public.policies;
DROP POLICY IF EXISTS "Everyone can view policies" ON public.policies;

-- Allow authenticated users to insert their own policies
CREATE POLICY "Authenticated users can insert policies" 
ON public.policies 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Allow authenticated users to view all policies
CREATE POLICY "Authenticated users can view policies" 
ON public.policies 
FOR SELECT 
TO authenticated
USING (true);

-- Allow users to update their own policies
CREATE POLICY "Users can update own policies" 
ON public.policies 
FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Allow users to delete their own policies
CREATE POLICY "Users can delete own policies" 
ON public.policies 
FOR DELETE 
TO authenticated
USING (auth.uid() = user_id);

-- Allow admins to manage all policies
CREATE POLICY "Admins can manage all policies" 
ON public.policies 
FOR ALL 
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));