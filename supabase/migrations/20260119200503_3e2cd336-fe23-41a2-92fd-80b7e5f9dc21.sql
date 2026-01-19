
-- Rimuovi la policy che causa ricorsione (user_has_role interroga organization_users)
DROP POLICY IF EXISTS "Admins can manage users" ON public.organization_users;

-- Crea nuova policy per admin usando un approccio diretto senza ricorsione
-- Usiamo una funzione security definer che bypassa completamente RLS
CREATE OR REPLACE FUNCTION public.is_org_admin_direct()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM organization_users ou
    JOIN user_roles ur ON ur.user_id = ou.id
    JOIN roles r ON r.id = ur.role_id
    WHERE ou.auth_user_id = auth.uid()
      AND r.role_code IN ('SUPER_ADMIN', 'ORG_ADMIN')
      AND ur.valid_from <= NOW()
      AND (ur.valid_until IS NULL OR ur.valid_until > NOW())
  );
$$;

-- Ora ricreiamo la policy per admin usando la nuova funzione
CREATE POLICY "Admins can manage users"
ON public.organization_users
FOR ALL
TO authenticated
USING (public.is_org_admin_direct())
WITH CHECK (public.is_org_admin_direct());

-- Commenta la funzione
COMMENT ON FUNCTION public.is_org_admin_direct() IS 'Security definer function to check if user is admin without causing RLS recursion on organization_users table';
