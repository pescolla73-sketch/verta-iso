-- Add comprehensive organization fields
ALTER TABLE public.organization 
ADD COLUMN IF NOT EXISTS piva TEXT,
ADD COLUMN IF NOT EXISTS website TEXT,
ADD COLUMN IF NOT EXISTS legal_address_street TEXT,
ADD COLUMN IF NOT EXISTS legal_address_city TEXT,
ADD COLUMN IF NOT EXISTS legal_address_zip TEXT,
ADD COLUMN IF NOT EXISTS legal_address_province TEXT,
ADD COLUMN IF NOT EXISTS legal_address_country TEXT DEFAULT 'Italia',
ADD COLUMN IF NOT EXISTS operational_address_street TEXT,
ADD COLUMN IF NOT EXISTS operational_address_city TEXT,
ADD COLUMN IF NOT EXISTS operational_address_zip TEXT,
ADD COLUMN IF NOT EXISTS operational_address_province TEXT,
ADD COLUMN IF NOT EXISTS operational_address_country TEXT,
ADD COLUMN IF NOT EXISTS isms_scope TEXT,
ADD COLUMN IF NOT EXISTS isms_boundaries TEXT,
ADD COLUMN IF NOT EXISTS contact_email TEXT,
ADD COLUMN IF NOT EXISTS contact_phone TEXT,
ADD COLUMN IF NOT EXISTS contact_pec TEXT;