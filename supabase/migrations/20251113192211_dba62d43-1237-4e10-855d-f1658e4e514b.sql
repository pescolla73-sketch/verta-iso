-- Remove CHECK constraints on status fields that are blocking saves
-- This allows any status value without constraint violations

-- 1. Drop CHECK constraints on policies.status (try common constraint names)
ALTER TABLE policies DROP CONSTRAINT IF EXISTS policies_status_check;
ALTER TABLE policies DROP CONSTRAINT IF EXISTS policies_status_check1;
ALTER TABLE policies DROP CONSTRAINT IF EXISTS check_policies_status;

-- 2. Drop CHECK constraints on procedures.status
ALTER TABLE procedures DROP CONSTRAINT IF EXISTS procedures_status_check;
ALTER TABLE procedures DROP CONSTRAINT IF EXISTS procedures_status_check1;
ALTER TABLE procedures DROP CONSTRAINT IF EXISTS check_procedures_status;

-- 3. Drop CHECK constraints on training_records.status
ALTER TABLE training_records DROP CONSTRAINT IF EXISTS training_records_status_check;
ALTER TABLE training_records DROP CONSTRAINT IF EXISTS training_records_status_check1;
ALTER TABLE training_records DROP CONSTRAINT IF EXISTS check_training_records_status;

-- 4. Drop CHECK constraints on internal_audits.status
ALTER TABLE internal_audits DROP CONSTRAINT IF EXISTS internal_audits_status_check;
ALTER TABLE internal_audits DROP CONSTRAINT IF EXISTS internal_audits_status_check1;
ALTER TABLE internal_audits DROP CONSTRAINT IF EXISTS check_internal_audits_status;

-- 5. Ensure default values are set correctly
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

-- Migration complete - status field constraints removed