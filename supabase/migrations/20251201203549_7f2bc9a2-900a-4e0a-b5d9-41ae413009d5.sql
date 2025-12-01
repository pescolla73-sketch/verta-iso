-- =====================================================
-- SISTEMA RBAC ISO 27001 - Drop e Ricrea
-- =====================================================

-- STEP 1: Drop tabelle esistenti (in ordine inverso per FK)
DROP TABLE IF EXISTS public.user_roles CASCADE;
DROP TABLE IF EXISTS public.organization_users CASCADE;
DROP TABLE IF EXISTS public.roles CASCADE;

-- STEP 2: Drop enum se esiste
DROP TYPE IF EXISTS public.app_role CASCADE;

-- STEP 3: Drop funzioni se esistono
DROP FUNCTION IF EXISTS public.has_role(uuid, app_role) CASCADE;
DROP FUNCTION IF EXISTS public.update_organization_users_updated_at() CASCADE;

-- STEP 4: Crea nuove tabelle
CREATE TABLE public.roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_name TEXT NOT NULL UNIQUE,
  role_code TEXT NOT NULL UNIQUE,
  description TEXT,
  is_system_role BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.organization_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organization(id) ON DELETE CASCADE,
  user_email TEXT NOT NULL,
  user_name TEXT NOT NULL,
  auth_user_id UUID,
  is_active BOOLEAN DEFAULT true,
  invited_at TIMESTAMPTZ DEFAULT NOW(),
  activated_at TIMESTAMPTZ,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID,
  UNIQUE(organization_id, user_email)
);

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.organization_users(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organization(id) ON DELETE CASCADE,
  scope_type TEXT,
  scope_value TEXT,
  valid_from TIMESTAMPTZ DEFAULT NOW(),
  valid_until TIMESTAMPTZ,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  assigned_by UUID,
  UNIQUE(user_id, role_id, organization_id)
);

-- STEP 5: Crea indici
CREATE INDEX idx_org_users_org ON public.organization_users(organization_id);
CREATE INDEX idx_org_users_email ON public.organization_users(user_email);
CREATE INDEX idx_org_users_auth ON public.organization_users(auth_user_id);
CREATE INDEX idx_user_roles_user ON public.user_roles(user_id);
CREATE INDEX idx_user_roles_org ON public.user_roles(organization_id);
CREATE INDEX idx_user_roles_role ON public.user_roles(role_id);

-- STEP 6: Inserisci ruoli predefiniti
INSERT INTO public.roles (role_name, role_code, description, is_system_role) VALUES
('Super Admin', 'SUPER_ADMIN', 'Amministratore piattaforma - gestione organizzazioni', true),
('Organization Admin', 'ORG_ADMIN', 'Amministratore organizzazione - gestione utenti e setup', true),
('CISO / ISMS Manager', 'CISO', 'Responsabile sicurezza - gestione operativa ISMS', true),
('Internal Auditor', 'AUDITOR', 'Auditor interno - audit e verifiche indipendenti', true),
('Process Owner', 'PROCESS_OWNER', 'Responsabile processo - gestione ambito specifico', true),
('Employee', 'EMPLOYEE', 'Utente base - accesso limitato', true),
('External Auditor', 'EXTERNAL_AUDITOR', 'Auditor esterno - sola lettura temporanea', true);

-- STEP 7: Crea trigger per updated_at
CREATE OR REPLACE FUNCTION public.update_organization_users_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER organization_users_updated_at
  BEFORE UPDATE ON public.organization_users
  FOR EACH ROW
  EXECUTE FUNCTION public.update_organization_users_updated_at();

-- STEP 8: Abilita RLS e crea policy pubbliche (demo mode)
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "roles_public_policy" ON public.roles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "org_users_public_policy" ON public.organization_users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "user_roles_public_policy" ON public.user_roles FOR ALL USING (true) WITH CHECK (true);