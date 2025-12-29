-- Fix Security Definer View issue
-- Drop and recreate view with SECURITY INVOKER
DROP VIEW IF EXISTS critical_assets_summary;

CREATE VIEW critical_assets_summary 
WITH (security_invoker = true) AS
SELECT 
  a.id as asset_id,
  a.name as asset_name,
  a.asset_type,
  a.owner,
  a.criticality,
  a.confidentiality,
  a.integrity_required,
  a.availability_required,
  COUNT(r.id) as related_risks_count,
  a.organization_id
FROM assets a
LEFT JOIN risks r ON r.asset_id = a.id
WHERE a.criticality IN ('Critico', 'Alto')
GROUP BY a.id;

COMMENT ON VIEW critical_assets_summary IS 'Vista asset critici con count rischi associati';