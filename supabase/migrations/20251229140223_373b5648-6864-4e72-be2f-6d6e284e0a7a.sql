-- =====================================================
-- RECURRING TASKS SYSTEM
-- =====================================================

CREATE TABLE IF NOT EXISTS public.recurring_task_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_code TEXT UNIQUE NOT NULL,
  task_name TEXT NOT NULL,
  task_description TEXT,
  category TEXT NOT NULL,
  frequency TEXT NOT NULL,
  frequency_days INTEGER NOT NULL,
  responsible_role TEXT,
  related_module TEXT,
  priority TEXT DEFAULT 'medium',
  instructions TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.recurring_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organization(id) ON DELETE CASCADE,
  template_id UUID REFERENCES public.recurring_task_templates(id),
  task_name TEXT NOT NULL,
  task_description TEXT,
  category TEXT NOT NULL,
  due_date DATE NOT NULL,
  status TEXT DEFAULT 'pending',
  priority TEXT DEFAULT 'medium',
  responsible_user_id UUID,
  assigned_to TEXT,
  completed_date TIMESTAMPTZ,
  completed_by UUID,
  completion_notes TEXT,
  next_occurrence_date DATE,
  frequency_days INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indici
CREATE INDEX idx_recurring_tasks_org ON public.recurring_tasks(organization_id);
CREATE INDEX idx_recurring_tasks_due_date ON public.recurring_tasks(due_date);
CREATE INDEX idx_recurring_tasks_status ON public.recurring_tasks(status);
CREATE INDEX idx_recurring_tasks_responsible ON public.recurring_tasks(responsible_user_id);

-- RLS
ALTER TABLE public.recurring_task_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recurring_tasks ENABLE ROW LEVEL SECURITY;

-- Templates leggibili da tutti
CREATE POLICY "Templates readable by all"
  ON public.recurring_task_templates FOR SELECT
  USING (true);

-- Tasks: permissive policies for testing
CREATE POLICY "Public can view recurring_tasks for testing"
  ON public.recurring_tasks FOR SELECT
  USING (true);

CREATE POLICY "Public can insert recurring_tasks for testing"
  ON public.recurring_tasks FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Public can update recurring_tasks for testing"
  ON public.recurring_tasks FOR UPDATE
  USING (true);

CREATE POLICY "Public can delete recurring_tasks for testing"
  ON public.recurring_tasks FOR DELETE
  USING (true);

-- =====================================================
-- POPOLA TASK TEMPLATES
-- =====================================================

