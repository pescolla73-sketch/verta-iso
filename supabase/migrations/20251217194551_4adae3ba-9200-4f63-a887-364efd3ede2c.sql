-- =====================================================
-- ESTENDI POLICY TEMPLATES CON CAMPI AGGIUNTIVI
-- =====================================================

-- Aggiungi colonne mancanti alla tabella esistente
ALTER TABLE public.policy_templates 
ADD COLUMN IF NOT EXISTS template_code TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS policy_number TEXT,
ADD COLUMN IF NOT EXISTS responsibilities_template TEXT,
ADD COLUMN IF NOT EXISTS related_controls TEXT[],
ADD COLUMN IF NOT EXISTS related_clauses TEXT[],
ADD COLUMN IF NOT EXISTS is_mandatory BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS version TEXT DEFAULT '1.0',
ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'it';

-- Indici
CREATE INDEX IF NOT EXISTS idx_policy_templates_mandatory ON public.policy_templates(is_mandatory);
CREATE INDEX IF NOT EXISTS idx_policy_templates_code ON public.policy_templates(template_code);

-- =====================================================
-- POPOLA TEMPLATE POLICY OBBLIGATORIE
-- =====================================================

INSERT INTO public.policy_templates (
  template_code,
  name,
  category,
  policy_number,
  purpose_template,
  scope_template,
  policy_statement_template,
  responsibilities_template,
  related_controls,
  related_clauses,
  is_mandatory,
  iso_reference
) VALUES 

-- 1. INFORMATION SECURITY POLICY (OBBLIGATORIA)
(
  'ISO_ISP_001',
  'Politica di Sicurezza delle Informazioni',
  'mandatory',
  'POL-001',
  'Definire l''approccio dell''organizzazione alla gestione della sicurezza delle informazioni e stabilire la direzione strategica per proteggere gli asset informativi.',
  'Questa policy si applica a tutti i dipendenti, collaboratori, fornitori e terze parti che hanno accesso alle informazioni e ai sistemi dell''organizzazione.',
  E'L''organizzazione si impegna a:\n\n- Proteggere la confidenzialità, integrità e disponibilità delle informazioni\n- Gestire i rischi per la sicurezza delle informazioni in modo sistematico\n- Garantire la conformità con leggi, regolamenti e obblighi contrattuali\n- Migliorare continuamente l''efficacia del Sistema di Gestione della Sicurezza delle Informazioni (ISMS)\n- Fornire risorse adeguate per implementare e mantenere l''ISMS\n- Promuovere consapevolezza e formazione sulla sicurezza\n- Rispondere prontamente agli incidenti di sicurezza\n\nTutti i dipendenti sono responsabili di:\n- Proteggere le informazioni aziendali\n- Segnalare incidenti di sicurezza\n- Rispettare le policy e procedure di sicurezza\n- Partecipare alla formazione sulla sicurezza',
  E'Management: Approvare e supportare la policy\nCISO/Responsabile Sicurezza: Implementare e mantenere ISMS\nDipendenti: Rispettare policy e segnalare incidenti\nIT: Implementare controlli tecnici',
  ARRAY['A.5.1', 'A.5.2', 'A.5.3'],
  ARRAY['5.1', '5.2', '5.3'],
  true,
  ARRAY['A.5.1', 'A.5.2', 'A.5.3']
),

