import { supabase } from '@/integrations/supabase/client';

interface AssetData {
  id: string;
  name: string;
  asset_type: string;
  criticality: string;
  confidentiality: string | null;
  integrity_required: boolean | null;
  availability_required: boolean | null;
  organization_id: string | null;
}

interface GeneratedRisk {
  organization_id: string;
  asset_id: string;
  risk_id: string;
  auto_generated: boolean;
  name: string;
  description: string | null;
  inherent_probability: string;
  inherent_impact: string;
  inherent_risk_score: number;
  status: string;
  suggested_controls: string[];
}

// Generate unique risk ID
function generateRiskId(): string {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  return `RISK-AUTO-${timestamp}-${random}`;
}

// Map criticality text to numeric score
function getCriticalityScore(criticality: string): number {
  switch (criticality) {
    case 'Critico': return 5;
    case 'Alto': return 4;
    case 'Medio': return 3;
    case 'Basso': return 2;
    default: return 1;
  }
}

// Map confidentiality text to numeric score
function getConfidentialityScore(confidentiality: string | null): number {
  switch (confidentiality) {
    case 'Segreto': return 5;
    case 'Confidenziale': return 4;
    case 'Interno': return 3;
    case 'Pubblico': return 2;
    default: return 2;
  }
}

// Map score to probability text
function scoreToProbability(score: number): string {
  if (score >= 5) return 'high';
  if (score >= 4) return 'medium';
  if (score >= 3) return 'low';
  return 'very_low';
}

// Map score to impact text
function scoreToImpact(score: number): string {
  if (score >= 5) return 'critical';
  if (score >= 4) return 'high';
  if (score >= 3) return 'medium';
  return 'low';
}

