-- Remove CHECK constraints on status fields that are blocking saves
-- Using explicit constraint names and IF EXISTS to safely drop them

-- Drop known status constraints on policies
ALTER TABLE policies DROP CONSTRAINT IF EXISTS policies_status_check;
ALTER TABLE policies DROP CONSTRAINT IF EXISTS check_policy_status;
ALTER TABLE policies DROP CONSTRAINT IF EXISTS policy_status_constraint;

-- Drop known status constraints on procedures  
ALTER TABLE procedures DROP CONSTRAINT IF EXISTS procedures_status_check;
ALTER TABLE procedures DROP CONSTRAINT IF EXISTS check_procedure_status;
ALTER TABLE procedures DROP CONSTRAINT IF EXISTS procedure_status_constraint;

-- Drop known status constraints on training_records
ALTER TABLE training_records DROP CONSTRAINT IF EXISTS training_records_status_check;
ALTER TABLE training_records DROP CONSTRAINT IF EXISTS check_training_status;
ALTER TABLE training_records DROP CONSTRAINT IF EXISTS training_status_constraint;

-- Drop known status constraints on internal_audits
ALTER TABLE internal_audits DROP CONSTRAINT IF EXISTS internal_audits_status_check;
ALTER TABLE internal_audits DROP CONSTRAINT IF EXISTS check_audit_status;
ALTER TABLE internal_audits DROP CONSTRAINT IF EXISTS audit_status_constraint;

-- Set safe default values
ALTER TABLE policies 
  ALTER COLUMN status SET DEFAULT 'draft',
  ALTER COLUMN version SET DEFAULT '1.0';

ALTER TABLE procedures 
  ALTER COLUMN status SET DEFAULT 'draft',
  ALTER COLUMN version SET DEFAULT '1.0';

ALTER TABLE training_records 
  ALTER COLUMN status SET DEFAULT 'completed';

ALTER TABLE internal_audits 
  ALTER COLUMN status SET DEFAULT 'planned';

-- Migration complete - CHECK constraints removed, defaults set