-- =====================================================
-- ASSET-RISK LINKAGE - Approccio Semplificato
-- =====================================================

-- Indici per performance (asset_id già esiste nella tabella risks)
CREATE INDEX IF NOT EXISTS idx_risks_asset_id ON risks(asset_id);
CREATE INDEX IF NOT EXISTS idx_risks_auto_generated ON risks(auto_generated);
CREATE INDEX IF NOT EXISTS idx_assets_criticality ON assets(criticality);

-- Vista semplice asset critici con count rischi
CREATE OR REPLACE VIEW critical_assets_summary AS
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