-- Add implementation guide fields to controls table
ALTER TABLE public.controls
ADD COLUMN guida_significato text,
ADD COLUMN guida_implementazione text,
ADD COLUMN guida_evidenze text,
ADD COLUMN guida_errori text;

-- Populate control 5.1 with Italian implementation guide content
UPDATE public.controls
SET 
  guida_significato = 'Questo controllo richiede che l''organizzazione definisca, approvi e pubblichi una politica di sicurezza delle informazioni. La politica rappresenta il documento principale che stabilisce l''impegno della direzione verso la sicurezza e definisce gli obiettivi e i principi generali di sicurezza dell''organizzazione.',
  guida_implementazione = E'1. Redigere un documento di politica di sicurezza che copra:\n   - Obiettivi di sicurezza dell''organizzazione\n   - Ruoli e responsabilità\n   - Conformità legale e normativa\n   - Gestione dei rischi\n\n2. Ottenere l''approvazione formale dalla direzione\n\n3. Comunicare la politica a tutti i dipendenti e parti interessate\n\n4. Pubblicare la politica su intranet o sistema documentale\n\n5. Pianificare revisioni periodiche (almeno annuali)',
  guida_evidenze = E'- Documento della politica di sicurezza firmato e approvato\n- Verbale di approvazione del management\n- Prova di pubblicazione (screenshot intranet, email di comunicazione)\n- Lista di distribuzione con conferme di lettura\n- Registro delle revisioni del documento\n- Attestati di formazione sulla politica',
  guida_errori = E'- Creare una politica troppo generica o copiata da template senza personalizzazione\n- Non ottenere l''approvazione formale della direzione\n- Pubblicare la politica ma non comunicarla efficacemente\n- Non pianificare revisioni periodiche\n- Usare linguaggio troppo tecnico inaccessibile agli utenti\n- Non allineare la politica con gli obiettivi di business'
WHERE control_id = '5.1';