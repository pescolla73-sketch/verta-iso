-- Add quality_manager column if it doesn't exist
ALTER TABLE organization
ADD COLUMN IF NOT EXISTS quality_manager TEXT;

COMMENT ON COLUMN organization.quality_manager IS 'Responsabile Qualità';