-- Add document metadata columns to organization table
ALTER TABLE public.organization 
ADD COLUMN IF NOT EXISTS contact_phone text,
ADD COLUMN IF NOT EXISTS legal_address_street text,
ADD COLUMN IF NOT EXISTS legal_address_city text,
ADD COLUMN IF NOT EXISTS legal_address_zip text,
ADD COLUMN IF NOT EXISTS legal_address_province text,
ADD COLUMN IF NOT EXISTS legal_address_country text DEFAULT 'Italia';

-- Add document metadata columns to soa_documents
ALTER TABLE public.soa_documents
ADD COLUMN IF NOT EXISTS document_id text,
ADD COLUMN IF NOT EXISTS issue_date date DEFAULT CURRENT_DATE,
ADD COLUMN IF NOT EXISTS revision_date date DEFAULT CURRENT_DATE,
ADD COLUMN IF NOT EXISTS next_review_date date,
ADD COLUMN IF NOT EXISTS status text DEFAULT 'draft',
ADD COLUMN IF NOT EXISTS classification text DEFAULT 'confidential',
ADD COLUMN IF NOT EXISTS prepared_by text,
ADD COLUMN IF NOT EXISTS approved_by text,
ADD COLUMN IF NOT EXISTS approval_date date;

-- Create index on document_id for quick lookups
CREATE INDEX IF NOT EXISTS idx_soa_documents_document_id ON public.soa_documents(document_id);