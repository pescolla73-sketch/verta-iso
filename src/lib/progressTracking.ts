import { supabase } from '@/integrations/supabase/client';

export interface ProgressSection {
  id: string;
  title: string;
  description: string;
  icon: string;
  order: number;
  route: string;
  estimatedTime: string;
  tips: string[];
  dependencies?: string[];
}

export const ISO27001_SECTIONS: ProgressSection[] = [
  {
    id: 'organization',
    title: 'Setup Organizzazione',
    description: 'Definisci contesto, ambito ISMS e obiettivi',
    icon: '🏢',
    order: 1,
    route: '/setup-azienda',
    estimatedTime: '15 min',
    tips: [
      'Definisci chiaramente il perimetro del tuo ISMS',
      'Identifica parti interessate (clienti, fornitori, regolatori)',
      'Stabilisci obiettivi di sicurezza misurabili'
    ]
  },
  {
    id: 'roles',
    title: 'Organizzazione e Ruoli',
    description: 'Definisci organigramma ISMS e responsabilità',
    icon: '👥',
    order: 2,
    route: '/roles',
    estimatedTime: '20 min',
    tips: [
      'Nomina il CISO (Chief Information Security Officer)',
      'Definisci ruoli: ISO Manager, DPO, Responsabili',
      'Assegna responsabilità per ogni controllo'
    ],
    dependencies: ['organization']
  },
  {
    id: 'assets',
    title: 'Inventario Asset',
    description: 'Identifica e classifica asset critici',
    icon: '📦',
    order: 3,
    route: '/assets',
    estimatedTime: '30 min',
    tips: [
      'Includi hardware, software, dati, documenti, persone',
      'Classifica per criticità (Alta/Media/Bassa)',
      'Assegna owner responsabile per ogni asset'
    ],
    dependencies: ['organization']
  },
  {
    id: 'risks',
    title: 'Risk Assessment',
    description: 'Valuta minacce e rischi',
    icon: '⚠️',
    order: 4,
    route: '/risk-assessment',
    estimatedTime: '45 min',
    tips: [
      'Usa libreria minacce ISO 27005 + NIS2',
      'Valuta probabilità e impatto',
      'Identifica rischi oltre soglia accettabilità'
    ],
    dependencies: ['assets']
  },
  {
    id: 'controls',
    title: 'Controlli ISO 27001',
    description: 'Implementa i 93 controlli Annex A',
    icon: '✅',
    order: 5,
    route: '/controls',
    estimatedTime: '2-3 ore',
    tips: [
      'Valuta applicabilità di tutti i 93 controlli',
      'Documenta stato implementazione',
      'Raccogli evidenze per controlli implementati',
      'Giustifica esclusioni'
    ],
    dependencies: ['risks']
  },
  {
    id: 'policies',
    title: 'Policy e Procedure',
    description: 'Crea politiche obbligatorie',
    icon: '📋',
    order: 6,
    route: '/policies',
    estimatedTime: '1 ora',
    tips: [
      'Genera 8 policy obbligatorie ISO 27001',
      'Personalizza con dati organizzazione',
      'Fai approvare dalla direzione'
    ],
    dependencies: ['controls']
  },
  {
    id: 'soa',
    title: 'Statement of Applicability',
    description: 'Genera documento SoA',
    icon: '📄',
    order: 7,
    route: '/soa',
    estimatedTime: '10 min',
    tips: [
      'Documento automatico da controlli',
      'Verifica giustificazioni complete',
      'Esporta PDF per auditor'
    ],
    dependencies: ['controls']
  },
  {
    id: 'audits',
    title: 'Audit Interni',
    description: 'Pianifica verifiche periodiche',
    icon: '🔍',
    order: 8,
    route: '/audits',
    estimatedTime: '30 min',
    tips: [
      'Programma audit interni annuali',
      'Usa checklist ISO 27001',
      'Traccia non-conformità'
    ],
    dependencies: ['soa']
  },
  {
    id: 'documentation',
    title: 'Documentazione Finale',
    description: 'Package certificazione completo',
    icon: '📦',
    order: 9,
    route: '/soa',
    estimatedTime: '10 min',
    tips: [
      'Export completo documenti',
      'Package pronto per auditor',
      'Verifica checklist certificazione'
    ],
    dependencies: ['soa', 'policies', 'audits']
  }
];

export async function calculateProgress() {
  const progress: Record<string, number> = {};

  try {
    // Organization setup
    const { data: org } = await supabase
      .from('organization')
      .select('isms_scope, name')
      .limit(1)
      .single();
    progress.organization = org?.isms_scope ? 100 : 0;

    // Roles - check if organization data has role assignments
    progress.roles = org?.name ? 50 : 0; // Simplified check

    // Assets
    const { data: assets } = await supabase
      .from('assets')
      .select('id');
    progress.assets = assets && assets.length >= 5 ? 100 : (assets && assets.length > 0 ? 50 : 0);

    // Risks
    const { data: risks } = await supabase
      .from('risks')
      .select('id');
    progress.risks = risks && risks.length >= 3 ? 100 : (risks && risks.length > 0 ? 50 : 0);

    // Controls
    const { data: controls } = await supabase
      .from('controls')
      .select('status');
    
    if (controls && controls.length > 0) {
      const evaluated = controls.filter(c => 
        c.status !== 'not_implemented' && c.status !== null
      ).length;
      progress.controls = Math.round((evaluated / 93) * 100);
    } else {
      progress.controls = 0;
    }

    // Policies
    const { data: policies } = await supabase
      .from('policies')
      .select('id');
    progress.policies = policies && policies.length >= 3 ? 100 : (policies && policies.length > 0 ? 50 : 0);

    // SoA - check audit logs for export
    const { data: soaLogs } = await supabase
      .from('audit_logs')
      .select('id')
      .eq('entity_type', 'soa')
      .eq('action', 'export')
      .limit(1);
    progress.soa = soaLogs && soaLogs.length > 0 ? 100 : 0;

    // Audits
    const { data: audits } = await supabase
      .from('audits')
      .select('id');
    progress.audits = audits && audits.length > 0 ? 100 : 0;

    // Documentation = same as SoA for now
    progress.documentation = progress.soa;

  } catch (error) {
    console.error('Error calculating progress:', error);
  }

  // Calculate overall
  const values = Object.values(progress);
  const overall = values.length > 0 
    ? Math.round(values.reduce((a, b) => a + b, 0) / values.length)
    : 0;

  return { ...progress, overall };
}

export function getSectionStatus(sectionId: string, progress: Record<string, number>): 'completed' | 'in-progress' | 'todo' {
  const value = progress[sectionId] || 0;
  if (value === 100) return 'completed';
  if (value > 0) return 'in-progress';
  return 'todo';
}

export function getNextSection(progress: Record<string, number>): ProgressSection | null {
  return ISO27001_SECTIONS.find(section => {
    const status = getSectionStatus(section.id, progress);
    return status !== 'completed';
  }) || null;
}
