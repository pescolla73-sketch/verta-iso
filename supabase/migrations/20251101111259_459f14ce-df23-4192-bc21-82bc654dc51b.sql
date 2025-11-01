-- Fix search_path warning for generate_policy_id function
CREATE OR REPLACE FUNCTION generate_policy_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.policy_id IS NULL OR NEW.policy_id = '' THEN
    NEW.policy_id := 'POL-' || LPAD(
      (SELECT COALESCE(MAX(CAST(SUBSTRING(policy_id FROM 5) AS INTEGER)), 0) + 1
       FROM policies 
       WHERE organization_id = NEW.organization_id 
       AND policy_id IS NOT NULL)::TEXT, 
      3, '0'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public;