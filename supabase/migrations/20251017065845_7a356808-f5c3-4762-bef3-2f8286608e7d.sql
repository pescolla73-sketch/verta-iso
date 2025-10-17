-- Create app_role enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'auditor', 'viewer');

-- Create profiles table for user information
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (user_id, role)
);

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create controls table for ISO 27001:2022 Annex A controls
CREATE TABLE public.controls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  control_id TEXT UNIQUE NOT NULL,
  domain TEXT NOT NULL,
  title TEXT NOT NULL,
  objective TEXT,
  status TEXT DEFAULT 'not_implemented' CHECK (status IN ('not_implemented', 'partial', 'implemented', 'not_applicable')),
  implementation_notes TEXT,
  responsible TEXT,
  last_verification_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create assets table
CREATE TABLE public.assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  asset_type TEXT NOT NULL CHECK (asset_type IN ('hardware', 'software', 'data', 'people', 'services', 'facilities')),
  description TEXT,
  owner TEXT,
  criticality TEXT DEFAULT 'medium' CHECK (criticality IN ('low', 'medium', 'high', 'critical')),
  location TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create audits table
CREATE TABLE public.audits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_name TEXT NOT NULL,
  audit_type TEXT NOT NULL CHECK (audit_type IN ('internal', 'external', 'certification', 'surveillance')),
  audit_date DATE NOT NULL,
  auditor TEXT,
  status TEXT DEFAULT 'planned' CHECK (status IN ('planned', 'in_progress', 'completed', 'cancelled')),
  findings TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create evidences table
CREATE TABLE public.evidences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  file_url TEXT,
  file_name TEXT,
  file_type TEXT,
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create policies table
CREATE TABLE public.policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  policy_name TEXT NOT NULL,
  policy_type TEXT NOT NULL CHECK (policy_type IN ('security', 'privacy', 'access_control', 'incident_response', 'business_continuity', 'other')),
  content TEXT,
  version TEXT DEFAULT '1.0',
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'review', 'approved', 'archived')),
  approved_by TEXT,
  approval_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.controls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evidences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.policies ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- RLS Policies for user_roles
CREATE POLICY "Admins can manage all roles"
  ON public.user_roles FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for controls
CREATE POLICY "Everyone can view controls"
  ON public.controls FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins and auditors can update controls"
  ON public.controls FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'auditor'));

CREATE POLICY "Admins can insert controls"
  ON public.controls FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete controls"
  ON public.controls FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for assets
CREATE POLICY "Everyone can view assets"
  ON public.assets FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins and auditors can manage assets"
  ON public.assets FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'auditor'));

-- RLS Policies for audits
CREATE POLICY "Everyone can view audits"
  ON public.audits FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins and auditors can manage audits"
  ON public.audits FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'auditor'));

-- RLS Policies for evidences
CREATE POLICY "Everyone can view evidences"
  ON public.evidences FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can upload evidences"
  ON public.evidences FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = uploaded_by);

CREATE POLICY "Admins can manage all evidences"
  ON public.evidences FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for policies
