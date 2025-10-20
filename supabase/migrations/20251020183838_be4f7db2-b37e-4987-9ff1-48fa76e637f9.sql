-- TEMPORARY: Allow public INSERT for testing policy generator
-- TODO: Remove this and require proper authentication before production

DROP POLICY IF EXISTS "Authenticated users can insert policies" ON public.policies;

-- Allow anyone to insert policies temporarily for testing
CREATE POLICY "Public can insert policies temporarily" 
ON public.policies 
FOR INSERT 
TO public
WITH CHECK (true);

-- Keep existing policies for SELECT, UPDATE, DELETE
-- (Already have "Authenticated users can view policies", "Users can update own policies", etc.)