-- Re-enable RLS on controls table
ALTER TABLE public.controls ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows anyone (including anonymous users) to read controls
CREATE POLICY "Allow public read access to controls"
ON public.controls
FOR SELECT
TO anon, authenticated
USING (true);

-- Create policies for authenticated admins and auditors
CREATE POLICY "Admins and auditors can update controls"
ON public.controls
FOR UPDATE
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role) OR 
  public.has_role(auth.uid(), 'auditor'::app_role)
);

CREATE POLICY "Admins can insert controls"
ON public.controls
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete controls"
ON public.controls
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));