INSERT INTO public.recurring_task_templates (
  template_code,
  task_name,
  task_description,
  category,
  frequency,
  frequency_days,
  responsible_role,
  related_module,
  priority,
  instructions
) VALUES
-- MONTHLY TASKS
(
  'TASK_BACKUP_TEST',
  'Test Ripristino Backup',
  'Eseguire test mensile di ripristino backup per verificare integrità e RTO',
  'testing',
  'monthly',
  30,
  'IT_MANAGER',
  'backups',
  'high',
  E'1. Seleziona 3 backup random (almeno 1 critico)\n2. Esegui restore in ambiente test\n3. Verifica integrità dati ripristinati\n4. Misura tempo ripristino (RTO)\n5. Documenta risultati e anomalie\n6. Se fallisce: investigazione urgente'
),
(
  'TASK_PATCH_REVIEW',
  'Review Patch Sicurezza',
  'Verificare e applicare patch critiche di sicurezza',
  'maintenance',
  'monthly',
  30,
  'IT_MANAGER',
  'controls',
  'high',
  E'1. Review security bulletins (Microsoft, vendor critici)\n2. Identificare patch critiche disponibili\n3. Testare patch in ambiente pre-prod\n4. Schedulare deployment produzione\n5. Applicare patch entro 30gg dalla release\n6. Documentare patch applicate'
),
(
  'TASK_INCIDENT_REVIEW',
  'Review Incidenti del Mese',
  'Analizzare incidenti di sicurezza del mese e identificare trend',
  'review',
  'monthly',
  30,
  'CISO',
  'incidents',
  'medium',
  E'1. Estrarre report incidenti del mese\n2. Analizzare tipologie e frequenza\n3. Identificare root cause comuni\n4. Proporre azioni preventive\n5. Aggiornare playbook se necessario\n6. Comunicare findings a management'
),
-- QUARTERLY TASKS
(
  'TASK_ACCESS_REVIEW',
  'Review Privilegi di Accesso',
  'Revisione trimestrale accessi utenti e privilegi amministrativi',
  'review',
  'quarterly',
  90,
  'CISO',
  'users',
  'high',
  E'1. Estrarre lista utenti e relativi accessi\n2. Inviare a manager per validazione team\n3. Identificare accessi non più necessari\n4. Revocare accessi obsoleti\n5. Verificare nessun privilegio eccessivo\n6. Documentare review completata con sign-off'
),
(
  'TASK_VENDOR_REVIEW',
  'Review Fornitori Critici',
  'Verificare conformità e performance fornitori IT critici',
  'review',
  'quarterly',
  90,
  'CISO',
  'suppliers',
  'medium',
  E'1. Lista fornitori critici (hosting, SaaS, outsourcing)\n2. Verificare SLA rispettati\n3. Review eventuali incident/breach del fornitore\n4. Verificare certificazioni ancora valide\n5. Valutare se rinnovare/sostituire\n6. Aggiornare registro fornitori'
),
(
  'TASK_TRAINING_SESSION',
  'Sessione Formazione Security Awareness',
  'Formazione trimestrale dipendenti su sicurezza informazioni',
  'training',
  'quarterly',
  90,
  'CISO',
  'training',
  'high',
  E'1. Preparare materiale formazione (policy, casi reali)\n2. Schedulare sessioni per tutti i dipendenti\n3. Eseguire formazione (online o presenza)\n4. Somministrare quiz validazione\n5. Raccogliere attendance e risultati\n6. Documentare in training records'
),
(
  'TASK_POLICY_REVIEW',
  'Review Policy di Sicurezza',
  'Revisione trimestrale policy per verificare attualità',
  'review',
  'quarterly',
  90,
  'CISO',
  'policies',
  'medium',
  E'1. Review tutte le policy pubblicate\n2. Verificare se ancora attuali (norme, tech, org)\n3. Raccogliere feedback da utenti\n4. Proporre modifiche se necessario\n5. Approvare versioni aggiornate\n6. Comunicare modifiche'
),
-- SEMI-ANNUAL TASKS
(
  'TASK_DR_DRILL',
  'Disaster Recovery Drill',
  'Esercitazione semestrale piano di disaster recovery',
  'testing',
  'semi-annual',
  180,
  'IT_MANAGER',
  'continuity',
  'critical',
  E'1. Pianificare scenario disaster (es: datacenter offline)\n2. Comunicare drill a stakeholder\n3. Attivare DR team\n4. Eseguire restore sistemi critici da backup\n5. Testare business continuity\n6. Misurare RTO/RPO effettivi\n7. Post-mortem: lessons learned\n8. Aggiornare DR plan'
),
(
  'TASK_RISK_REVIEW',
  'Review Risk Assessment',
  'Revisione semestrale valutazione rischi',
  'review',
  'semi-annual',
  180,
  'CISO',
  'risks',
  'high',
  E'1. Review tutti i rischi identificati\n2. Verificare se nuovi rischi emersi\n3. Rivalutare probabilità/impatto rischi esistenti\n4. Verificare efficacia trattamenti implementati\n5. Aggiornare risk register\n6. Report a management su rischi residui'
),
(
  'TASK_BCP_TEST',
  'Test Business Continuity Plan',
  'Test semestrale piano continuità operativa',
  'testing',
  'semi-annual',
  180,
  'ORG_ADMIN',
  'continuity',
  'high',
  E'1. Selezionare scenario test (es: ufficio inaccessibile)\n2. Attivare BCP team\n3. Testare workspace alternativo\n4. Verificare accessi remoti funzionanti\n5. Testare comunicazioni emergenza\n6. Misurare tempo ripristino operatività\n7. Documentare findings e miglioramenti'
),
-- ANNUAL TASKS
(
  'TASK_INTERNAL_AUDIT',
  'Internal Audit Completo',
  'Audit interno annuale conformità ISO 27001',
  'audit',
  'annual',
  365,
  'INTERNAL_AUDITOR',
  'audits',
  'critical',
  E'1. Pianificare audit (scope, schedule, auditor)\n2. Comunicare a auditees\n3. Eseguire audit tutti i controlli\n4. Intervistare responsabili\n5. Verificare evidenze\n6. Identificare Non Conformità\n7. Report audit con findings\n8. Follow-up azioni correttive'
),
(
  'TASK_MGMT_REVIEW',
  'Management Review',
  'Revisione annuale ISMS da parte della Direzione',
  'review',
  'annual',
  365,
  'ORG_ADMIN',
  'management',
  'critical',
  E'1. Preparare report annuale ISMS\n2. Schedulare meeting Direzione\n3. Presentare findings\n4. Decisioni: obiettivi, risorse, miglioramenti\n5. Documentare Management Review\n6. Comunicare decisioni'
),
(
  'TASK_CERT_RENEWAL',
  'Rinnovo Certificazioni',
  'Verificare scadenze certificazioni IT e pianificare rinnovi',
  'maintenance',
  'annual',
  365,
  'IT_MANAGER',
  'compliance',
  'high',
  E'1. Lista certificazioni in scadenza (SSL, domini, software)\n2. Verificare budget per rinnovi\n3. Iniziare processo rinnovo 60gg prima scadenza\n4. Aggiornare registro certificazioni\n5. Comunicare nuove scadenze a team'
),
(
  'TASK_ASSET_INVENTORY',
  'Inventario Completo Asset',
  'Inventario annuale completo di tutti gli asset IT',
  'review',
  'annual',
  365,
  'IT_MANAGER',
  'assets',
  'medium',
  E'1. Physical inventory: contare server, laptop, etc\n2. Software inventory: licenze, versioni\n3. Verificare ownership asset\n4. Identificare asset non più in uso\n5. Aggiornare asset register\n6. Dismissione asset obsoleti'
),
(
  'TASK_CONTROL_EFFECTIVENESS',
  'Valutazione Efficacia Controlli',
  'Review annuale efficacia controlli implementati',
  'review',
  'annual',
  365,
  'CISO',
  'controls',
  'high',
  E'1. Review tutti i controlli SoA\n2. Raccogliere metriche efficacia\n3. Intervistare control owners\n4. Identificare controlli inefficaci\n5. Proporre miglioramenti\n6. Aggiornare SoA se necessario\n7. Report a management'
);