CREATE POLICY "Everyone can view policies"
  ON public.policies FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage policies"
  ON public.policies FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Create trigger function for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at on all tables
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_controls_updated_at
  BEFORE UPDATE ON public.controls
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_assets_updated_at
  BEFORE UPDATE ON public.assets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_audits_updated_at
  BEFORE UPDATE ON public.audits
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_evidences_updated_at
  BEFORE UPDATE ON public.evidences
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_policies_updated_at
  BEFORE UPDATE ON public.policies
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger to automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.email
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Insert all 93 ISO 27001:2022 Annex A controls in Italian
-- Domain 5: Organizational Controls (37 controls)
INSERT INTO public.controls (control_id, domain, title, objective, status) VALUES
('5.1', 'Organizzativi', 'Politiche per la sicurezza delle informazioni', 'Definire e approvare le politiche di sicurezza delle informazioni da parte della direzione.', 'not_implemented'),
('5.2', 'Organizzativi', 'Ruoli e responsabilità per la sicurezza delle informazioni', 'Definire e assegnare ruoli e responsabilità per la sicurezza delle informazioni.', 'not_implemented'),
('5.3', 'Organizzativi', 'Segregazione dei compiti', 'Separare i compiti e le aree di responsabilità per ridurre opportunità di modifiche non autorizzate.', 'not_implemented'),
('5.4', 'Organizzativi', 'Responsabilità della direzione', 'La direzione deve richiedere a tutto il personale di applicare la sicurezza delle informazioni.', 'not_implemented'),
('5.5', 'Organizzativi', 'Contatti con le autorità', 'Mantenere contatti appropriati con le autorità competenti.', 'not_implemented'),
('5.6', 'Organizzativi', 'Contatti con gruppi di interesse speciale', 'Mantenere contatti con gruppi di interesse speciale e forum professionali sulla sicurezza.', 'not_implemented'),
('5.7', 'Organizzativi', 'Threat intelligence', 'Raccogliere e analizzare informazioni sulle minacce alla sicurezza delle informazioni.', 'not_implemented'),
('5.8', 'Organizzativi', 'Sicurezza delle informazioni nella gestione dei progetti', 'Integrare la sicurezza delle informazioni nella gestione dei progetti.', 'not_implemented'),
('5.9', 'Organizzativi', 'Inventario delle informazioni e altre risorse associate', 'Identificare, documentare e mantenere un inventario delle informazioni e delle risorse.', 'not_implemented'),
('5.10', 'Organizzativi', 'Uso accettabile delle informazioni e altre risorse associate', 'Identificare, documentare e implementare regole per l''uso accettabile delle informazioni.', 'not_implemented'),
('5.11', 'Organizzativi', 'Restituzione delle risorse', 'Garantire che il personale restituisca tutte le risorse organizzative al termine del rapporto.', 'not_implemented'),
('5.12', 'Organizzativi', 'Classificazione delle informazioni', 'Classificare le informazioni in base alle esigenze di sicurezza dell''organizzazione.', 'not_implemented'),
('5.13', 'Organizzativi', 'Etichettatura delle informazioni', 'Sviluppare e implementare procedure appropriate per l''etichettatura delle informazioni.', 'not_implemented'),
('5.14', 'Organizzativi', 'Trasferimento delle informazioni', 'Mantenere la sicurezza delle informazioni durante il trasferimento.', 'not_implemented'),
('5.15', 'Organizzativi', 'Controllo degli accessi', 'Stabilire regole per controllare l''accesso fisico e logico alle informazioni.', 'not_implemented'),
('5.16', 'Organizzativi', 'Gestione delle identità', 'Gestire il ciclo di vita completo delle identità.', 'not_implemented'),
('5.17', 'Organizzativi', 'Informazioni di autenticazione', 'Gestire in modo sicuro l''allocazione e la gestione delle informazioni di autenticazione.', 'not_implemented'),
('5.18', 'Organizzativi', 'Diritti di accesso', 'Fornire e gestire i diritti di accesso alle informazioni e alle risorse.', 'not_implemented'),
('5.19', 'Organizzativi', 'Sicurezza delle informazioni nelle relazioni con i fornitori', 'Definire e concordare la sicurezza delle informazioni nelle relazioni con i fornitori.', 'not_implemented'),
('5.20', 'Organizzativi', 'Gestione della sicurezza delle informazioni nei contratti con i fornitori', 'Stabilire requisiti di sicurezza delle informazioni nei contratti con i fornitori.', 'not_implemented'),
('5.21', 'Organizzativi', 'Gestione della sicurezza delle informazioni nella supply chain ICT', 'Stabilire processi per gestire i rischi di sicurezza nella supply chain ICT.', 'not_implemented'),
('5.22', 'Organizzativi', 'Monitoraggio, revisione e gestione del cambiamento dei servizi dei fornitori', 'Monitorare, revisionare e gestire i cambiamenti nei servizi dei fornitori.', 'not_implemented'),
('5.23', 'Organizzativi', 'Sicurezza delle informazioni per l''uso di servizi cloud', 'Stabilire processi per l''acquisizione, uso, gestione e uscita dai servizi cloud.', 'not_implemented'),
('5.24', 'Organizzativi', 'Pianificazione e preparazione della gestione degli incidenti di sicurezza delle informazioni', 'Pianificare e prepararsi alla gestione degli incidenti di sicurezza delle informazioni.', 'not_implemented'),
('5.25', 'Organizzativi', 'Valutazione e decisione sugli eventi di sicurezza delle informazioni', 'Valutare gli eventi di sicurezza e decidere se classificarli come incidenti.', 'not_implemented'),
('5.26', 'Organizzativi', 'Risposta agli incidenti di sicurezza delle informazioni', 'Rispondere agli incidenti di sicurezza secondo procedure documentate.', 'not_implemented'),
('5.27', 'Organizzativi', 'Apprendimento dagli incidenti di sicurezza delle informazioni', 'Utilizzare la conoscenza acquisita dagli incidenti per rafforzare la sicurezza.', 'not_implemented'),
('5.28', 'Organizzativi', 'Raccolta di prove', 'Stabilire procedure per identificare, raccogliere, acquisire e preservare prove.', 'not_implemented'),
('5.29', 'Organizzativi', 'Sicurezza delle informazioni durante le interruzioni', 'Pianificare come mantenere la sicurezza delle informazioni durante le interruzioni.', 'not_implemented'),
('5.30', 'Organizzativi', 'Preparazione delle ICT per la continuità operativa', 'Preparare le ICT per garantire la continuità operativa.', 'not_implemented'),
('5.31', 'Organizzativi', 'Requisiti legali, statutari, regolamentari e contrattuali', 'Identificare, documentare e soddisfare i requisiti legali e contrattuali.', 'not_implemented'),
('5.32', 'Organizzativi', 'Diritti di proprietà intellettuale', 'Implementare procedure per proteggere i diritti di proprietà intellettuale.', 'not_implemented'),
('5.33', 'Organizzativi', 'Protezione dei record', 'Proteggere i record dalla perdita, distruzione, falsificazione e accesso non autorizzato.', 'not_implemented'),
('5.34', 'Organizzativi', 'Privacy e protezione delle PII', 'Identificare e soddisfare i requisiti per la protezione delle informazioni personali.', 'not_implemented'),
('5.35', 'Organizzativi', 'Revisione indipendente della sicurezza delle informazioni', 'Condurre revisioni indipendenti del sistema di gestione della sicurezza delle informazioni.', 'not_implemented'),
('5.36', 'Organizzativi', 'Conformità con le politiche, regole e standard per la sicurezza delle informazioni', 'Verificare la conformità con le politiche, regole e standard di sicurezza.', 'not_implemented'),
('5.37', 'Organizzativi', 'Procedure operative documentate', 'Documentare le procedure operative e renderle disponibili al personale.', 'not_implemented'),

