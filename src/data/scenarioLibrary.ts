export interface ScenarioQuestion {
  id: string;
  text: string;
  options: Array<{
    value: string;
    label: string;
    score: number;
  }>;
}

export interface Scenario {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  typical_probability: string;
  typical_impact: string;
  controls: string[];
  questions: ScenarioQuestion[];
  scope: string;
}

export const scenarioCategories = {
  natural_disasters: {
    name: "Disastri Naturali/Ambientali",
    icon: "🔥",
    scenarios: [
      {
        id: "fire",
        name: "Incendio",
        description: "Incendio che distrugge ufficio/datacenter",
        category: "natural_disasters",
        icon: "🔥",
        typical_probability: "Bassa",
        typical_impact: "Critico",
        controls: ["8.13", "8.14", "5.29", "5.30"],
        scope: "Intera organizzazione",
        questions: [
          {
            id: "asset_location",
            text: "Dove sono i tuoi asset principali?",
            options: [
              { value: "all_office", label: "Tutto in ufficio fisico", score: 5 },
              { value: "mixed", label: "Parte in ufficio, parte in cloud", score: 3 },
              { value: "all_cloud", label: "Tutto in cloud (no ufficio fisico)", score: 1 }
            ]
          },
          {
            id: "fire_protection",
            text: "C'è un sistema antincendio?",
            options: [
              { value: "full_system", label: "Sì, con estintori e allarme automatico", score: 1 },
              { value: "basic", label: "Solo estintori", score: 3 },
              { value: "none", label: "No", score: 5 }
            ]
          },
          {
            id: "backup_location",
            text: "I backup sono fuori dall'ufficio?",
            options: [
              { value: "cloud", label: "Sì, backup cloud", score: 1 },
              { value: "offsite", label: "Sì, backup in altra sede", score: 1 },
              { value: "onsite", label: "No, backup nello stesso ufficio", score: 4 },
              { value: "none", label: "No, nessun backup", score: 5 }
            ]
          },
          {
            id: "recovery_time",
            text: "Quanti giorni puoi stare senza accesso all'ufficio?",
            options: [
              { value: "indefinite", label: "Indefinitamente (tutto remoto)", score: 1 },
              { value: "weeks", label: "1-2 settimane", score: 2 },
              { value: "days", label: "Pochi giorni", score: 4 },
              { value: "none", label: "Nemmeno un giorno", score: 5 }
            ]
          }
        ]
      },
      {
        id: "flood",
        name: "Alluvione",
        description: "Allagamento locali con danni a hardware",
        category: "natural_disasters",
        icon: "💧",
        typical_probability: "Bassa",
        typical_impact: "Alto",
        controls: ["7.5", "8.13", "5.30"],
        scope: "Intera organizzazione",
        questions: [
          {
            id: "flood_risk",
            text: "La tua sede è in zona a rischio alluvione?",
            options: [
              { value: "high_risk", label: "Sì, zona ad alto rischio", score: 5 },
              { value: "medium_risk", label: "Rischio medio", score: 3 },
              { value: "low_risk", label: "No, zona sicura", score: 1 }
            ]
          },
          {
            id: "floor_level",
            text: "A che piano sono i tuoi asset critici?",
            options: [
              { value: "basement", label: "Seminterrato/Piano terra", score: 5 },
              { value: "first_floor", label: "Primo piano", score: 3 },
              { value: "upper_floors", label: "Piani superiori", score: 1 }
            ]
          },
          {
            id: "water_protection",
            text: "Ci sono protezioni contro l'acqua?",
            options: [
              { value: "full", label: "Sì, paratie e pompe", score: 1 },
              { value: "basic", label: "Protezioni base", score: 3 },
              { value: "none", label: "No", score: 5 }
            ]
          }
        ]
      },
      {
        id: "power_outage",
        name: "Interruzione Elettrica Prolungata",
        description: "Blackout che impedisce il funzionamento",
        category: "natural_disasters",
        icon: "⚡",
        typical_probability: "Media",
        typical_impact: "Alto",
        controls: ["8.6", "5.30"],
        scope: "Intera organizzazione",
        questions: [
          {
            id: "ups",
            text: "Hai gruppi di continuità (UPS)?",
            options: [
              { value: "full", label: "Sì, per tutti i sistemi critici", score: 1 },
              { value: "partial", label: "Solo per alcuni sistemi", score: 3 },
              { value: "none", label: "No", score: 5 }
            ]
          },
          {
            id: "generator",
            text: "C'è un generatore di emergenza?",
            options: [
              { value: "yes", label: "Sì, con autonomia >24h", score: 1 },
              { value: "limited", label: "Sì, ma autonomia limitata", score: 3 },
              { value: "no", label: "No", score: 5 }
            ]
          }
        ]
      }
    ]
  },
  personnel: {
    name: "Rischi Legati al Personale",
    icon: "👥",
    scenarios: [
      {
        id: "key_person_loss",
        name: "Perdita Persona Chiave",
        description: "Dimissioni/malattia di persona con conoscenze critiche",
        category: "personnel",
        icon: "👤",
        typical_probability: "Media",
        typical_impact: "Alto",
        controls: ["5.2", "6.2", "6.5", "5.37"],
        scope: "Reparto specifico",
        questions: [
          {
            id: "key_dependencies",
            text: "Ci sono persone con conoscenze uniche/critiche?",
            options: [
              { value: "many", label: "Sì, più persone", score: 5 },
              { value: "few", label: "Sì, 1-2 persone", score: 3 },
              { value: "none", label: "No, conoscenze condivise", score: 1 }
            ]
          },
          {
            id: "documentation",
            text: "Le procedure sono documentate?",
            options: [
              { value: "full", label: "Sì, tutto documentato e aggiornato", score: 1 },
              { value: "partial", label: "Documentazione parziale/obsoleta", score: 3 },
              { value: "none", label: "No, solo conoscenza tacita", score: 5 }
            ]
          },
          {
            id: "backup_person",
            text: "C'è sempre una persona di backup formata?",
            options: [
              { value: "yes", label: "Sì, per ogni ruolo critico", score: 1 },
              { value: "partial", label: "Solo per alcuni ruoli", score: 3 },
              { value: "no", label: "No", score: 5 }
            ]
          }
        ]
      },
      {
        id: "human_error",
        name: "Errore Umano Sistemico",
        description: "Errori ripetuti che causano danni",
        category: "personnel",
        icon: "⚠️",
        typical_probability: "Alta",
        typical_impact: "Medio",
        controls: ["6.3", "6.8", "8.18"],
        scope: "Intera organizzazione",
        questions: [
          {
            id: "training",
            text: "Fai formazione regolare sulla sicurezza?",
            options: [
              { value: "regular", label: "Sì, almeno annuale", score: 1 },
              { value: "occasional", label: "Saltuaria", score: 3 },
              { value: "none", label: "No", score: 5 }
            ]
          },
          {
            id: "procedures",
            text: "Ci sono procedure chiare per operazioni critiche?",
            options: [
              { value: "yes", label: "Sì, scritte e seguite", score: 1 },
              { value: "partial", label: "Esistono ma non sempre seguite", score: 3 },
              { value: "none", label: "No", score: 5 }
            ]
          }
        ]
      },
      {
        id: "insider_threat",
        name: "Frode Interna",
        description: "Dipendente malintenzionato causa danni",
        category: "personnel",
        icon: "🕵️",
        typical_probability: "Bassa",
        typical_impact: "Alto",
        controls: ["5.18", "6.4", "8.11"],
        scope: "Intera organizzazione",
        questions: [
          {
            id: "access_control",
            text: "I dipendenti hanno solo gli accessi necessari?",
            options: [
              { value: "strict", label: "Sì, principio del minimo privilegio", score: 1 },
              { value: "loose", label: "Alcuni hanno più accessi del necessario", score: 3 },
              { value: "none", label: "No, accesso ampio", score: 5 }
            ]
          },
          {
            id: "monitoring",
            text: "Monitorate le attività anomale?",
            options: [
              { value: "yes", label: "Sì, con log e alert", score: 1 },
              { value: "partial", label: "Solo log base", score: 3 },
              { value: "none", label: "No", score: 5 }
            ]
          }
        ]
      }
    ]
  },
  organizational: {
    name: "Rischi Organizzativi",
    icon: "🏢",
    scenarios: [
      {
        id: "supplier_failure",
        name: "Fornitore Critico Fallisce",
        description: "Fornitore essenziale cessa attività",
        category: "organizational",
        icon: "🔌",
        typical_probability: "Media",
        typical_impact: "Alto",
        controls: ["5.19", "5.20", "5.21"],
        scope: "Intera organizzazione",
        questions: [
          {
            id: "supplier_dependency",
            text: "Hai fornitori unici/insostituibili?",
            options: [
              { value: "many", label: "Sì, più fornitori critici", score: 5 },
              { value: "few", label: "1-2 fornitori critici", score: 3 },
              { value: "none", label: "No, sempre alternative", score: 1 }
            ]
          },
          {
            id: "supplier_monitoring",
            text: "Monitori la salute finanziaria dei fornitori?",
            options: [
              { value: "yes", label: "Sì, regolarmente", score: 1 },
              { value: "occasional", label: "Occasionalmente", score: 3 },
              { value: "no", label: "No", score: 5 }
            ]
          },
          {
            id: "contingency",
            text: "Hai piani di contingenza per cambio fornitore?",
            options: [
              { value: "yes", label: "Sì, documentati e testati", score: 1 },
              { value: "basic", label: "Piano base", score: 3 },
              { value: "no", label: "No", score: 5 }
            ]
          }
        ]
      },
      {
        id: "regulatory_change",
        name: "Cambio Normativa",
        description: "Nuove normative richiedono adeguamenti",
        category: "organizational",
        icon: "📜",
        typical_probability: "Alta",
        typical_impact: "Medio",
        controls: ["5.1", "5.31"],
        scope: "Intera organizzazione",
        questions: [
          {
            id: "compliance_monitoring",
            text: "Monitorate le evoluzioni normative del vostro settore?",
            options: [
              { value: "yes", label: "Sì, con consulenti dedicati", score: 1 },
              { value: "basic", label: "Informalmente", score: 3 },
              { value: "no", label: "No", score: 5 }
            ]
          },
          {
            id: "adaptation_speed",
            text: "Quanto velocemente potete adeguarvi a nuove norme?",
            options: [
              { value: "fast", label: "Settimane", score: 1 },
              { value: "medium", label: "Mesi", score: 3 },
              { value: "slow", label: "Molto difficile", score: 5 }
            ]
          }
        ]
      },
      {
        id: "reputation_crisis",
        name: "Crisi Reputazionale",
        description: "Evento negativo danneggia reputazione",
        category: "organizational",
        icon: "📰",
        typical_probability: "Media",
        typical_impact: "Alto",
        controls: ["5.6", "5.27", "6.8"],
        scope: "Intera organizzazione",
        questions: [
          {
            id: "crisis_plan",
            text: "Avete un piano di crisis management?",
            options: [
              { value: "yes", label: "Sì, documentato e testato", score: 1 },
              { value: "basic", label: "Piano base", score: 3 },
              { value: "no", label: "No", score: 5 }
            ]
          },
          {
            id: "communication",
            text: "C'è un responsabile comunicazione esterna?",
            options: [
              { value: "yes", label: "Sì, dedicato", score: 1 },
              { value: "shared", label: "Responsabilità condivisa", score: 3 },
              { value: "no", label: "No", score: 5 }
            ]
          }
        ]
      }
    ]
  },
  technology: {
    name: "Rischi Tecnologici Generali",
    icon: "🌐",
    scenarios: [
      {
        id: "ddos",
        name: "Attacco DDoS",
        description: "Sovraccarico rete rende servizi inaccessibili",
        category: "technology",
        icon: "🚫",
        typical_probability: "Media",
        typical_impact: "Alto",
        controls: ["8.20", "8.21", "5.24"],
        scope: "Servizi online",
        questions: [
          {
            id: "ddos_protection",
            text: "Hai protezione DDoS attiva?",
            options: [
              { value: "yes", label: "Sì, con CDN/WAF", score: 1 },
              { value: "basic", label: "Protezione base del provider", score: 3 },
              { value: "no", label: "No", score: 5 }
            ]
          },
          {
            id: "service_dependency",
            text: "I tuoi servizi online sono critici per il business?",
            options: [
              { value: "not_critical", label: "No, solo informativo", score: 1 },
              { value: "important", label: "Importanti ma non critici", score: 3 },
              { value: "critical", label: "Sì, tutto il business è online", score: 5 }
            ]
          }
        ]
      },
      {
        id: "network_breach",
        name: "Compromissione Rete Intera",
        description: "Attaccante ottiene accesso alla rete aziendale",
        category: "technology",
        icon: "🔓",
        typical_probability: "Media",
        typical_impact: "Critico",
        controls: ["8.20", "8.21", "8.22", "5.23"],
        scope: "Intera infrastruttura IT",
        questions: [
          {
            id: "network_segmentation",
            text: "La rete è segmentata?",
            options: [
              { value: "yes", label: "Sì, con VLAN e firewall interni", score: 1 },
              { value: "basic", label: "Segmentazione base", score: 3 },
              { value: "no", label: "No, rete piatta", score: 5 }
            ]
          },
          {
            id: "intrusion_detection",
            text: "Hai sistemi di rilevamento intrusioni (IDS/IPS)?",
            options: [
              { value: "yes", label: "Sì, con monitoraggio 24/7", score: 1 },
              { value: "basic", label: "Sistema base", score: 3 },
              { value: "no", label: "No", score: 5 }
            ]
          },
          {
            id: "mfa",
            text: "Usi autenticazione a 2 fattori ovunque?",
            options: [
              { value: "yes", label: "Sì, obbligatoria", score: 1 },
              { value: "partial", label: "Solo per alcuni servizi", score: 3 },
              { value: "no", label: "No", score: 5 }
            ]
          }
        ]
      },
      {
        id: "cloud_provider_down",
        name: "Cloud Provider Down",
        description: "Servizio cloud principale non disponibile",
        category: "technology",
        icon: "☁️",
        typical_probability: "Bassa",
        typical_impact: "Alto",
        controls: ["5.20", "5.30"],
        scope: "Servizi cloud",
        questions: [
          {
            id: "cloud_dependency",
            text: "Quanto dipendi dal cloud provider?",
            options: [
              { value: "total", label: "Totalmente, tutto in cloud", score: 5 },
              { value: "high", label: "Molto, servizi critici in cloud", score: 3 },
              { value: "low", label: "Poco, uso limitato", score: 1 }
            ]
          },
          {
            id: "multi_cloud",
            text: "Usi più cloud provider (ridondanza)?",
            options: [
              { value: "yes", label: "Sì, ridondanza attiva", score: 1 },
              { value: "partial", label: "Backup su altro provider", score: 2 },
              { value: "no", label: "No, un solo provider", score: 5 }
            ]
          }
        ]
      },
      {
        id: "tech_obsolescence",
        name: "Obsolescenza Tecnologica",
        description: "Tecnologie critiche diventano obsolete",
        category: "technology",
        icon: "📟",
        typical_probability: "Alta",
        typical_impact: "Medio",
        controls: ["5.37", "8.19"],
        scope: "Infrastruttura IT",
        questions: [
          {
            id: "tech_age",
            text: "Età delle tue tecnologie principali?",
            options: [
              { value: "modern", label: "Moderne, <3 anni", score: 1 },
              { value: "aging", label: "3-7 anni", score: 3 },
              { value: "legacy", label: ">7 anni o fine vita", score: 5 }
            ]
          },
          {
            id: "update_plan",
            text: "Hai un piano di aggiornamento tecnologico?",
            options: [
              { value: "yes", label: "Sì, roadmap definita", score: 1 },
              { value: "informal", label: "Aggiornamenti informali", score: 3 },
              { value: "no", label: "No", score: 5 }
            ]
          }
        ]
      }
    ]
  }
};

