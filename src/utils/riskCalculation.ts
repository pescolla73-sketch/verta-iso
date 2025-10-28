// Risk Assessment Calculation Utilities for ISO 27001

export type RiskLevel = "Molto Bassa" | "Bassa" | "Media" | "Alta" | "Molto Alta";
export type RiskScore = 1 | 2 | 3 | 4 | 5;

export const RISK_LEVELS: Record<RiskLevel, RiskScore> = {
  "Molto Bassa": 1,
  "Bassa": 2,
  "Media": 3,
  "Alta": 4,
  "Molto Alta": 5,
};

export const RISK_LEVEL_LABELS: Record<RiskScore, RiskLevel> = {
  1: "Molto Bassa",
  2: "Bassa",
  3: "Media",
  4: "Alta",
  5: "Molto Alta",
};

export type RiskCategory = "Basso" | "Medio" | "Alto" | "Critico";

export function calculateRiskScore(
  probability: RiskLevel,
  impact: RiskLevel
): number {
  const probScore = RISK_LEVELS[probability];
  const impactScore = RISK_LEVELS[impact];
  return probScore * impactScore;
}

export function getRiskCategory(score: number): RiskCategory {
  if (score >= 1 && score <= 6) return "Basso";
  if (score >= 7 && score <= 12) return "Medio";
  if (score >= 13 && score <= 16) return "Alto";
  return "Critico"; // 17-25
}

export function getRiskColor(category: RiskCategory): string {
  switch (category) {
    case "Basso":
      return "bg-green-500";
    case "Medio":
      return "bg-yellow-500";
    case "Alto":
      return "bg-orange-500";
    case "Critico":
      return "bg-red-500";
  }
}

export function getRiskCellColor(score: number): string {
  const category = getRiskCategory(score);
  switch (category) {
    case "Basso":
      return "bg-green-100 border-green-300 text-green-900";
    case "Medio":
      return "bg-yellow-100 border-yellow-300 text-yellow-900";
    case "Alto":
      return "bg-orange-100 border-orange-300 text-orange-900";
    case "Critico":
      return "bg-red-100 border-red-300 text-red-900";
  }
}

export function getRiskBadgeVariant(
  category: RiskCategory
): "default" | "secondary" | "destructive" | "outline" {
  switch (category) {
    case "Basso":
      return "outline";
    case "Medio":
      return "secondary";
    case "Alto":
      return "default";
    case "Critico":
      return "destructive";
  }
}

export const THREAT_CATEGORIES = [
  { value: "malware", label: "🦠 Malware/Ransomware" },
  { value: "theft", label: "🕵️ Furto/Smarrimento" },
  { value: "human_error", label: "👤 Errore umano" },
  { value: "natural", label: "🌪️ Disastro naturale" },
  { value: "unauthorized", label: "🚫 Accesso non autorizzato" },
  { value: "outage", label: "⚡ Interruzione servizio" },
  { value: "data_breach", label: "💥 Violazione dati" },
  { value: "other", label: "➕ Altra" },
];

export const VULNERABILITY_CATEGORIES = [
  { value: "no_backup", label: "Nessun backup" },
  { value: "weak_password", label: "Password deboli" },
  { value: "no_encryption", label: "Dati non cifrati" },
  { value: "no_antivirus", label: "Nessun antivirus" },
  { value: "no_training", label: "Personale non formato" },
  { value: "outdated", label: "Software obsoleto" },
  { value: "no_mfa", label: "Nessuna autenticazione a due fattori" },
  { value: "poor_access_control", label: "Controllo accessi inadeguato" },
  { value: "no_monitoring", label: "Nessun monitoraggio" },
];

export const TREATMENT_STRATEGIES = [
  {
    value: "mitigate",
    label: "🛡️ Mitigare",
    description: "Implementare controlli per ridurre probabilità/impatto",
  },
  {
    value: "accept",
    label: "✅ Accettare",
    description: "Rischio tollerabile, nessuna azione immediata",
  },
  {
    value: "transfer",
    label: "📋 Trasferire",
    description: "Assicurazione, outsourcing, clausole contrattuali",
  },
  {
    value: "avoid",
    label: "🚫 Evitare",
    description: "Eliminare l'attività che genera il rischio",
  },
];

export const PROBABILITY_LEVELS = [
  {
    value: "Molto Bassa",
    label: "Molto Bassa (1)",
    description: "Quasi impossibile (<5%)",
  },
  {
    value: "Bassa",
    label: "Bassa (2)",
    description: "Improbabile (5-25%)",
  },
  {
    value: "Media",
    label: "Media (3)",
    description: "Possibile (25-50%)",
  },
  {
    value: "Alta",
    label: "Alta (4)",
    description: "Probabile (50-75%)",
  },
  {
    value: "Molto Alta",
    label: "Molto Alta (5)",
    description: "Quasi certo (>75%)",
  },
];

export const IMPACT_LEVELS = [
  {
    value: "Molto Bassa",
    label: "Molto Basso (1)",
    description: "Danno trascurabile (<1K€, nessun impatto business)",
  },
  {
    value: "Bassa",
    label: "Basso (2)",
    description: "Danno limitato (1-10K€, lieve disagio)",
  },
  {
    value: "Media",
    label: "Medio (3)",
    description: "Danno significativo (10-50K€, interruzione parziale)",
  },
  {
    value: "Alta",
    label: "Alto (4)",
    description: "Danno grave (50-250K€, interruzione seria)",
  },
  {
    value: "Molto Alta",
    label: "Molto Alto (5)",
    description: "Danno critico (>250K€, rischio esistenziale)",
  },
];