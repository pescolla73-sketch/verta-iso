-- =====================================================
-- AGGIORNA RLS POLICIES PER AUTENTICAZIONE
-- =====================================================

-- 1. Policy per organization - solo la propria org
DROP POLICY IF EXISTS "Users can view their organization" ON public.organization;
CREATE POLICY "Users can view their organization" 
  ON public.organization FOR SELECT
  USING (
    auth.uid() IS NOT NULL AND
    id IN (
      SELECT ou.organization_id 
      FROM organization_users ou 
      WHERE ou.auth_user_id = auth.uid()
    )
  );

-- 2. Policy per organization_users - solo utenti della propria org
DROP POLICY IF EXISTS "Users can view users of their org" ON public.organization_users;
CREATE POLICY "Users can view users of their org"
  ON public.organization_users FOR SELECT
  USING (
    auth.uid() IS NOT NULL AND
    organization_id IN (
      SELECT ou.organization_id 
      FROM organization_users ou 
      WHERE ou.auth_user_id = auth.uid()
    )
  );

-- 3. Funzione helper per verificare ruoli
CREATE OR REPLACE FUNCTION public.user_has_role(required_roles TEXT[])
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM organization_users ou
    JOIN user_roles ur ON ur.user_id = ou.id
    JOIN roles r ON r.id = ur.role_id
    WHERE ou.auth_user_id = auth.uid()
      AND r.role_code = ANY(required_roles)
      AND ur.valid_from <= NOW()
      AND (ur.valid_until IS NULL OR ur.valid_until > NOW())
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 4. Policy per gestione utenti - solo Admin
DROP POLICY IF EXISTS "Users can insert users for their org" ON public.organization_users;
CREATE POLICY "Admins can manage users"
  ON public.organization_users FOR ALL
  USING (
    auth.uid() IS NOT NULL AND
    user_has_role(ARRAY['SUPER_ADMIN', 'ORG_ADMIN'])
  )
  WITH CHECK (
    auth.uid() IS NOT NULL AND
    user_has_role(ARRAY['SUPER_ADMIN', 'ORG_ADMIN'])
  );

-- 5. Policy per user_roles
DROP POLICY IF EXISTS "Users can view roles of their org" ON public.user_roles;
CREATE POLICY "Users can view roles of their org"
  ON public.user_roles FOR SELECT
  USING (
    auth.uid() IS NOT NULL AND
    organization_id IN (
      SELECT ou.organization_id 
      FROM organization_users ou 
      WHERE ou.auth_user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can assign roles in their org" ON public.user_roles;
CREATE POLICY "Admins can manage user roles"
  ON public.user_roles FOR ALL
  USING (
    auth.uid() IS NOT NULL AND
    user_has_role(ARRAY['SUPER_ADMIN', 'ORG_ADMIN'])
  )
  WITH CHECK (
    auth.uid() IS NOT NULL AND
    user_has_role(ARRAY['SUPER_ADMIN', 'ORG_ADMIN'])
  );

-- 6. Aggiorna policies altre tabelle principali
-- Policies per policies table
DROP POLICY IF EXISTS "Users can view policies of their org" ON public.policies;
CREATE POLICY "Users can view policies of their org"
  ON public.policies FOR SELECT
  USING (
    auth.uid() IS NOT NULL AND
    organization_id IN (
      SELECT ou.organization_id 
      FROM organization_users ou 
      WHERE ou.auth_user_id = auth.uid()
    )
  );

-- Policies per assets
DROP POLICY IF EXISTS "Users can view assets of their org" ON public.assets;
CREATE POLICY "Users can view assets of their org"
  ON public.assets FOR SELECT
  USING (
    auth.uid() IS NOT NULL AND
    organization_id IN (
      SELECT ou.organization_id 
      FROM organization_users ou 
      WHERE ou.auth_user_id = auth.uid()
    )
  );

-- 7. Policy fallback per DEMO mode (quando auth.uid() è NULL)
-- Mantieni le policy DEMO esistenti per testing
CREATE POLICY "Demo mode fallback for organization"
  ON public.organization FOR SELECT
  USING (auth.uid() IS NULL);

CREATE POLICY "Demo mode fallback for organization_users"
  ON public.organization_users FOR ALL
  USING (auth.uid() IS NULL)
  WITH CHECK (auth.uid() IS NULL);

CREATE POLICY "Demo mode fallback for user_roles"
  ON public.user_roles FOR ALL
  USING (auth.uid() IS NULL)
  WITH CHECK (auth.uid() IS NULL);