-- Domain 6: People Controls (8 controls)
('6.1', 'Persone', 'Screening', 'Condurre verifiche dei precedenti su tutti i candidati prima dell''assunzione.', 'not_implemented'),
('6.2', 'Persone', 'Termini e condizioni di impiego', 'Includere responsabilità di sicurezza delle informazioni nei contratti di lavoro.', 'not_implemented'),
('6.3', 'Persone', 'Sensibilizzazione, educazione e formazione sulla sicurezza delle informazioni', 'Fornire formazione continua sulla sicurezza delle informazioni.', 'not_implemented'),
('6.4', 'Persone', 'Processo disciplinare', 'Stabilire un processo disciplinare per le violazioni della sicurezza.', 'not_implemented'),
('6.5', 'Persone', 'Responsabilità dopo la cessazione o il cambiamento del rapporto di lavoro', 'Definire le responsabilità di sicurezza valide dopo la cessazione del rapporto.', 'not_implemented'),
('6.6', 'Persone', 'Accordi di riservatezza o di non divulgazione', 'Utilizzare accordi di riservatezza per proteggere le informazioni sensibili.', 'not_implemented'),
('6.7', 'Persone', 'Lavoro remoto', 'Implementare misure di sicurezza per il lavoro remoto.', 'not_implemented'),
('6.8', 'Persone', 'Segnalazione di eventi di sicurezza delle informazioni', 'Fornire meccanismi per segnalare eventi di sicurezza osservati o sospetti.', 'not_implemented'),

