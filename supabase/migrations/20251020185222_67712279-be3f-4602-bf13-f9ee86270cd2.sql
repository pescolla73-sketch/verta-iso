-- Add selected organization tracking to profiles
ALTER TABLE public.profiles 
ADD COLUMN selected_organization_id uuid REFERENCES public.organization(id) ON DELETE SET NULL;

-- Create index for better performance
CREATE INDEX idx_profiles_selected_organization ON public.profiles(selected_organization_id);

-- Allow users to update their selected organization
CREATE POLICY "Users can update own selected organization"
ON public.profiles
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);