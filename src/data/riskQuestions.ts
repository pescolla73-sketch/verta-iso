// Question bank for simplified risk assessment
// Maps simple questions to ISO risk framework

export interface QuestionOption {
  value: string;
  label: string;
  score: number; // 1-5 scale for risk calculation
  description?: string;
}

export interface RiskQuestion {
  id: string;
  text: string;
  helpText?: string;
  type: 'single' | 'multiple';
  options: QuestionOption[];
  relatedControl?: string; // ISO control ID
}

export interface QuestionStep {
  title: string;
  description: string;
  questions: RiskQuestion[];
}

// Question sets by asset type
export const questionSets: Record<string, QuestionStep[]> = {
  // Default questions for all assets
  default: [
    {
      title: "Protezione Base",
      description: "Controlli di sicurezza fondamentali",
      questions: [
        {
          id: "backup",
          text: "Hai backup di questo asset?",
          helpText: "I backup proteggono da perdita dati",
          type: "single",
          relatedControl: "8.13",
          options: [
            {
              value: "daily_auto",
              label: "Sì, giornalieri automatici",
              score: 1,
              description: "Ottimo! Rischio molto basso"
            },
            {
              value: "manual",
              label: "Sì, ma manuali/saltuari",
              score: 3,
              description: "Migliorabile"
            },
            {
              value: "none",
              label: "No, nessun backup",
              score: 5,
              description: "Rischio alto!"
            }
          ]
        },
        {
          id: "antivirus",
          text: "C'è antivirus/antimalware?",
          helpText: "Protegge da virus e software dannosi",
          type: "single",
          relatedControl: "8.7",
          options: [
            {
              value: "auto",
              label: "Sì, aggiornato automaticamente",
              score: 1
            },
            {
              value: "manual",
              label: "Sì, ma non sempre aggiornato",
              score: 3
            },
            {
              value: "none",
              label: "No",
              score: 5
            }
          ]
        },
        {
          id: "physical_security",
          text: "È protetto fisicamente?",
          helpText: "Protezione da accesso fisico non autorizzato",
          type: "single",
          relatedControl: "7.2",
          options: [
            {
              value: "secure",
              label: "Sì, in stanza chiusa a chiave",
              score: 1
            },
            {
              value: "partial",
              label: "Sì, ma accesso non sempre controllato",
              score: 3
            },
            {
              value: "none",
              label: "No, accessibile a tutti",
              score: 5
            }
          ]
        }
      ]
    },
    {
      title: "Accesso e Controllo",
      description: "Chi può accedere e come",
      questions: [
        {
          id: "access_count",
          text: "Quante persone possono accedere?",
          helpText: "Meno persone = più facile controllare",
          type: "single",
          relatedControl: "5.18",
          options: [
            {
              value: "few",
              label: "1-2 persone (amministratori)",
              score: 1
            },
            {
              value: "some",
              label: "3-10 persone",
              score: 2
            },
            {
              value: "many",
              label: "Più di 10 persone",
              score: 4
            }
          ]
        },
        {
          id: "passwords",
          text: "Ci sono password di accesso?",
          helpText: "Le password proteggono da accessi non autorizzati",
          type: "single",
          relatedControl: "5.17",
          options: [
            {
              value: "strong",
              label: "Sì, password forti e cambiate regolarmente",
              score: 1
            },
            {
              value: "weak",
              label: "Sì, ma password semplici/vecchie",
              score: 3
            },
            {
              value: "none",
              label: "No, nessuna password",
              score: 5
            }
          ]
        },
        {
          id: "logging",
          text: "Ci sono log di chi accede?",
          helpText: "I log aiutano a capire chi ha fatto cosa",
          type: "single",
          relatedControl: "8.15",
          options: [
            {
              value: "yes",
              label: "Sì, monitoriamo gli accessi",
              score: 1
            },
            {
              value: "no",
              label: "No",
              score: 4
            }
          ]
        }
      ]
    },
    {
      title: "Cosa Succederebbe Se...",
      description: "Valuta l'impatto di un incidente",
      questions: [
        {
          id: "impact_unavailable",
          text: "Se questo asset si rompesse, cosa succederebbe all'azienda?",
          helpText: "Pensa al danno economico e operativo",
          type: "single",
          options: [
            {
              value: "minimal",
              label: "Niente di grave, possiamo continuare",
              score: 1,
              description: "Impatto molto basso"
            },
            {
              value: "minor",
              label: "Rallentamenti, ma recuperabile in giornata",
              score: 2,
              description: "Impatto basso"
            },
            {
              value: "moderate",
              label: "Blocco parziale per qualche giorno",
              score: 3,
              description: "Impatto medio"
            },
            {
              value: "major",
              label: "Blocco totale, danno grave (>10.000€)",
              score: 4,
              description: "Impatto alto"
            },
            {
              value: "critical",
              label: "Disastro: rischio chiusura azienda",
              score: 5,
              description: "Impatto critico"
            }
          ]
        },
        {
          id: "impact_stolen",
          text: "Se i dati venissero rubati o persi?",
          helpText: "Considera danni GDPR, reputazione, clienti",
          type: "single",
          options: [
            {
              value: "minimal",
              label: "Niente di grave",
              score: 1
            },
            {
              value: "minor",
              label: "Qualche problema gestibile",
              score: 2
            },
            {
              value: "moderate",
              label: "Danno significativo (1.000-10.000€)",
              score: 3
            },
            {
              value: "major",
              label: "Danno grave (multe GDPR, perdita clienti)",
              score: 4
            },
            {
              value: "critical",
              label: "Disastro (>50.000€, chiusura possibile)",
              score: 5
            }
          ]
        }
      ]
    },
    {
      title: "Quanto è Probabile?",
      description: "Stima la probabilità di problemi",
      questions: [
        {
          id: "past_incidents",
          text: "Negli ultimi 2 anni, hai avuto:",
          helpText: "Seleziona tutti quelli che si sono verificati",
          type: "multiple",
          options: [
            { value: "malware", label: "Virus o malware", score: 1 },
            { value: "hacking", label: "Tentativi di hacking", score: 1 },
            { value: "theft", label: "Perdita/furto dispositivi", score: 1 },
            { value: "technical", label: "Problemi tecnici gravi", score: 1 },
            { value: "errors", label: "Errori che hanno causato danni", score: 1 },
            { value: "none", label: "Nessun problema", score: 0 }
          ]
        },
        {
          id: "sector_risk",
          text: "Il tuo settore ha spesso problemi di sicurezza informatica?",
          helpText: "Alcuni settori sono più bersaglio di attacchi",
          type: "single",
          options: [
            {
              value: "high",
              label: "Sì, capita spesso (finanza, sanità, e-commerce)",
              score: 4
            },
            {
              value: "medium",
              label: "A volte",
              score: 2
            },
            {
              value: "low",
              label: "Raramente",
              score: 1
            }
          ]
        }
      ]
    }
  ],
  
  // Additional questions for servers
  server: [
    {
      title: "Configurazione Server",
      description: "Domande specifiche per server",
      questions: [
        {
          id: "updates",
          text: "Il sistema operativo è aggiornato?",
          type: "single",
          relatedControl: "8.19",
          options: [
            { value: "auto", label: "Sì, aggiornamenti automatici", score: 1 },
            { value: "manual", label: "Sì, ma manualmente", score: 2 },
            { value: "outdated", label: "No, versione vecchia", score: 5 }
          ]
        },
        {
          id: "firewall",
          text: "C'è un firewall configurato?",
          type: "single",
          relatedControl: "8.20",
          options: [
            { value: "yes", label: "Sì, configurato correttamente", score: 1 },
            { value: "partial", label: "Sì, ma configurazione base", score: 3 },
            { value: "no", label: "No", score: 5 }
          ]
        }
      ]
    }
  ],
  
  // Additional questions for laptops
  laptop: [
    {
      title: "Sicurezza Laptop",
      description: "Domande specifiche per dispositivi mobili",
      questions: [
        {
          id: "encryption",
          text: "Il disco è cifrato?",
          type: "single",
          relatedControl: "8.24",
          options: [
            { value: "yes", label: "Sì, cifratura completa", score: 1 },
            { value: "no", label: "No", score: 5 }
          ]
        },
        {
          id: "screen_lock",
          text: "C'è blocco schermo automatico?",
          type: "single",
          relatedControl: "8.11",
          options: [
            { value: "yes", label: "Sì, dopo pochi minuti", score: 1 },
            { value: "no", label: "No o troppo lungo", score: 3 }
          ]
        }
      ]
    }
  ],
  
  // Additional questions for cloud/SaaS
  cloud: [
    {
      title: "Sicurezza Cloud",
      description: "Domande specifiche per servizi cloud",
      questions: [
        {
          id: "2fa",
          text: "Autenticazione a 2 fattori attiva?",
          type: "single",
          relatedControl: "5.17",
          options: [
            { value: "yes", label: "Sì, per tutti gli utenti", score: 1 },
            { value: "partial", label: "Sì, solo per alcuni", score: 3 },
            { value: "no", label: "No", score: 5 }
          ]
        },
        {
          id: "provider",
          text: "Il provider cloud è certificato (ISO 27001, SOC 2)?",
          type: "single",
          relatedControl: "5.19",
          options: [
            { value: "yes", label: "Sì, certificato", score: 1 },
            { value: "unknown", label: "Non lo so", score: 3 },
            { value: "no", label: "No", score: 4 }
          ]
        }
      ]
    }
  ]
};

