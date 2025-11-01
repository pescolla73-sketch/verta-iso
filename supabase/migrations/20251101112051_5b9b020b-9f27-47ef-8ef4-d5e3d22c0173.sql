-- First, update existing rows to use 'custom' for any non-matching values
UPDATE policies 
SET policy_type = 'custom' 
WHERE policy_type NOT IN ('security', 'privacy', 'access_control', 'incident_response', 'business_continuity', 'other');

-- Drop the old constraint
ALTER TABLE policies DROP CONSTRAINT policies_policy_type_check;

-- Add new constraint with expanded values
ALTER TABLE policies 
  ADD CONSTRAINT policies_policy_type_check 
  CHECK (policy_type IN ('security', 'privacy', 'access_control', 'incident_response', 'business_continuity', 'other', 'mandatory', 'recommended', 'custom'));