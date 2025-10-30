-- Update RLS policy to allow demo mode audit logging

-- Drop existing restrictive policy
DROP POLICY IF EXISTS "Authenticated users can insert audit logs" ON audit_logs;

-- Create permissive policy that works in demo mode
CREATE POLICY "Allow audit log inserts"
ON audit_logs FOR INSERT
WITH CHECK (true);

-- Keep the existing view policy
-- Users can view all logs (already exists: "Org members can view audit logs")