-- =====================================================
-- FUNZIONE AUTO-GENERAZIONE TASK
-- =====================================================

CREATE OR REPLACE FUNCTION public.generate_initial_recurring_tasks(
  p_organization_id UUID,
  p_start_date DATE DEFAULT CURRENT_DATE
)
RETURNS INTEGER AS $$
DECLARE
  task_count INTEGER := 0;
  template RECORD;
  first_due_date DATE;
BEGIN
  FOR template IN 
    SELECT * FROM public.recurring_task_templates
  LOOP
    first_due_date := p_start_date + template.frequency_days;
    
    INSERT INTO public.recurring_tasks (
      organization_id,
      template_id,
      task_name,
      task_description,
      category,
      due_date,
      priority,
      frequency_days,
      status,
      created_at
    ) VALUES (
      p_organization_id,
      template.id,
      template.task_name,
      template.task_description,
      template.category,
      first_due_date,
      template.priority,
      template.frequency_days,
      'pending',
      NOW()
    );
    
    task_count := task_count + 1;
  END LOOP;
  
  RETURN task_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- =====================================================
-- FUNZIONE RIGENERAZIONE TASK DOPO COMPLETION
-- =====================================================

CREATE OR REPLACE FUNCTION public.regenerate_recurring_task()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    INSERT INTO public.recurring_tasks (
      organization_id,
      template_id,
      task_name,
      task_description,
      category,
      due_date,
      priority,
      responsible_user_id,
      assigned_to,
      frequency_days,
      status,
      created_at
    ) VALUES (
      NEW.organization_id,
      NEW.template_id,
      NEW.task_name,
      NEW.task_description,
      NEW.category,
      CURRENT_DATE + NEW.frequency_days,
      NEW.priority,
      NEW.responsible_user_id,
      NEW.assigned_to,
      NEW.frequency_days,
      'pending',
      NOW()
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger per rigenerare task
CREATE TRIGGER trigger_regenerate_recurring_task
  AFTER UPDATE ON public.recurring_tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.regenerate_recurring_task();

-- =====================================================
-- FUNZIONE UPDATE STATUS OVERDUE
-- =====================================================

CREATE OR REPLACE FUNCTION public.update_overdue_tasks()
RETURNS INTEGER AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  UPDATE public.recurring_tasks
  SET status = 'overdue', updated_at = NOW()
  WHERE status = 'pending'
    AND due_date < CURRENT_DATE;
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  
  RETURN updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

COMMENT ON TABLE public.recurring_task_templates IS 'Template task ricorrenti ISO 27001';
COMMENT ON TABLE public.recurring_tasks IS 'Task compliance ricorrenti per organizzazione';
COMMENT ON FUNCTION public.generate_initial_recurring_tasks IS 'Genera task iniziali per nuova org';
COMMENT ON FUNCTION public.update_overdue_tasks IS 'Marca task scaduti come overdue (esegui daily)';