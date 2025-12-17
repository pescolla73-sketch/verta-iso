-- Add new columns to procedure_templates if they don't exist
ALTER TABLE public.procedure_templates 
ADD COLUMN IF NOT EXISTS template_code TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS template_name TEXT,
ADD COLUMN IF NOT EXISTS procedure_name TEXT,
ADD COLUMN IF NOT EXISTS procedure_number TEXT,
ADD COLUMN IF NOT EXISTS procedure_steps TEXT,
ADD COLUMN IF NOT EXISTS tools_required TEXT,
ADD COLUMN IF NOT EXISTS frequency TEXT,
ADD COLUMN IF NOT EXISTS is_mandatory BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS version TEXT DEFAULT '1.0',
ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'it';

-- Create indexes if not exist
CREATE INDEX IF NOT EXISTS idx_procedure_templates_category ON public.procedure_templates(category);

-- Insert detailed procedure templates
INSERT INTO public.procedure_templates (
  template_code,
  template_name,
  name,
  category,
  procedure_name,
  procedure_number,
  purpose_template,
  scope_template,
  steps_template,
  responsibilities_template,
  iso_reference,
  tools_required,
  frequency,
  is_mandatory
) VALUES

-- 1. USER ACCESS MANAGEMENT
(
  'PROC_UAM_001',
  'User Access Management',
  'Gestione Accessi Utente',
  'mandatory',
  'Procedura Gestione Accessi Utente',
  'PROC-001',
  'Definire il processo per richiedere, approvare, creare, modificare e revocare accessi ai sistemi aziendali.',
  'Tutti i sistemi informativi, applicazioni e risorse di rete che richiedono autenticazione.',
  E'FASE 1: RICHIESTA ACCESSO\n\n1. Dipendente compila form richiesta accesso specificando:\n   - Sistemi/applicazioni necessari\n   - Livello accesso richiesto\n   - Giustificazione business\n   - Data inizio prevista\n\n2. Manager diretto riceve notifica e valuta:\n   - Necessità accesso per ruolo\n   - Appropriatezza livello richiesto\n   - Conformità policy separazione compiti\n\n3. Manager approva o rifiuta con motivazione\n\nFASE 2: PROVISIONING\n\n4. IT Security riceve richiesta approvata via ticket\n\n5. Verifica conformità a:\n   - Least Privilege principle\n   - Role-based access control\n   - Nessun conflitto con separazione compiti\n\n6. Crea account con:\n   - Username standard (nome.cognome)\n   - Password temporanea complessa\n   - Forza cambio password al primo login\n   - MFA attivato se richiesto\n\n7. Assegna permessi minimi necessari per ruolo\n\n8. Documenta in CMDB\n\nFASE 3: MODIFICHE ACCESSO\n\n10. Per cambio ruolo/dipartimento:\n    - Manager richiede modifica permessi\n    - IT Security valuta necessità\n    - Applica principio least privilege\n\nFASE 4: REVOCA ACCESSO\n\n11. Trigger revoca:\n    - Cessazione rapporto lavoro\n    - Cambio ruolo (parziale)\n    - Violazione policy\n\n12. HR notifica IT Security cessazione\n\n13. IT Security entro 1 ora:\n    - Disabilita account AD/SSO\n    - Revoca accessi VPN\n    - Blocca email\n\nFASE 5: REVIEW PERIODICA\n\n15. Ogni trimestre:\n    - IT Security genera report accessi\n    - Manager review accessi team',
  E'RICHIEDENTE: Compilare richiesta accesso completa\n\nAPPROVATORE (Manager): Valutare necessità accesso, approvare solo accessi appropriati\n\nIT SECURITY: Verificare conformità policy, provisioning/modifica/revoca tempestiva\n\nHR: Notificare IT di cessazioni',
  ARRAY['A.5.15', 'A.5.16', 'A.5.17', 'A.5.18', 'A.8.2', 'A.8.3'],
  'Sistema ticketing, Active Directory / Identity Provider, CMDB',
  'Richieste: On-demand | Review: Trimestrale',
  true
),