-- 2. ACCESS CONTROL POLICY
(
  'ISO_ACP_001',
  'Politica di Controllo Accessi',
  'mandatory',
  'POL-002',
  'Garantire che l''accesso alle informazioni e ai sistemi sia limitato agli utenti autorizzati e sia appropriato alle loro responsabilità lavorative.',
  'Tutti i sistemi informativi, applicazioni, database e risorse di rete dell''organizzazione.',
  E'Principi di controllo accessi:\n\n- Least Privilege: Accesso minimo necessario\n- Need-to-Know: Solo informazioni necessarie per il ruolo\n- Separation of Duties: Funzioni critiche separate\n- Strong Authentication: Password robuste + MFA dove possibile\n\nProcesso di gestione accessi:\n1. Richiesta formale con approvazione manager\n2. Provisioning basato su ruolo e responsabilità\n3. Revisione periodica accessi (trimestrale)\n4. Revoca immediata in caso di cessazione/cambio ruolo\n\nRequisiti password:\n- Minimo 12 caratteri\n- Complessità: maiuscole, minuscole, numeri, simboli\n- Cambio ogni 90 giorni\n- No riutilizzo ultime 5 password\n- No condivisione password\n\nAccount privilegiati:\n- MFA obbligatorio\n- Logging completo attività\n- Revisione settimanale log\n- Accesso just-in-time quando possibile',
  E'Manager: Approvare richieste accesso team\nIT/Security: Gestire provisioning e monitoraggio\nUtenti: Proteggere credenziali e segnalare anomalie\nAuditor: Verificare conformità policy',
  ARRAY['A.5.15', 'A.5.16', 'A.5.17', 'A.5.18', 'A.8.2', 'A.8.3', 'A.8.5'],
  ARRAY['5.15', '5.16', '8.2', '8.3'],
  true,
  ARRAY['A.5.15', 'A.5.16', 'A.5.17', 'A.5.18']
),

-- 3. ACCEPTABLE USE POLICY
(
  'ISO_AUP_001',
  'Politica di Uso Accettabile',
  'mandatory',
  'POL-003',
  'Definire l''uso appropriato delle risorse IT aziendali e prevenire utilizzi impropri che potrebbero esporre l''organizzazione a rischi.',
  'Tutti i dispositivi, sistemi, reti, email e risorse IT fornite dall''organizzazione.',
  E'Uso consentito:\n- Attività lavorative e comunicazioni professionali\n- Uso personale minimo e occasionale (email, navigazione)\n- Formazione e sviluppo professionale\n\nUso vietato:\n- Installazione software non autorizzato\n- Download contenuti illegali o inappropriati\n- Accesso a siti web malevoli o non sicuri\n- Condivisione credenziali di accesso\n- Uso di dispositivi personali non approvati (BYOD)\n- Attività commerciali personali\n- Violazione copyright o proprietà intellettuale\n- Molestie, discriminazione, hate speech\n\nEmail e comunicazioni:\n- Email aziendali solo per scopi professionali\n- No spam o catene\n- Attenzione a phishing e allegati sospetti\n- Classificare informazioni sensibili\n\nMonitoraggio:\nL''organizzazione si riserva il diritto di monitorare l''uso delle risorse IT per garantire conformità e sicurezza.',
  E'Dipendenti: Rispettare policy e segnalare violazioni\nManager: Far rispettare policy nel proprio team\nIT/Security: Monitorare e investigare violazioni\nHR: Gestire provvedimenti disciplinari',
  ARRAY['A.5.10', 'A.6.7', 'A.8.1', 'A.8.23'],
  ARRAY['5.10', '6.7', '8.1'],
  true,
  ARRAY['A.5.10', 'A.6.7', 'A.8.1']
),

-- 4. INCIDENT RESPONSE POLICY
(
  'ISO_IRP_001',
  'Politica di Gestione Incidenti',
  'mandatory',
  'POL-004',
  'Stabilire un approccio strutturato per identificare, segnalare, gestire e imparare dagli incidenti di sicurezza.',
  'Tutti gli incidenti di sicurezza che coinvolgono sistemi, dati o persone dell''organizzazione.',
  E'Definizione incidente di sicurezza:\nQualsiasi evento che compromette confidenzialità, integrità o disponibilità delle informazioni.\n\nClassificazione severità:\n- CRITICO: Impatto operativo grave, dati sensibili esposti\n- ALTO: Impatto significativo su servizi o dati\n- MEDIO: Impatto limitato, contenuto rapidamente\n- BASSO: Impatto minimo, nessuna perdita dati\n\nProcesso di gestione:\n1. DETECTION: Identificare potenziale incidente\n2. REPORTING: Segnalare a IT/Security entro 1 ora\n3. ASSESSMENT: Valutare severità e impatto\n4. CONTAINMENT: Isolare e contenere incidente\n5. ERADICATION: Eliminare causa root\n6. RECOVERY: Ripristinare operazioni normali\n7. LESSONS LEARNED: Documentare e migliorare\n\nTempi di risposta:\n- Critico: Risposta immediata (<15 min)\n- Alto: Entro 1 ora\n- Medio: Entro 4 ore\n- Basso: Entro 24 ore',
  E'Tutti i dipendenti: Segnalare incidenti\nIncident Response Team: Gestire risposta\nCISO: Coordinare e comunicare\nManagement: Supportare risorse necessarie\nLegal/Compliance: Gestire obblighi normativi',
  ARRAY['A.5.24', 'A.5.25', 'A.5.26', 'A.5.27', 'A.6.8'],
  ARRAY['5.24', '5.25', '5.26', '6.8'],
  true,
  ARRAY['A.5.24', 'A.5.25', 'A.5.26', 'A.5.27']
),

