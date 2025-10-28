-- Make asset_id optional and add scenario risk support
ALTER TABLE risks 
ALTER COLUMN asset_id DROP NOT NULL;

-- Add new fields for scenario risks
ALTER TABLE risks 
ADD COLUMN IF NOT EXISTS risk_type VARCHAR(50) DEFAULT 'asset-specific',
ADD COLUMN IF NOT EXISTS affected_asset_ids UUID[],
ADD COLUMN IF NOT EXISTS scope VARCHAR(100);

-- Add comments
COMMENT ON COLUMN risks.risk_type IS 'Type of risk: asset-specific or scenario';
COMMENT ON COLUMN risks.affected_asset_ids IS 'Array of asset IDs affected by scenario risks';
COMMENT ON COLUMN risks.scope IS 'Scope of impact: Single asset, All IT assets, Entire organization, etc.';