// Get questions for asset type
export function getQuestionsForAsset(assetType: string): QuestionStep[] {
  const defaultQuestions = questionSets.default;
  const typeSpecific = questionSets[assetType.toLowerCase()] || [];
  
  return [...defaultQuestions, ...typeSpecific];
}

// Calculate scores from answers
export interface RiskAnswers {
  [questionId: string]: string | string[];
}

export interface RiskCalculationResult {
  inherent: {
    probability: number;
    impact: number;
    score: number;
    level: string;
  };
  neededControls: string[];
  residual: {
    probability: number;
    impact: number;
    score: number;
    level: string;
  };
  insights: string[];
}

export function calculateRiskFromAnswers(
  answers: RiskAnswers,
  assetType: string
): RiskCalculationResult {
  const questions = getQuestionsForAsset(assetType);
  const neededControls: string[] = [];
  const insights: string[] = [];
  
  // Calculate base protection score (lower = better protected)
  let protectionGaps = 0;
  
  // Check backup
  if (answers.backup === 'none') {
    protectionGaps += 2;
    neededControls.push('8.13');
    insights.push('Non hai backup: rischio alto di perdita dati');
  } else if (answers.backup === 'manual') {
    protectionGaps += 1;
    insights.push('Backup manuali: considera backup automatici');
  }
  
  // Check antivirus
  if (answers.antivirus === 'none') {
    protectionGaps += 2;
    neededControls.push('8.7');
    insights.push('Nessun antivirus: rischio malware alto');
  } else if (answers.antivirus === 'manual') {
    protectionGaps += 1;
    neededControls.push('8.7');
    insights.push('Antivirus non sempre aggiornato');
  }
  
  // Check passwords
  if (answers.passwords === 'none') {
    protectionGaps += 2;
    neededControls.push('5.17');
    insights.push('Nessuna password: accesso non protetto');
  } else if (answers.passwords === 'weak') {
    protectionGaps += 1;
    neededControls.push('5.17');
    insights.push('Password deboli: rischio accessi non autorizzati');
  }
  
  // Check logging
  if (answers.logging === 'no') {
    neededControls.push('8.15');
  }
  
  // Calculate impact (from questions)
  const impactUnavailable = getScoreFromAnswer(answers.impact_unavailable, questions);
  const impactStolen = getScoreFromAnswer(answers.impact_stolen, questions);
  const impact = Math.max(impactUnavailable, impactStolen);
  
  // Calculate probability from incidents
  let probabilityScore = 1;
  if (Array.isArray(answers.past_incidents)) {
    const incidentCount = answers.past_incidents.filter(i => i !== 'none').length;
    probabilityScore = Math.min(incidentCount + 1, 5);
  }
  
  // Adjust probability based on sector
  if (answers.sector_risk === 'high') {
    probabilityScore = Math.min(probabilityScore + 1, 5);
  }
  
  // Inherent risk (before controls)
  const inherentScore = probabilityScore * impact;
  const inherentLevel = getRiskLevel(inherentScore);
  
  // Residual risk (after implementing controls)
  const residualProbability = Math.max(probabilityScore - protectionGaps, 1);
  const residualScore = residualProbability * impact;
  const residualLevel = getRiskLevel(residualScore);
  
  // Add impact insight
  if (impact >= 4) {
    insights.push(`Impatto ${impact === 5 ? 'critico' : 'alto'}: priorità massima`);
  }
  
  return {
    inherent: {
      probability: probabilityScore,
      impact,
      score: inherentScore,
      level: inherentLevel
    },
    neededControls: Array.from(new Set(neededControls)),
    residual: {
      probability: residualProbability,
      impact,
      score: residualScore,
      level: residualLevel
    },
    insights
  };
}

function getScoreFromAnswer(answerValue: string | string[], questions: QuestionStep[]): number {
  for (const step of questions) {
    for (const question of step.questions) {
      const option = question.options.find(opt => opt.value === answerValue);
      if (option) return option.score;
    }
  }
  return 3; // Default medium
}

function getRiskLevel(score: number): string {
  if (score >= 20) return 'Critico';
  if (score >= 12) return 'Alto';
  if (score >= 6) return 'Medio';
  return 'Basso';
}
