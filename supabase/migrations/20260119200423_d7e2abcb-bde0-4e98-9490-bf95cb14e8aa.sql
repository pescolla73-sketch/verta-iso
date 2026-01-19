
-- Fix: Rimuovi la policy che causa ricorsione su organization_users
DROP POLICY IF EXISTS "Users can view users of their org" ON public.organization_users;

-- Crea una policy più semplice che usa direttamente auth.uid()
CREATE POLICY "Users can view users of their org v2"
ON public.organization_users
FOR SELECT
TO authenticated
USING (auth_user_id = auth.uid());

-- Aggiorna la funzione user_belongs_to_org per essere più robusta
-- La funzione SECURITY DEFINER bypassa le RLS, ma serve un accesso diretto
CREATE OR REPLACE FUNCTION public.user_belongs_to_org(org_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM organization_users ou
    WHERE ou.organization_id = org_id
      AND ou.auth_user_id = auth.uid()
      AND ou.is_active = true
  );
$$;