-- Domain 7: Physical Controls (14 controls)
('7.1', 'Fisici', 'Perimetri di sicurezza fisica', 'Definire e utilizzare perimetri di sicurezza per proteggere le aree sensibili.', 'not_implemented'),
('7.2', 'Fisici', 'Ingresso fisico', 'Proteggere le aree sicure con controlli di ingresso appropriati.', 'not_implemented'),
('7.3', 'Fisici', 'Sicurezza di uffici, stanze e strutture', 'Progettare e applicare la sicurezza fisica per uffici, stanze e strutture.', 'not_implemented'),
('7.4', 'Fisici', 'Monitoraggio della sicurezza fisica', 'Monitorare continuamente i locali per rilevare accessi fisici non autorizzati.', 'not_implemented'),
('7.5', 'Fisici', 'Protezione contro le minacce fisiche e ambientali', 'Proteggere da minacce fisiche e ambientali come disastri naturali.', 'not_implemented'),
('7.6', 'Fisici', 'Lavorare in aree sicure', 'Applicare misure di sicurezza per il lavoro in aree sicure.', 'not_implemented'),
('7.7', 'Fisici', 'Clear desk e clear screen', 'Adottare politiche di scrivania pulita e schermo pulito.', 'not_implemented'),
('7.8', 'Fisici', 'Posizionamento e protezione delle apparecchiature', 'Posizionare e proteggere le apparecchiature per ridurre i rischi.', 'not_implemented'),
('7.9', 'Fisici', 'Sicurezza delle risorse fuori sede', 'Proteggere le risorse fuori sede indipendentemente dalla loro ubicazione.', 'not_implemented'),
('7.10', 'Fisici', 'Supporti di memorizzazione', 'Gestire i supporti di memorizzazione durante il loro ciclo di vita.', 'not_implemented'),
('7.11', 'Fisici', 'Servizi di supporto', 'Proteggere le apparecchiature da interruzioni di alimentazione e altre interruzioni.', 'not_implemented'),
('7.12', 'Fisici', 'Sicurezza del cablaggio', 'Proteggere i cavi da intercettazioni, interferenze o danni.', 'not_implemented'),
('7.13', 'Fisici', 'Manutenzione delle apparecchiature', 'Mantenere le apparecchiature per garantirne disponibilità, integrità e riservatezza.', 'not_implemented'),
('7.14', 'Fisici', 'Smaltimento o riutilizzo sicuro delle apparecchiature', 'Verificare che le apparecchiature siano ripulite prima dello smaltimento o riutilizzo.', 'not_implemented'),

