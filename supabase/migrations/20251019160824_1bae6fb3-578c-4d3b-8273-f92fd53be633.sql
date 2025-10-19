-- Create organization table to store company information
CREATE TABLE IF NOT EXISTS public.organization (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  sector text,
  scope text,
  ciso text,
  dpo text,
  ceo text,
  cto text,
  it_manager text,
  help_desk_manager text,
  hr_manager text,
  responsabile_paghe text,
  system_administrator text,
  backup_operator text,
  incident_response_manager text,
  communication_manager text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.organization ENABLE ROW LEVEL SECURITY;

-- Allow everyone to read organization data
CREATE POLICY "Everyone can view organization"
ON public.organization
FOR SELECT
USING (true);

-- Only admins can manage organization data
CREATE POLICY "Admins can manage organization"
ON public.organization
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add trigger for updated_at
CREATE TRIGGER update_organization_updated_at
BEFORE UPDATE ON public.organization
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default organization data (can be updated later via UI)
INSERT INTO public.organization (name, sector, scope, ciso, dpo, ceo, cto)
VALUES (
  'Organizzazione di esempio',
  'Tecnologia',
  'Sede principale e uffici remoti',
  'Marco Rossi',
  'Laura Bianchi',
  'Giuseppe Verdi',
  'Anna Russo'
);