-- 5. BACKUP & RECOVERY POLICY
(
  'ISO_BRP_001',
  'Politica di Backup e Recupero',
  'mandatory',
  'POL-005',
  'Garantire che i dati critici siano protetti attraverso backup regolari e possano essere recuperati rapidamente in caso di perdita o disaster.',
  'Tutti i dati, sistemi e applicazioni critiche dell''organizzazione.',
  E'Classificazione dati per backup:\n\nTIER 1 - CRITICO:\n- Dati clienti e transazioni\n- Database produzione\n- Configurazioni sistemi critici\n- Backup: Ogni ora + replica real-time\n- Retention: 30 giorni + 12 mesi archivio\n\nTIER 2 - IMPORTANTE:\n- File condivisi e documenti\n- Email e comunicazioni\n- Applicazioni non critiche\n- Backup: Giornaliero\n- Retention: 14 giorni + 6 mesi archivio\n\nRecovery Time Objective (RTO):\n- Sistemi critici: 4 ore\n- Sistemi importanti: 24 ore\n- Sistemi standard: 72 ore\n\nRecovery Point Objective (RPO):\n- Dati critici: 1 ora\n- Dati importanti: 24 ore\n- Dati standard: 7 giorni\n\nTesting:\n- Test recupero dati: Mensile\n- Disaster Recovery Drill: Semestrale',
  E'IT Operations: Gestire infrastruttura backup\nData Owners: Classificare criticità dati\nCISO: Verificare compliance policy\nAuditor: Test periodici recupero',
  ARRAY['A.5.29', 'A.5.30', 'A.8.13', 'A.8.14'],
  ARRAY['5.29', '5.30', '8.13'],
  true,
  ARRAY['A.5.29', 'A.5.30', 'A.8.13', 'A.8.14']
),

-- 6. REMOTE WORK POLICY
(
  'ISO_RWP_001',
  'Politica Lavoro Remoto',
  'recommended',
  'POL-006',
  'Definire requisiti di sicurezza per il lavoro da remoto proteggendo informazioni aziendali fuori dall''ufficio.',
  'Tutti i dipendenti che lavorano da casa, in smart working o da location remote.',
  E'Requisiti dispositivi:\n\nLaptop/Computer:\n- Solo dispositivi aziendali approvati o BYOD certificato\n- Antivirus aggiornato e attivo\n- Firewall abilitato\n- Crittografia disco completo (BitLocker/FileVault)\n- Screen lock automatico (5 minuti inattività)\n- Aggiornamenti sistema automatici\n\nConnessione rete:\n- VPN aziendale obbligatoria per accesso risorse\n- No WiFi pubblici non sicuri per dati sensibili\n- Password WiFi casa robusta (WPA3)\n\nSicurezza fisica:\n- Lavorare in ambiente privato/sicuro\n- No screen visibili a non autorizzati\n- Lock dispositivo quando non presidiato\n- No documenti sensibili in spazi pubblici\n\nCompliance:\n- Stessi obblighi di sicurezza dell''ufficio\n- Audit periodici compliance\n- Formazione specifica lavoro remoto',
  E'Dipendenti remoti: Rispettare requisiti sicurezza\nManager: Monitorare compliance team\nIT: Fornire supporto e strumenti\nSecurity: Audit e monitoraggio',
  ARRAY['A.6.7', 'A.7.6', 'A.8.1', 'A.8.2'],
  ARRAY['6.7', '7.6', '8.1'],
  false,
  ARRAY['A.6.7', 'A.7.6', 'A.8.1', 'A.8.2']
)
ON CONFLICT (template_code) DO NOTHING;