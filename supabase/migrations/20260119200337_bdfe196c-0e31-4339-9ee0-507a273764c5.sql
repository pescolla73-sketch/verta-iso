
-- Step 1: Crea la funzione security definer per verificare appartenenza organizzazione
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

-- Step 2: Rimuovi le policy insicure esistenti sulla tabella risks
DROP POLICY IF EXISTS "Public can manage risks for testing" ON public.risks;
DROP POLICY IF EXISTS "Public can view all risks for testing" ON public.risks;
DROP POLICY IF EXISTS "Public can insert risks for testing" ON public.risks;
DROP POLICY IF EXISTS "Public can update risks for testing" ON public.risks;
DROP POLICY IF EXISTS "Public can delete risks for testing" ON public.risks;

-- Step 3: Crea nuove policy sicure per la tabella risks

-- SELECT: Solo utenti autenticati della stessa organizzazione
CREATE POLICY "Users can view risks of their organization"
ON public.risks
FOR SELECT
TO authenticated
USING (public.user_belongs_to_org(organization_id));

-- INSERT: Solo utenti autenticati possono inserire nella propria organizzazione
CREATE POLICY "Users can insert risks in their organization"
ON public.risks
FOR INSERT
TO authenticated
WITH CHECK (public.user_belongs_to_org(organization_id));

-- UPDATE: Solo utenti autenticati possono modificare nella propria organizzazione
CREATE POLICY "Users can update risks in their organization"
ON public.risks
FOR UPDATE
TO authenticated
USING (public.user_belongs_to_org(organization_id))
WITH CHECK (public.user_belongs_to_org(organization_id));

-- DELETE: Solo utenti autenticati possono eliminare nella propria organizzazione
CREATE POLICY "Users can delete risks in their organization"
ON public.risks
FOR DELETE
TO authenticated
USING (public.user_belongs_to_org(organization_id));

-- Aggiungi commento per documentazione
COMMENT ON FUNCTION public.user_belongs_to_org(uuid) IS 'Security definer function to check if current user belongs to the specified organization. Used for RLS policies.';
