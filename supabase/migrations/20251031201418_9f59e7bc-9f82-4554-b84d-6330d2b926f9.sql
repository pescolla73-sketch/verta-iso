-- Fix security issue: Set search_path for generate_incident_id function
DROP FUNCTION IF EXISTS generate_incident_id() CASCADE;

CREATE OR REPLACE FUNCTION generate_incident_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.incident_id IS NULL OR NEW.incident_id = '' THEN
    NEW.incident_id := 'INC-' || TO_CHAR(NOW(), 'YYYY') || '-' || 
                       LPAD(CAST(EXTRACT(EPOCH FROM NOW())::INTEGER % 10000 AS TEXT), 4, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public;