-- Add logo_url column to organization table
ALTER TABLE public.organization
ADD COLUMN IF NOT EXISTS logo_url TEXT;

-- Create storage bucket for organization logos
INSERT INTO storage.buckets (id, name, public)
VALUES ('organization-logos', 'organization-logos', true)
ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for logo uploads
CREATE POLICY "Anyone can view logos"
ON storage.objects FOR SELECT
USING (bucket_id = 'organization-logos');

CREATE POLICY "Anyone can upload logos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'organization-logos');

CREATE POLICY "Anyone can update logos"
ON storage.objects FOR UPDATE
USING (bucket_id = 'organization-logos');

CREATE POLICY "Anyone can delete logos"
ON storage.objects FOR DELETE
USING (bucket_id = 'organization-logos');