-- 2. BACKUP & RESTORE
(
  'PROC_BR_001',
  'Backup & Restore',
  'Backup e Ripristino',
  'mandatory',
  'Procedura Backup e Ripristino',
  'PROC-002',
  'Garantire esecuzione corretta backup dati e capacità ripristino in caso di perdita dati o disaster.',
  'Tutti i sistemi critici, database, file server e applicazioni in ambito ISMS.',
  E'FASE 1: BACKUP AUTOMATIZZATI\n\n1. Backup schedulati automatici:\n   - TIER 1 (Critici): Ogni ora + replica real-time\n   - TIER 2 (Importanti): Giornaliero ore 02:00\n   - TIER 3 (Standard): Settimanale domenica 03:00\n\n2. Sistema backup esegue:\n   - Snapshot application-consistent\n   - Compressione dati\n   - Crittografia AES-256\n   - Transfer a storage secondario\n   - Verifica integrità backup\n\n3. Storage distribuzione (3-2-1 rule):\n   - 3 copie totali\n   - 2 media diversi (disk + tape/cloud)\n   - 1 copia off-site geograficamente separata\n\n4. Retention automatica:\n   - TIER 1: 30 giorni + 12 mesi mensili\n   - TIER 2: 14 giorni + 6 mesi mensili\n   - TIER 3: 30 giorni\n\nFASE 2: MONITORING & ALERTING\n\n5. Sistema monitoring verifica:\n   - Completamento backup schedulati\n   - Nessun errore critico\n   - Spazio storage disponibile\n\n6. In caso anomalia:\n   - Alert automatico a IT Operations\n   - Ticket automatico per investigazione\n\nFASE 3: TEST RIPRISTINO MENSILE\n\n8. Primo lunedì di ogni mese:\n   - IT seleziona random 3 backup TIER 1\n   - Esegue restore in ambiente test\n   - Verifica integrità dati ripristinati\n   - Documenta risultati test\n\nFASE 4: RIPRISTINO DATI\n\n10. Richiesta ripristino:\n    - Utente/Manager segnala perdita dati\n    - IT valuta severità\n    - Apre ticket emergenza se critico\n\nFASE 5: DISASTER RECOVERY DRILL\n\n13. Ogni 6 mesi DR drill completo',
  E'IT OPERATIONS: Gestire infrastruttura backup, monitorare esecuzione, eseguire test mensili\n\nDATA OWNERS: Classificare criticità dati (TIER), validare test ripristino\n\nIT MANAGER: Review report test mensili, approvare modifiche procedura\n\nUTENTI: Salvare file in location centrali, segnalare perdite dati',
  ARRAY['A.5.29', 'A.5.30', 'A.8.13', 'A.8.14'],
  'Veeam Backup / Commvault, Storage NAS/SAN, Cloud storage, Sistema monitoring',
  'Backup: Automatico | Test: Mensile | DR Drill: Semestrale',
  true
),

-- 3. INCIDENT RESPONSE
(
  'PROC_IR_001',
  'Incident Response',
  'Risposta Incidenti',
  'mandatory',
  'Procedura Risposta Incidenti Sicurezza',
  'PROC-003',
  'Definire processo strutturato per identificare, gestire, contenere e risolvere incidenti di sicurezza minimizzando impatto.',
  'Tutti gli incidenti di sicurezza che compromettono confidenzialità, integrità o disponibilità informazioni.',
  E'FASE 1: DETECTION & REPORTING (0-1 ora)\n\n1. Identificazione potenziale incidente:\n   - Alert sistemi monitoring/SIEM\n   - Segnalazione utente\n   - Discovery durante audit\n\n2. Chiunque rileva incidente deve:\n   - NON tentare investigazione autonoma\n   - Preservare evidenze\n   - Segnalare immediatamente a Security Team\n\n3. Security Team riceve segnalazione e:\n   - Crea ticket incidente\n   - Assegna ID incidente\n   - Notifica CISO\n\nFASE 2: ASSESSMENT & CLASSIFICATION (1-2 ore)\n\n4. Security Analyst valuta:\n   - Tipo incidente (malware, breach, DDoS, etc)\n   - Sistemi/dati impattati\n   - Impatto business operazioni\n\n5. Assegna Severity:\n   - CRITICAL: Servizi produzione down, data breach\n   - HIGH: Impatto significativo, malware diffuso\n   - MEDIUM: Impatto contenuto, singolo sistema\n   - LOW: Tentativo fallito, no impatto reale\n\nFASE 3: CONTAINMENT (2-4 ore)\n\n8. Azioni contenimento immediate:\n   - Isola sistemi compromessi\n   - Blocca account compromessi\n   - Revoca credenziali rubate\n   - Blocca IP/domini malevoli\n\n9. Raccolta evidenze forensi\n\nFASE 4: ERADICATION (4-24 ore)\n\n11. Identifica root cause\n\n12. Rimuovi minaccia:\n   - Elimina malware/backdoor\n   - Patch vulnerabilità sfruttate\n\nFASE 5: RECOVERY (24-72 ore)\n\n14. Restore operazioni:\n   - Rebuild sistemi da backup puliti\n   - Test funzionalità applicazioni\n\nFASE 6: POST-INCIDENT REVIEW (entro 5 giorni)\n\n17. Post-Mortem Meeting:\n   - Review timeline completa\n   - Lessons learned\n   - Action items miglioramento',
  E'TUTTI I DIPENDENTI: Segnalare immediatamente incidenti, non investigare autonomamente\n\nINCIDENT RESPONSE TEAM: Security Lead coordina, Security Analysts investigano, IT Operations contiene\n\nCISO: Decisioni strategiche risposta, approvazione comunicazioni esterne\n\nMANAGEMENT: Fornire risorse necessarie',
  ARRAY['A.5.24', 'A.5.25', 'A.5.26', 'A.5.27', 'A.5.28', 'A.6.8'],
  'SIEM, EDR, Ticketing system, Forensics tools, Conference bridge 24/7',
  'On-demand (24/7) | Post-mortem: Entro 5 giorni',
  true
),