export async function generateRisksFromCriticalAsset(
  asset: AssetData
): Promise<number> {
  
  // Only generate risks for critical assets
  const isCritical = asset.criticality === 'Critico' || asset.criticality === 'Alto';
  
  if (!isCritical) {
    console.log('Asset not critical, skipping risk generation');
    return 0;
  }

  if (!asset.organization_id) {
    console.log('No organization_id, skipping risk generation');
    return 0;
  }

  const criticalityScore = getCriticalityScore(asset.criticality);
  const confidentialityScore = getConfidentialityScore(asset.confidentiality);

  const risksToCreate: GeneratedRisk[] = [];

  // RISK 1: Data Loss/Damage (if integrity required)
  if (asset.integrity_required) {
    let threatText = '';
    switch (asset.asset_type) {
      case 'Data':
        threatText = 'Cancellazione accidentale, ransomware, guasto hardware, disaster naturale';
        break;
      case 'Hardware':
        threatText = 'Guasto hardware, incendio, furto, obsolescenza';
        break;
      case 'Software':
        threatText = 'Corruzione software, bug critici, incompatibilità';
        break;
      default:
        threatText = 'Perdita, danneggiamento o compromissione dell\'asset';
    }

    risksToCreate.push({
      organization_id: asset.organization_id,
      asset_id: asset.id,
      risk_id: generateRiskId(),
      auto_generated: true,
      name: `Perdita o Danneggiamento: ${asset.name}`,
      description: `Rischio di perdita permanente o corruzione. Minacce: ${threatText}. Asset tipo: ${asset.asset_type}`,
      inherent_probability: scoreToProbability(criticalityScore),
      inherent_impact: scoreToImpact(criticalityScore),
      inherent_risk_score: criticalityScore * criticalityScore,
      status: 'identified',
      suggested_controls: ['A.5.29', 'A.5.30', 'A.8.13', 'A.8.11']
    });
  }

  // RISK 2: Unauthorized Access (if confidential)
  if (confidentialityScore >= 4) {
    let threatText = '';
    switch (asset.asset_type) {
      case 'Data':
        threatText = 'Hacker, insider malintenzionati, credential theft, privilege escalation';
        break;
      case 'Hardware':
        threatText = 'Furto fisico, accesso non autorizzato a locali, dispositivi non custoditi';
        break;
      case 'Software':
        threatText = 'Vulnerabilità software, autenticazione debole, sessioni non scadute';
        break;
      default:
        threatText = 'Violazione controlli accesso, furto credenziali';
    }

    risksToCreate.push({
      organization_id: asset.organization_id,
      asset_id: asset.id,
      risk_id: generateRiskId(),
      auto_generated: true,
      name: `Accesso Non Autorizzato: ${asset.name}`,
      description: `Rischio di accesso non autorizzato. Minacce: ${threatText}. Impatto potenziale: data breach, esposizione dati sensibili, sanzioni GDPR.`,
      inherent_probability: scoreToProbability(Math.min(confidentialityScore + 1, 5)),
      inherent_impact: scoreToImpact(criticalityScore),
      inherent_risk_score: Math.min(confidentialityScore + 1, 5) * criticalityScore,
      status: 'identified',
      suggested_controls: ['A.5.15', 'A.5.16', 'A.5.17', 'A.5.18', 'A.8.2', 'A.8.3', 'A.8.5']
    });
  }

  // RISK 3: Unavailability (if availability required)
  if (asset.availability_required) {
    let threatText = '';
    switch (asset.asset_type) {
      case 'Hardware':
        threatText = 'Guasto hardware, obsolescenza, disaster fisico, power outage';
        break;
      case 'Software':
        threatText = 'Bug critici, incompatibilità, attacchi DoS, errori configurazione';
        break;
      case 'Data':
        threatText = 'Corruzione dati, problemi database, storage failure';
        break;
      default:
        threatText = 'Interruzione servizio, guasti, attacchi cyber';
    }

    risksToCreate.push({
      organization_id: asset.organization_id,
      asset_id: asset.id,
      risk_id: generateRiskId(),
      auto_generated: true,
      name: `Indisponibilità Prolungata: ${asset.name}`,
      description: `Rischio di downtime prolungato che blocca operazioni critiche. Minacce: ${threatText}. Impatto: blocco operazioni, perdita revenue, violazione SLA.`,
      inherent_probability: scoreToProbability(criticalityScore),
      inherent_impact: scoreToImpact(criticalityScore),
      inherent_risk_score: criticalityScore * criticalityScore,
      status: 'identified',
      suggested_controls: ['A.5.29', 'A.5.30', 'A.8.6', 'A.8.14', 'A.8.20']
    });
  }

  // RISK 4: Physical Risk (hardware only)
  if (asset.asset_type === 'Hardware' && isCritical) {
    risksToCreate.push({
      organization_id: asset.organization_id,
      asset_id: asset.id,
      risk_id: generateRiskId(),
      auto_generated: true,
      name: `Rischio Fisico: ${asset.name}`,
      description: `Rischi fisici (furto, incendio, allagamento) che compromettono l'asset. Vulnerabilità: hardware on-premise senza protezioni fisiche adeguate.`,
      inherent_probability: 'low',
      inherent_impact: scoreToImpact(criticalityScore),
      inherent_risk_score: 2 * criticalityScore,
      status: 'identified',
      suggested_controls: ['A.7.1', 'A.7.2', 'A.7.4', 'A.7.7', 'A.7.8']
    });
  }

  // Insert risks
  if (risksToCreate.length > 0) {
    const { error } = await supabase
      .from('risks')
      .insert(risksToCreate);

    if (error) {
      console.error('Error creating risks:', error);
      throw error;
    }
  }

  return risksToCreate.length;
}

export async function checkAndGenerateRisksForAsset(assetId: string): Promise<number> {
  try {
    // Load asset
    const { data: asset, error: assetError } = await supabase
      .from('assets')
      .select('*')
      .eq('id', assetId)
      .single();

    if (assetError) throw assetError;
    if (!asset) return 0;

    // Check if auto-generated risks already exist for this asset
    const { data: existingRisks } = await supabase
      .from('risks')
      .select('id')
      .eq('asset_id', assetId)
      .eq('auto_generated', true);

    if (existingRisks && existingRisks.length > 0) {
      console.log('Risks already exist for this asset');
      return 0;
    }

    // Generate risks
    return await generateRisksFromCriticalAsset(asset as AssetData);

  } catch (error) {
    console.error('Error in checkAndGenerateRisksForAsset:', error);
    return 0;
  }
}
