-- Create threat library table for EU/NIS2/ISO 27001:2022 compliant risk assessment
CREATE TABLE IF NOT EXISTS threat_library (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Identification
  threat_id VARCHAR(20) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  name_en VARCHAR(255),
  description TEXT NOT NULL,
  
  -- Categorization (aligned with NIS2 Article 21)
  category VARCHAR(50) NOT NULL,
  nis2_incident_type VARCHAR(100),
  iso27001_controls TEXT[],
  
  -- Industry relevance (EU NACE sectors)
  relevant_sectors TEXT[],
  
  -- Risk baselines
  typical_probability INTEGER CHECK (typical_probability BETWEEN 1 AND 5),
  typical_impact INTEGER CHECK (typical_impact BETWEEN 1 AND 5),
  
  -- Custom threats
  is_custom BOOLEAN DEFAULT false,
  organization_id UUID,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE threat_library ENABLE ROW LEVEL SECURITY;

-- Policies: Everyone can view global threats, only creators can manage custom threats
CREATE POLICY "Everyone can view global threats"
  ON threat_library FOR SELECT
  USING (is_custom = false OR organization_id IS NULL);

CREATE POLICY "Users can view their custom threats"
  ON threat_library FOR SELECT
  USING (is_custom = true AND organization_id IS NOT NULL);

CREATE POLICY "Users can create custom threats"
  ON threat_library FOR INSERT
  WITH CHECK (is_custom = true);

CREATE POLICY "Users can update their custom threats"
  ON threat_library FOR UPDATE
  USING (is_custom = true);

CREATE POLICY "Users can delete their custom threats"
  ON threat_library FOR DELETE
  USING (is_custom = true);

-- Add sector field to organization table
ALTER TABLE organization 
ADD COLUMN IF NOT EXISTS nace_sector VARCHAR(100),
ADD COLUMN IF NOT EXISTS applicable_regulations TEXT[];

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_threat_library_category ON threat_library(category);
CREATE INDEX IF NOT EXISTS idx_threat_library_sectors ON threat_library USING GIN(relevant_sectors);
CREATE INDEX IF NOT EXISTS idx_threat_library_custom ON threat_library(is_custom, organization_id) WHERE is_custom = true;