-- 4. CHANGE MANAGEMENT
(
  'PROC_CM_001',
  'Change Management',
  'Gestione Modifiche',
  'mandatory',
  'Procedura Gestione Modifiche',
  'PROC-004',
  'Controllare modifiche a sistemi, applicazioni e infrastrutture per minimizzare rischi e interruzioni servizio.',
  'Tutte le modifiche a sistemi in ambito ISMS inclusi hardware, software, configurazioni, network.',
  E'FASE 1: RICHIESTA MODIFICA\n\n1. Richiedente compila RFC (Request for Change):\n   - Descrizione modifica proposta\n   - Giustificazione business\n   - Sistemi/servizi impattati\n   - Piano rollback\n   - Data/ora implementazione proposta\n\n2. Categorie modifiche:\n   STANDARD: Pre-approvata, routine basso rischio\n   NORMAL: Pianificate medio impatto, approval CAB\n   EMERGENCY: Urgenti per incidenti, fast-track\n\nFASE 2: ASSESSMENT & APPROVAL\n\n3. CAB (Change Advisory Board) valuta:\n   - Necessità business modifica\n   - Impatto su servizi/utenti\n   - Rischi tecnici e business\n   - Completezza piano rollback\n\n4. CAB composizione:\n   - CTO/IT Manager (Chair)\n   - Security Lead\n   - Operations Manager\n\n5. Meeting CAB:\n   - NORMAL: Settimanale\n   - EMERGENCY: Convocazione immediata\n\nFASE 3: PLANNING & PREPARATION\n\n7. Change Owner prepara:\n   - Runbook implementazione dettagliato\n   - Test plan in ambiente pre-prod\n   - Comunicazione stakeholder\n   - Backup sistemi coinvolti\n\n8. Testing pre-produzione\n\nFASE 4: IMPLEMENTATION\n\n10. Pre-implementation checklist:\n    - Backup completati\n    - Team in conference bridge\n    - Rollback plan ready\n\n11. Esecuzione modifica:\n    - Follow runbook step-by-step\n    - Monitor metriche real-time\n\nFASE 5: VALIDATION & CLOSURE\n\n13. Post-implementation validation:\n    - Test funzionalità\n    - Review log errori\n\n14. Monitoring intensivo 24-72 ore\n\n15. Chiusura RFC con documentazione',
  E'RICHIEDENTE: Compilare RFC completa, prepararsi implementazione\n\nCHANGE OWNER: Coordinare implementazione, decidere go/no-go\n\nCAB MEMBERS: Valutare rischi, approvare/rifiutare RFC\n\nOPERATIONS: Eseguire modifiche tecniche, rollback se necessario\n\nBUSINESS OWNERS: Validare necessità, UAT post-implementation',
  ARRAY['A.5.33', 'A.8.32'],
  'Change Management System, CMDB, Ambiente test/staging, Backup tools, Monitoring e alerting',
  'CAB Meeting: Settimanale | Emergency: On-demand',
  true
)
ON CONFLICT (template_code) DO NOTHING;