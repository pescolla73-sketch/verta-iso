-- Remove foreign key constraint on audit_logs.user_id to allow demo mode logging

-- Drop the foreign key constraint that's causing the violation
ALTER TABLE audit_logs 
DROP CONSTRAINT IF EXISTS audit_logs_user_id_fkey;

-- Make user_id nullable (allow system/demo logs without authenticated users)
ALTER TABLE audit_logs 
ALTER COLUMN user_id DROP NOT NULL;

-- Add index for performance (without FK constraint)
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id) WHERE user_id IS NOT NULL;

-- Update RLS policy to explicitly allow inserts even without user_id
DROP POLICY IF EXISTS "Allow audit log inserts" ON audit_logs;
CREATE POLICY "Allow audit log inserts"
ON audit_logs FOR INSERT
WITH CHECK (true);