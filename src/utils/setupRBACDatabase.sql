-- =====================================================
-- SISTEMA RBAC - COMPLETO ISO 27001
-- =====================================================

-- 1. Tabella Ruoli
CREATE TABLE IF NOT EXISTS roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_name TEXT NOT NULL UNIQUE,
  role_code TEXT NOT NULL UNIQUE,
  description TEXT,
  is_system_role BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Tabella Utenti Organizzazione
CREATE TABLE IF NOT EXISTS organization_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
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

-- 3. Tabella Assegnazione Ruoli
CREATE TABLE IF NOT EXISTS user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES organization_users(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
  scope_type TEXT,
  scope_value TEXT,
  valid_from TIMESTAMPTZ DEFAULT NOW(),
  valid_until TIMESTAMPTZ,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  assigned_by UUID,
  UNIQUE(user_id, role_id, organization_id)
);

-- 4. Tabella Permessi
CREATE TABLE IF NOT EXISTS permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  permission_code TEXT NOT NULL UNIQUE,
  permission_name TEXT NOT NULL,
  resource TEXT NOT NULL,
  action TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Tabella Ruolo-Permessi
CREATE TABLE IF NOT EXISTS role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(role_id, permission_id)
);

-- 6. Tabella Audit Log
CREATE TABLE IF NOT EXISTS access_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES organization_users(id),
  organization_id UUID REFERENCES organization(id),
  action TEXT NOT NULL,
  resource TEXT NOT NULL,
  resource_id UUID,
  ip_address TEXT,
  user_agent TEXT,
  success BOOLEAN DEFAULT true,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- INDICI per performance
