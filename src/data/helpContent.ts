interface HelpContent {
  [key: string]: {
    title: string;
    description: string;
    extendedHelp?: string;
    examples?: string[];
    relatedLinks?: { label: string; path: string }[];
  };
}

export const helpContent: HelpContent = {
  // SETUP AZIENDA
  'setup-scope': {
    title: 'Ambito ISMS',
    description: 'Definisce quali processi, sistemi e persone sono coperti dal Sistema di Gestione della Sicurezza delle Informazioni',
    extendedHelp: `L'ambito ISMS è il perimetro del tuo sistema di gestione. Deve includere:

- Processi aziendali coinvolti
- Sistemi informatici e infrastrutture
- Sedi fisiche coperte
- Personale coinvolto

L'ambito deve essere:
- Chiaro e misurabile
- Realistico (copri quello che puoi gestire)
- Documentato formalmente
- Approvato dal management`,
    examples: [
      'Sistema IT della sede di Milano, inclusi server, workstation e rete',
      'Processi di gestione dati clienti per il reparto vendite e marketing',
      'Infrastruttura cloud per applicazioni web aziendali'
    ],
    relatedLinks: [
      { label: 'Guida Setup Completo', path: '/guida/setup' }
    ]
  },

  'setup-context': {
    title: 'Contesto Organizzazione',
    description: 'Analisi dei fattori interni ed esterni che possono influenzare il tuo ISMS',
    extendedHelp: `Il contesto identifica tutti i fattori che influenzano la sicurezza:

FATTORI ESTERNI:
- Normative e leggi (GDPR, NIS2, ecc.)
- Concorrenza e mercato
- Fornitori e partner
- Minacce cyber del settore

FATTORI INTERNI:
- Cultura aziendale
- Risorse disponibili
- Struttura organizzativa
- Tecnologie utilizzate`,
    examples: [
      'Esterno: Nuova normativa GDPR richiede protezione dati personali',
      'Interno: Team IT piccolo con competenze limitate sulla sicurezza',
      'Esterno: Aumento attacchi ransomware nel nostro settore'
    ]
  },

  'setup-boundaries': {
    title: 'Confini ISMS',
    description: 'Delimitazione precisa di cosa è incluso e cosa è escluso dal sistema di gestione',
    extendedHelp: `I confini definiscono chiaramente cosa è dentro e cosa è fuori dall'ISMS:

INCLUDI:
- Sedi fisiche coperte
- Dipartimenti coinvolti
- Sistemi e applicazioni
- Fornitori critici

ESCLUDI:
- Sedi non coperte
- Processi non rilevanti
- Sistemi legacy in dismissione`,
    examples: [
      'Incluso: Sede centrale, datacenter primario, rete VPN',
      'Escluso: Uffici commerciali esteri, sistemi legacy pre-2020'
    ]
  },

  // RISK ASSESSMENT
  'risk-probability': {
    title: 'Probabilità Rischio',
    description: 'Stima la frequenza con cui un rischio potrebbe verificarsi',
    extendedHelp: `La probabilità si valuta su scala 1-5:

1 - MOLTO BASSA: Evento rarissimo, quasi impossibile
2 - BASSA: Potrebbe accadere in casi eccezionali
3 - MEDIA: Potrebbe accadere occasionalmente
4 - ALTA: Probabile che accada nel medio termine
5 - MOLTO ALTA: Quasi certo che accada a breve

Considera:
- Storico incidenti simili
- Minacce del settore
- Vulnerabilità esistenti
- Controlli già in atto`,
    examples: [
      'Phishing: Probabilità 4 (Alta) - attacchi frequenti via email',
      'Incendio datacenter: Probabilità 1 (Molto Bassa) - evento raro',
      'Errore umano: Probabilità 3 (Media) - può capitare occasionalmente'
    ]
  },

  'risk-impact': {
    title: 'Impatto Rischio',
    description: 'Valuta le conseguenze se il rischio si verificasse',
    extendedHelp: `L'impatto misura il danno potenziale su scala 1-5:

1 - TRASCURABILE: Nessun impatto significativo
2 - MINORE: Piccoli disagi operativi
3 - MODERATO: Interruzione temporanea servizi
4 - GRAVE: Perdita dati, danno reputazionale
5 - CATASTROFICO: Chiusura attività, perdite enormi

Considera l'impatto su:
- Confidenzialità (dati esposti?)
- Integrità (dati modificati?)
- Disponibilità (servizi bloccati?)
- Reputazione aziendale
- Conformità legale
- Costi economici`,
    examples: [
      'Ransomware: Impatto 5 (Catastrofico) - blocco totale operazioni',
      'Password debole: Impatto 3 (Moderato) - accesso non autorizzato',
      'Spam: Impatto 1 (Trascurabile) - solo fastidio'
    ]
  },

  'risk-treatment': {
    title: 'Trattamento Rischio',
    description: 'Strategia per gestire il rischio identificato',
    extendedHelp: `Esistono 4 opzioni di trattamento:

1. MITIGARE (più comune)
   Applica controlli per ridurre probabilità/impatto
   Es: Antivirus, firewall, formazione

2. TRASFERIRE
   Sposta il rischio a terzi (assicurazione, outsourcing)
   Es: Assicurazione cyber, cloud provider certificato

3. EVITARE
   Elimina l'attività rischiosa
   Es: Non usare sistemi obsoleti, non trattare dati sensibili

4. ACCETTARE
   Accetti il rischio senza azioni
   Es: Rischio basso con costo controllo > danno potenziale

Scegli in base a:
- Livello rischio (alto = mitigare)
- Costi implementazione controlli
- Efficacia controllo disponibile`,
    examples: [
      'Phishing → MITIGARE con formazione e filtri email',
      'Perdita dati → TRASFERIRE con backup cloud certificato',
      'Sistema legacy → EVITARE migrando a sistema moderno',
      'Rischio basso su sistema secondario → ACCETTARE'
    ]
  },

  // CONTROLLI
  'control-implementation': {
    title: 'Stato Implementazione Controllo',
    description: 'Indica quanto il controllo è stato applicato nella tua organizzazione',
    extendedHelp: `Stati disponibili:

- IMPLEMENTATO: Controllo completamente operativo
- PARZIALMENTE IMPLEMENTATO: Controllo in fase di completamento
- NON IMPLEMENTATO: Controllo non ancora attivo
- NON APPLICABILE: Controllo non necessario per il tuo contesto

Come valutare:
1. Verifica se esiste documentazione
2. Controlla se c'è evidenza operativa
3. Testa l'efficacia nella pratica
4. Documenta eventuali gap`,
    examples: [
      'Firewall installato e configurato = IMPLEMENTATO',
      'Policy scritta ma non ancora comunicata = PARZIALMENTE',
      'Backup pianificato ma non attivo = NON IMPLEMENTATO',
      'Controllo datacenter fisico ma sei in cloud = NON APPLICABILE'
    ]
  },

  // SoA
  'soa-justification': {
    title: 'Giustificazione Scelta',
    description: 'Spiega perché hai incluso o escluso questo controllo',
    extendedHelp: `Per ogni controllo devi documentare:

SE INCLUSO:
- Quali rischi mitiga
- Come lo implementi
- Chi è responsabile
- Evidenze disponibili

SE ESCLUSO:
- Perché non applicabile
- Quali controlli alternativi usi
- Analisi del rischio residuo
- Approvazione management

La giustificazione deve essere:
- Chiara e specifica
- Basata su analisi rischi
- Documentata formalmente
- Tracciabile nell'audit`,
    examples: [
      'Incluso: A.8.1 - Inventario asset essenziale per tracciare dati critici',
      'Escluso: A.7.4 - Monitoraggio fisico non applicabile (siamo in cloud)',
      'Incluso: A.9.1 - Controllo accessi logici per proteggere dati clienti'
    ]
  },

  // NON CONFORMITÀ
  'nc-severity': {
    title: 'Severità Non Conformità',
    description: 'Classifica la gravità della non conformità rilevata',
    extendedHelp: `Livelli di severità:

MAGGIORE:
- Mancanza sistematica di un requisito
- Assenza totale di un controllo richiesto
- Inefficacia totale del sistema

MINORE:
- Singola deviazione dal requisito
- Controllo parzialmente inefficace
- Gap isolato senza impatto sistemico

OSSERVAZIONE:
- Area di miglioramento
- Non è una vera NC
- Suggerimento per ottimizzazione`,
    examples: [
      'Maggiore: Nessun backup dei dati critici da 6 mesi',
      'Minore: Un documento policy non aggiornato',
      'Osservazione: Suggeriamo di migliorare la reportistica'
    ]
  },

  'nc-root-cause': {
    title: 'Analisi Causa Radice',
    description: 'Identifica la causa fondamentale che ha generato la non conformità',
    extendedHelp: `Metodi di analisi:

5 PERCHÉ:
Chiedi "Perché?" 5 volte per arrivare alla causa radice

DIAGRAMMA ISHIKAWA:
Analizza cause per categorie:
- Persone
- Processi
- Tecnologia
- Ambiente

IMPORTANTE:
- Non fermarti al sintomo
- Cerca la causa sistemica
- Documenta l'analisi
- Condividi con il team`,
    examples: [
      'Sintomo: Backup fallito → Causa radice: Nessuno monitora gli alert',
      'Sintomo: Password deboli → Causa radice: Policy non comunicata',
      'Sintomo: Accesso non autorizzato → Causa radice: Processo onboarding incompleto'
    ]
  },

  // AUDIT
  'audit-scope': {
    title: 'Ambito Audit',
    description: 'Definisce quali aree, processi e controlli saranno verificati durante l\'audit',
    extendedHelp: `L'ambito audit specifica:

COSA AUDITARE:
- Controlli ISO 27001 specifici
- Processi aziendali
- Dipartimenti/sedi

COME DEFINIRLO:
- Basati sul piano audit annuale
- Considera rischi più alti
- Verifica NC precedenti
- Copri tutti i controlli nel ciclo

DOCUMENTA:
- Obiettivo dell'audit
- Criteri di valutazione
- Risorse necessarie
- Timeline`,
    examples: [
      'Audit Q1: Controlli A.5-A.8 (Governance e Asset)',
      'Audit Q2: Controlli A.9-A.12 (Accessi e Operazioni)',
      'Audit speciale: Verifica chiusura NC-2024-001'
    ]
  }
};

export function getHelpContent(key: string) {
  return helpContent[key] || null;
}