-- Domain 8: Technological Controls (34 controls)
('8.1', 'Tecnologici', 'Dispositivi endpoint degli utenti', 'Proteggere le informazioni memorizzate, elaborate o accessibili tramite dispositivi endpoint.', 'not_implemented'),
('8.2', 'Tecnologici', 'Diritti di accesso privilegiati', 'Gestire l''allocazione e l''uso dei diritti di accesso privilegiati.', 'not_implemented'),
('8.3', 'Tecnologici', 'Restrizione dell''accesso alle informazioni', 'Limitare l''accesso alle informazioni e alle risorse in base ai requisiti di business.', 'not_implemented'),
('8.4', 'Tecnologici', 'Accesso al codice sorgente', 'Gestire l''accesso in lettura e scrittura al codice sorgente, strumenti e librerie.', 'not_implemented'),
('8.5', 'Tecnologici', 'Autenticazione sicura', 'Implementare tecnologie e procedure di autenticazione sicure.', 'not_implemented'),
('8.6', 'Tecnologici', 'Gestione della capacità', 'Monitorare, accordare e fare proiezioni sull''uso delle risorse.', 'not_implemented'),
('8.7', 'Tecnologici', 'Protezione contro il malware', 'Implementare protezioni contro il malware combinate con consapevolezza degli utenti.', 'not_implemented'),
('8.8', 'Tecnologici', 'Gestione delle vulnerabilità tecniche', 'Identificare, valutare e gestire le vulnerabilità tecniche.', 'not_implemented'),
('8.9', 'Tecnologici', 'Gestione della configurazione', 'Stabilire, documentare e mantenere configurazioni di sicurezza.', 'not_implemented'),
('8.10', 'Tecnologici', 'Cancellazione delle informazioni', 'Cancellare le informazioni quando non più necessarie.', 'not_implemented'),
('8.11', 'Tecnologici', 'Data masking', 'Utilizzare il mascheramento dei dati secondo le politiche dell''organizzazione.', 'not_implemented'),
('8.12', 'Tecnologici', 'Prevenzione della fuga di dati', 'Applicare misure di prevenzione della fuga di dati ai sistemi e alle reti.', 'not_implemented'),
('8.13', 'Tecnologici', 'Backup delle informazioni', 'Mantenere copie di backup delle informazioni, software e sistemi.', 'not_implemented'),
('8.14', 'Tecnologici', 'Ridondanza delle strutture di elaborazione delle informazioni', 'Implementare strutture di elaborazione con ridondanza sufficiente.', 'not_implemented'),
('8.15', 'Tecnologici', 'Logging', 'Produrre, conservare e analizzare log di eventi, attività ed eccezioni.', 'not_implemented'),
('8.16', 'Tecnologici', 'Attività di monitoraggio', 'Monitorare reti, sistemi e applicazioni per comportamenti anomali.', 'not_implemented'),
('8.17', 'Tecnologici', 'Sincronizzazione degli orologi', 'Sincronizzare gli orologi dei sistemi con fonti temporali approvate.', 'not_implemented'),
('8.18', 'Tecnologici', 'Uso di programmi di utilità privilegiati', 'Limitare e controllare l''uso di programmi di utilità privilegiati.', 'not_implemented'),
('8.19', 'Tecnologici', 'Installazione di software su sistemi operativi', 'Implementare procedure per controllare l''installazione di software.', 'not_implemented'),
('8.20', 'Tecnologici', 'Sicurezza delle reti', 'Proteggere le reti e le strutture di rete.', 'not_implemented'),
('8.21', 'Tecnologici', 'Sicurezza dei servizi di rete', 'Identificare, implementare e monitorare meccanismi di sicurezza per i servizi di rete.', 'not_implemented'),
('8.22', 'Tecnologici', 'Segregazione delle reti', 'Segregare gruppi di servizi informativi, utenti e sistemi informativi.', 'not_implemented'),
('8.23', 'Tecnologici', 'Filtraggio web', 'Gestire l''accesso a siti web esterni per ridurre l''esposizione a contenuti dannosi.', 'not_implemented'),
('8.24', 'Tecnologici', 'Uso della crittografia', 'Definire e implementare regole per l''uso efficace della crittografia.', 'not_implemented'),
('8.25', 'Tecnologici', 'Ciclo di vita dello sviluppo sicuro', 'Stabilire regole per lo sviluppo sicuro del software e dei sistemi.', 'not_implemented'),
('8.26', 'Tecnologici', 'Requisiti di sicurezza delle applicazioni', 'Identificare, specificare e approvare requisiti di sicurezza per le applicazioni.', 'not_implemented'),
('8.27', 'Tecnologici', 'Principi di progettazione e architettura di sistemi sicuri', 'Stabilire principi di progettazione sicura per sistemi e applicazioni.', 'not_implemented'),
('8.28', 'Tecnologici', 'Codifica sicura', 'Applicare principi di codifica sicura nello sviluppo software.', 'not_implemented'),
('8.29', 'Tecnologici', 'Test di sicurezza nello sviluppo e nell''accettazione', 'Definire ed eseguire processi di test di sicurezza nel ciclo di sviluppo.', 'not_implemented'),
('8.30', 'Tecnologici', 'Sviluppo esternalizzato', 'Supervisionare e monitorare le attività di sviluppo esternalizzate.', 'not_implemented'),
('8.31', 'Tecnologici', 'Separazione degli ambienti di sviluppo, test e produzione', 'Separare gli ambienti di sviluppo, test e produzione.', 'not_implemented'),
('8.32', 'Tecnologici', 'Gestione del cambiamento', 'Gestire i cambiamenti alle strutture di elaborazione e trattamento delle informazioni.', 'not_implemented'),
('8.33', 'Tecnologici', 'Informazioni di test', 'Proteggere adeguatamente i dati di test.', 'not_implemented'),
('8.34', 'Tecnologici', 'Protezione dei sistemi informativi durante i test di audit', 'Pianificare e concordare test di audit per minimizzare le interruzioni.', 'not_implemented');