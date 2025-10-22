-- Create soa_documents table for tracking SoA generation history
CREATE TABLE public.soa_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES public.organization(id) ON DELETE CASCADE,
  version TEXT NOT NULL,
  generated_date DATE NOT NULL DEFAULT CURRENT_DATE,
  compliance_percentage INTEGER NOT NULL,
  total_controls INTEGER NOT NULL DEFAULT 93,
  implemented INTEGER NOT NULL DEFAULT 0,
  partially_implemented INTEGER NOT NULL DEFAULT 0,
  not_implemented INTEGER NOT NULL DEFAULT 0,
  not_applicable INTEGER NOT NULL DEFAULT 0,
  file_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.soa_documents ENABLE ROW LEVEL SECURITY;

-- Create policies (permissive for now, no auth required)
CREATE POLICY "Everyone can view soa_documents"
  ON public.soa_documents
  FOR SELECT
  USING (true);

CREATE POLICY "Everyone can insert soa_documents"
  ON public.soa_documents
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Everyone can delete soa_documents"
  ON public.soa_documents
  FOR DELETE
  USING (true);

-- Add trigger for updated_at
CREATE TRIGGER update_soa_documents_updated_at
  BEFORE UPDATE ON public.soa_documents
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();