CREATE INDEX IF NOT EXISTS idx_org_users_org ON organization_users(organization_id);
CREATE INDEX IF NOT EXISTS idx_org_users_email ON organization_users(user_email);
CREATE INDEX IF NOT EXISTS idx_org_users_auth_id ON organization_users(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_user ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_org ON user_roles(organization_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON user_roles(role_id);
CREATE INDEX IF NOT EXISTS idx_access_logs_user ON access_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_access_logs_org ON access_logs(organization_id);

-- ABILITA RLS su tutte le tabelle
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE access_logs ENABLE ROW LEVEL SECURITY;

-- RLS POLICIES - Roles
CREATE POLICY "Everyone can view roles" 
  ON roles FOR SELECT 
  USING (true);

-- RLS POLICIES - Organization Users
CREATE POLICY "Users can view users of their org" 
  ON organization_users FOR SELECT 
  USING (organization_id IN (SELECT id FROM organization LIMIT 1));

CREATE POLICY "Users can insert users for their org" 
  ON organization_users FOR INSERT 
  WITH CHECK (organization_id IN (SELECT id FROM organization LIMIT 1));

CREATE POLICY "Users can update users of their org" 
  ON organization_users FOR UPDATE 
  USING (organization_id IN (SELECT id FROM organization LIMIT 1));

CREATE POLICY "Users can delete users of their org" 
  ON organization_users FOR DELETE 
  USING (organization_id IN (SELECT id FROM organization LIMIT 1));

-- RLS POLICIES - User Roles
CREATE POLICY "Users can view roles of their org" 
  ON user_roles FOR SELECT 
  USING (organization_id IN (SELECT id FROM organization LIMIT 1));

CREATE POLICY "Users can assign roles in their org" 
  ON user_roles FOR INSERT 
  WITH CHECK (organization_id IN (SELECT id FROM organization LIMIT 1));

CREATE POLICY "Users can update roles in their org" 
  ON user_roles FOR UPDATE 
  USING (organization_id IN (SELECT id FROM organization LIMIT 1));

CREATE POLICY "Users can delete roles in their org" 
  ON user_roles FOR DELETE 
  USING (organization_id IN (SELECT id FROM organization LIMIT 1));

-- RLS POLICIES - Permissions
CREATE POLICY "Everyone can view permissions" 
  ON permissions FOR SELECT 
  USING (true);

-- RLS POLICIES - Role Permissions
CREATE POLICY "Everyone can view role permissions" 
  ON role_permissions FOR SELECT 
  USING (true);

-- RLS POLICIES - Access Logs
CREATE POLICY "Users can view logs of their org" 
  ON access_logs FOR SELECT 
  USING (organization_id IN (SELECT id FROM organization LIMIT 1));

CREATE POLICY "System can insert logs" 
  ON access_logs FOR INSERT 
  WITH CHECK (true);

-- TRIGGER per updated_at
CREATE OR REPLACE FUNCTION update_organization_users_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER organization_users_updated_at
  BEFORE UPDATE ON organization_users
  FOR EACH ROW
  EXECUTE FUNCTION update_organization_users_updated_at();

-- INSERIMENTO 7 RUOLI PREDEFINITI
INSERT INTO roles (role_name, role_code, description, is_system_role) VALUES
('Super Admin', 'SUPER_ADMIN', 'Amministratore piattaforma con accesso completo', true),
('Organization Admin', 'ORG_ADMIN', 'Amministratore organizzazione - gestione completa ISMS', true),
('CISO', 'CISO', 'Chief Information Security Officer - responsabile sicurezza', true),
('Internal Auditor', 'AUDITOR', 'Auditor interno - verifica controlli e conformità', true),
('Process Owner', 'PROCESS_OWNER', 'Responsabile processo - gestione aree specifiche', true),
('Employee', 'EMPLOYEE', 'Utente base - accesso limitato in lettura', true),
('External Auditor', 'EXTERNAL_AUDITOR', 'Auditor esterno - accesso temporaneo per certificazione', true)
ON CONFLICT (role_code) DO NOTHING;

-- INSERIMENTO PERMESSI BASE
INSERT INTO permissions (permission_code, permission_name, resource, action, description) VALUES
-- Policies
('POLICY_VIEW', 'Visualizza Policy', 'policies', 'view', 'Può visualizzare le policy'),
('POLICY_CREATE', 'Crea Policy', 'policies', 'create', 'Può creare nuove policy'),
('POLICY_EDIT', 'Modifica Policy', 'policies', 'edit', 'Può modificare policy esistenti'),
('POLICY_DELETE', 'Elimina Policy', 'policies', 'delete', 'Può eliminare policy'),
('POLICY_APPROVE', 'Approva Policy', 'policies', 'approve', 'Può approvare policy'),

-- Risks
('RISK_VIEW', 'Visualizza Rischi', 'risks', 'view', 'Può visualizzare i rischi'),
('RISK_CREATE', 'Crea Rischi', 'risks', 'create', 'Può creare nuovi rischi'),
('RISK_EDIT', 'Modifica Rischi', 'risks', 'edit', 'Può modificare rischi esistenti'),
('RISK_DELETE', 'Elimina Rischi', 'risks', 'delete', 'Può eliminare rischi'),

-- Assets
('ASSET_VIEW', 'Visualizza Asset', 'assets', 'view', 'Può visualizzare gli asset'),
('ASSET_CREATE', 'Crea Asset', 'assets', 'create', 'Può creare nuovi asset'),
('ASSET_EDIT', 'Modifica Asset', 'assets', 'edit', 'Può modificare asset esistenti'),
('ASSET_DELETE', 'Elimina Asset', 'assets', 'delete', 'Può eliminare asset'),

-- Controls
('CONTROL_VIEW', 'Visualizza Controlli', 'controls', 'view', 'Può visualizzare i controlli'),
('CONTROL_EDIT', 'Modifica Controlli', 'controls', 'edit', 'Può modificare controlli'),
('CONTROL_APPROVE', 'Approva Controlli', 'controls', 'approve', 'Può approvare controlli'),

-- Audits
('AUDIT_VIEW', 'Visualizza Audit', 'audits', 'view', 'Può visualizzare gli audit'),
('AUDIT_CREATE', 'Crea Audit', 'audits', 'create', 'Può creare nuovi audit'),
('AUDIT_EDIT', 'Modifica Audit', 'audits', 'edit', 'Può modificare audit'),
('AUDIT_EXECUTE', 'Esegui Audit', 'audits', 'execute', 'Può eseguire audit'),

-- Incidents
('INCIDENT_VIEW', 'Visualizza Incidenti', 'incidents', 'view', 'Può visualizzare incidenti'),
('INCIDENT_CREATE', 'Crea Incidenti', 'incidents', 'create', 'Può creare nuovi incidenti'),
('INCIDENT_EDIT', 'Modifica Incidenti', 'incidents', 'edit', 'Può modificare incidenti'),
('INCIDENT_CLOSE', 'Chiudi Incidenti', 'incidents', 'close', 'Può chiudere incidenti'),

-- Users
('USER_VIEW', 'Visualizza Utenti', 'users', 'view', 'Può visualizzare utenti'),
('USER_CREATE', 'Crea Utenti', 'users', 'create', 'Può creare nuovi utenti'),
('USER_EDIT', 'Modifica Utenti', 'users', 'edit', 'Può modificare utenti'),
('USER_DELETE', 'Elimina Utenti', 'users', 'delete', 'Può eliminare utenti'),
('USER_ASSIGN_ROLES', 'Assegna Ruoli', 'users', 'assign_roles', 'Può assegnare ruoli agli utenti'),

-- Settings
('SETTINGS_VIEW', 'Visualizza Impostazioni', 'settings', 'view', 'Può visualizzare impostazioni'),
('SETTINGS_EDIT', 'Modifica Impostazioni', 'settings', 'edit', 'Può modificare impostazioni')
ON CONFLICT (permission_code) DO NOTHING;

-- ASSEGNAZIONE PERMESSI AI RUOLI
-- Super Admin - tutti i permessi
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.role_code = 'SUPER_ADMIN'
ON CONFLICT DO NOTHING;

-- Organization Admin - quasi tutti i permessi
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.role_code = 'ORG_ADMIN'
  AND p.permission_code NOT IN ('USER_DELETE') -- ORG_ADMIN non può eliminare utenti
ON CONFLICT DO NOTHING;

-- CISO - gestione sicurezza
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.role_code = 'CISO'
  AND p.resource IN ('policies', 'risks', 'controls', 'incidents', 'audits', 'assets')
  AND p.action IN ('view', 'create', 'edit', 'approve')
ON CONFLICT DO NOTHING;

-- Internal Auditor - audit e verifica
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.role_code = 'AUDITOR'
  AND (
    (p.resource IN ('audits') AND p.action IN ('view', 'create', 'edit', 'execute'))
    OR (p.resource IN ('policies', 'controls', 'risks', 'assets', 'incidents') AND p.action = 'view')
  )
ON CONFLICT DO NOTHING;

-- Process Owner - gestione processi specifici
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.role_code = 'PROCESS_OWNER'
  AND p.resource IN ('controls', 'incidents', 'policies', 'assets')
  AND p.action IN ('view', 'edit')
ON CONFLICT DO NOTHING;

-- Employee - solo lettura base
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.role_code = 'EMPLOYEE'
  AND p.action = 'view'
  AND p.resource IN ('policies', 'controls', 'incidents')
ON CONFLICT DO NOTHING;

-- External Auditor - audit certificazione
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.role_code = 'EXTERNAL_AUDITOR'
  AND (
    (p.resource = 'audits' AND p.action IN ('view', 'create', 'edit', 'execute'))
    OR (p.resource IN ('policies', 'controls', 'risks', 'assets', 'incidents') AND p.action = 'view')
  )
ON CONFLICT DO NOTHING;

-- VERIFICA FINALE
SELECT 
  'Roles' as table_name, 
  COUNT(*) as count 
FROM roles
UNION ALL
SELECT 'Permissions', COUNT(*) FROM permissions
UNION ALL
SELECT 'Role-Permissions mappings', COUNT(*) FROM role_permissions;