export const getAllScenarios = (): Scenario[] => {
  return Object.values(scenarioCategories).flatMap(cat => cat.scenarios);
};

export const getScenarioById = (id: string): Scenario | undefined => {
  return getAllScenarios().find(s => s.id === id);
};

export const calculateScenarioRisk = (scenario: Scenario, answers: Record<string, string>) => {
  // Calculate average protection score from answers
  let totalScore = 0;
  let questionCount = 0;
  
  scenario.questions.forEach(question => {
    const answer = answers[question.id];
    if (answer) {
      const option = question.options.find(opt => opt.value === answer);
      if (option) {
        totalScore += option.score;
        questionCount++;
      }
    }
  });
  
  const avgScore = questionCount > 0 ? totalScore / questionCount : 3;
  
  // Map typical impact to score
  const impactMap: Record<string, number> = {
    'Basso': 1,
    'Medio': 3,
    'Alto': 4,
    'Critico': 5
  };
  
  // Impact from scenario definition
  const impactScore = impactMap[scenario.typical_impact] || 3;
  
  // Probability influenced by answers (better protection = lower probability)
  const baseProbabilityMap: Record<string, number> = {
    'Bassa': 2,
    'Media': 3,
    'Alta': 4
  };
  
  const baseProbability = baseProbabilityMap[scenario.typical_probability] || 3;
  
  // Adjust probability based on protection level (avgScore)
  // If avgScore is 5 (no protection), keep high probability
  // If avgScore is 1 (good protection), reduce probability
  const adjustedProbability = Math.max(1, Math.min(5, Math.round(baseProbability * (avgScore / 3))));
  
  const inherentScore = adjustedProbability * impactScore;
  
  // Residual risk assumes controls are implemented
  const residualProbability = Math.max(1, adjustedProbability - 2);
  const residualScore = residualProbability * impactScore;
  
  const getRiskLevel = (score: number): string => {
    if (score >= 15) return 'Critico';
    if (score >= 10) return 'Alto';
    if (score >= 5) return 'Medio';
    return 'Basso';
  };
  
  return {
    inherent: {
      probability: adjustedProbability,
      impact: impactScore,
      score: inherentScore,
      level: getRiskLevel(inherentScore)
    },
    residual: {
      probability: residualProbability,
      impact: impactScore,
      score: residualScore,
      level: getRiskLevel(residualScore)
    },
    controls: scenario.controls
  };
};
