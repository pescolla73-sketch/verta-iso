-- Add control_id column to evidences table
ALTER TABLE public.evidences 
ADD COLUMN control_id uuid REFERENCES public.controls(id) ON DELETE CASCADE;

-- Create index for better query performance
CREATE INDEX idx_evidences_control_id ON public.evidences(control_id);

-- Create storage bucket for evidences
INSERT INTO storage.buckets (id, name, public) 
VALUES ('evidences', 'evidences', true);

-- Allow public uploads (temporary for testing)
CREATE POLICY "Allow public uploads to evidences bucket"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'evidences');

-- Allow public reads
CREATE POLICY "Allow public reads from evidences bucket"
ON storage.objects
FOR SELECT
USING (bucket_id = 'evidences');

-- Allow public deletes (temporary for testing)
CREATE POLICY "Allow public deletes from evidences bucket"
ON storage.objects
FOR DELETE
USING (bucket_id = 'evidences');

-- Update RLS policies for evidences table to allow public access (temporary)
DROP POLICY IF EXISTS "Authenticated users can upload evidences" ON public.evidences;
DROP POLICY IF EXISTS "Admins can manage all evidences" ON public.evidences;
DROP POLICY IF EXISTS "Everyone can view evidences" ON public.evidences;

-- Allow public insert
CREATE POLICY "Public can insert evidences"
ON public.evidences
FOR INSERT
WITH CHECK (true);

-- Allow public read
CREATE POLICY "Public can view evidences"
ON public.evidences
FOR SELECT
USING (true);

-- Allow public delete
CREATE POLICY "Public can delete evidences"
ON public.evidences
FOR DELETE
USING (true);

-- Allow public update
CREATE POLICY "Public can update evidences"
ON public.evidences
FOR UPDATE
USING (true);