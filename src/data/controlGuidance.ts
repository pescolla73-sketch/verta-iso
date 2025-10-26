export interface ControlGuidance {
  id: string;
  title: string;
  domain: string;
  description: string;
  why: string;
  examples: string[];
  howToImplement: string[];
  notApplicableExamples: string[];
  resources: string[];
}

export const controlGuidanceData: Record<string, ControlGuidance> = {
  "5.1": {
    id: "5.1",
    title: "Politiche per la sicurezza delle informazioni",
    domain: "Organizzativi",
    description: "Devi creare un documento ufficiale che definisce l'approccio dell'azienda alla sicurezza informatica.",
    why: "È la base di tutto: definisce obiettivi, responsabilità e principi di sicurezza. Come la 'costituzione' della sicurezza aziendale.",
    examples: [
      "Policy che stabilisce: 'I dati clienti sono confidenziali e vanno protetti'",
      "Documento che definisce chi è responsabile della sicurezza IT",
      "Linee guida su password, backup, accessi"
    ],
    howToImplement: [
      "1. Scarica un template di policy ISO 27001",
      "2. Personalizzalo con i dati della tua azienda",
      "3. Fallo approvare dal management",
      "4. Comunicalo a tutti i dipendenti",
      "5. Rivedi la policy almeno una volta all'anno"
    ],
    notApplicableExamples: [
      "Praticamente mai - tutte le aziende hanno bisogno di una policy"
    ],
    resources: [
      "Template Policy (download)",
      "Video: Come scrivere una policy in 30 minuti"
    ]
  },
  "5.12": {
    id: "5.12",
    title: "Classificazione delle informazioni",
    domain: "Organizzativi",
    description: "Devi classificare i dati aziendali in base al loro livello di sensibilità e criticità per proteggere le informazioni più importanti.",
    why: "Così sai quali dati proteggere di più e puoi applicare le misure di sicurezza giuste. Non tutti i dati sono uguali!",
    examples: [
      "Email clienti → Confidenziale (solo team interno)",
      "Password database → Segreto (solo admin)",
      "Brochure prodotti → Pubblico (tutti)",
      "Budget azienda → Riservato (solo management)"
    ],
    howToImplement: [
      "1. Crea una policy con 3-4 livelli (es. Pubblico, Interno, Confidenziale, Segreto)",
      "2. Definisci chi può accedere a ogni livello",
      "3. Forma i dipendenti su come classificare",
      "4. Etichetta i documenti esistenti",
      "5. Rivedi la classificazione ogni 6 mesi"
    ],
    notApplicableExamples: [
      "Startup con 2 persone che condividono tutto",
      "Azienda che gestisce solo dati pubblici"
    ],
    resources: [
      "Template Policy Classificazione",
      "Checklist implementazione"
    ]
  },
  "8.1": {
    id: "8.1",
    title: "Dispositivi degli utenti finali",
    domain: "Tecnologici",
    description: "Devi proteggere i dispositivi che i dipendenti usano per lavorare (PC, laptop, smartphone, tablet).",
    why: "I dispositivi sono il punto di accesso ai tuoi dati. Se non protetti, sono la porta d'ingresso per attacchi e furti.",
    examples: [
      "Installare antivirus su tutti i PC aziendali",
      "Richiedere password/PIN su tutti i dispositivi",
      "Abilitare la crittografia del disco",
      "Configurare il blocco automatico dopo 5 minuti"
    ],
    howToImplement: [
      "1. Fai un inventario di tutti i dispositivi",
      "2. Installa antivirus/EDR su tutti",
      "3. Attiva la crittografia del disco",
      "4. Configura MDM per smartphone aziendali",
      "5. Forma gli utenti sull'uso sicuro"
    ],
    notApplicableExamples: [
      "Azienda senza dipendenti (solo proprietario)",
      "Tutti lavorano su thin client/terminali senza dati locali"
    ],
    resources: [
      "Checklist sicurezza dispositivi",
      "Guida crittografia Windows/Mac"
    ]
  }
};
