import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { 
  ProfessionalPDF, 
  Organization, 
  DocumentMetadata,
  formatItalianDate,
  calculateNextReviewDate,
  generateDocumentId
} from './pdfBranding';

const OBSOLETE_OS = ["Windows 7", "Windows XP", "Windows Vista", "Windows 8", "Windows Server 2008", "Windows Server 2003"];

interface ReportData {
  assets: any[];
  tests: any[];
  trainings: any[];
  risks: any[];
  roles: Array<{ id: string; role_name: string }>;
  filters: {
    department?: string;
    role?: string;
    roleName?: string;
  };
}

export async function generateSecurityAuditReport(
  organization: Organization,
  data: ReportData
): Promise<void> {
  const todayISO = new Date().toISOString().split('T')[0];
  
  const metadata: DocumentMetadata = {
    documentType: 'Report Conformità ISO 27001 / NIS2',
    documentId: generateDocumentId('SAR', organization.name, '1.0'),
    version: '1.0',
    issueDate: todayISO,
    revisionDate: todayISO,
    nextReviewDate: calculateNextReviewDate(todayISO),
    status: 'approved',
    classification: 'confidential',
    preparedBy: organization.ciso || 'Sistema Automatico',
    approvedBy: organization.ceo || undefined,
  };

  const pdf = new ProfessionalPDF(organization, metadata);
  const doc = pdf.getDoc();
  const margin = pdf.getMargin();
  const pageWidth = doc.internal.pageSize.width;
  
  // Calculate filtered data summary
  const { assets, tests, trainings, risks, filters, roles } = data;
  
  // Filter context string
  let filterContext = '';
  if (filters.department) filterContext += `Reparto: ${filters.department}`;
  if (filters.roleName) filterContext += (filterContext ? ' | ' : '') + `Mansione: ${filters.roleName}`;
  if (!filterContext) filterContext = 'Tutti i reparti e mansioni';

  // ==========================================
  // SECTION 1: Executive Summary
  // ==========================================
  let y = pdf.getContentStartY() + 50; // After cover metadata

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(14);
  doc.text('1. RIEPILOGO ESECUTIVO', margin, y);
  y += 8;

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(10);
  doc.text(`Perimetro del report: ${filterContext}`, margin, y);
  y += 6;
  doc.text(`Data generazione: ${format(new Date(), "dd MMMM yyyy 'alle' HH:mm", { locale: it })}`, margin, y);
  y += 10;

  // KPI Summary
  const criticalAssets = assets.filter(a => a.criticality === 'Critico' || a.criticality === 'Alto');
  const assetsWithIssues = assets.filter(a => 
    !a.antivirus_installed || 
    !a.backup_enabled || 
    (a.operating_system && OBSOLETE_OS.some(os => a.operating_system?.toLowerCase().includes(os.toLowerCase())))
  );
  const overdueTests = tests.filter(t => t.next_due_date && new Date(t.next_due_date) < new Date());
  const untreatedRisks = risks.filter(r => r.status === 'Identificato' && (r.inherent_risk_level === 'Critico' || r.inherent_risk_level === 'Alto'));

  const summaryData = [
    ['Indicatore', 'Valore', 'Stato'],
    ['Asset totali monitorati', assets.length.toString(), '-'],
    ['Asset critici/alti', criticalAssets.length.toString(), criticalAssets.length > 5 ? '⚠️ Attenzione' : '✓ OK'],
    ['Asset con problemi di configurazione', assetsWithIssues.length.toString(), assetsWithIssues.length > 0 ? '⚠️ Da verificare' : '✓ OK'],
    ['Test/verifiche in ritardo', overdueTests.length.toString(), overdueTests.length > 0 ? '⚠️ Urgente' : '✓ OK'],
    ['Rischi critici non trattati', untreatedRisks.length.toString(), untreatedRisks.length > 0 ? '⚠️ Priorità' : '✓ OK'],
    ['Personale formato (ultimo anno)', trainings.filter(t => new Date(t.training_date) > new Date(Date.now() - 365*24*60*60*1000)).length.toString(), '-'],
  ];

  autoTable(doc, {
    startY: y,
    head: [summaryData[0]],
    body: summaryData.slice(1),
    margin: { left: margin, right: margin },
    styles: { fontSize: 9 },
    headStyles: { fillColor: [30, 58, 138], textColor: [255, 255, 255] },
    columnStyles: {
      0: { cellWidth: 80 },
      1: { cellWidth: 40, halign: 'center' },
      2: { cellWidth: 40, halign: 'center' },
    },
  });

  y = (doc as any).lastAutoTable.finalY + 15;

  // ==========================================
  // SECTION 2: Critical Assets
  // ==========================================
  pdf.addPage();
  y = pdf.getContentStartY();

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(14);
  doc.text('2. ASSET CRITICI E CONFIGURAZIONI A RISCHIO', margin, y);
  y += 10;

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(10);
  doc.text('Asset con sistema operativo obsoleto, senza antivirus o senza backup:', margin, y);
  y += 8;

  const criticalAssetsData = assetsWithIssues.map(asset => {
    const issues = [];
    if (!asset.antivirus_installed) issues.push('No Antivirus');
    if (!asset.backup_enabled) issues.push('No Backup');
    if (asset.operating_system && OBSOLETE_OS.some(os => asset.operating_system?.toLowerCase().includes(os.toLowerCase()))) {
      issues.push('OS Obsoleto');
    }
    return [
      asset.name,
      asset.asset_type || '-',
      asset.criticality || '-',
      asset.operating_system || '-',
      issues.join(', ') || '-',
      asset.department || '-',
    ];
  });

  if (criticalAssetsData.length > 0) {
    autoTable(doc, {
      startY: y,
      head: [['Nome Asset', 'Tipo', 'Criticità', 'Sistema Operativo', 'Problemi', 'Reparto']],
      body: criticalAssetsData,
      margin: { left: margin, right: margin },
      styles: { fontSize: 8 },
      headStyles: { fillColor: [30, 58, 138], textColor: [255, 255, 255] },
      columnStyles: {
        0: { cellWidth: 35 },
        1: { cellWidth: 25 },
        2: { cellWidth: 20 },
        3: { cellWidth: 35 },
        4: { cellWidth: 30 },
        5: { cellWidth: 25 },
      },
    });
    y = (doc as any).lastAutoTable.finalY + 10;
  } else {
    doc.text('✓ Nessun asset con configurazioni critiche rilevato.', margin, y);
    y += 10;
  }

  // All Critical/High Assets Table
  y += 5;
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(11);
  doc.text('2.1 Elenco completo Asset Critici/Alti', margin, y);
  y += 8;

  const allCriticalData = criticalAssets.map(asset => [
    asset.asset_id || '-',
    asset.name,
    asset.asset_type || '-',
    asset.criticality,
    asset.antivirus_installed ? 'Sì' : 'No',
    asset.backup_enabled ? 'Sì' : 'No',
    asset.owner || '-',
  ]);

  if (allCriticalData.length > 0) {
    autoTable(doc, {
      startY: y,
      head: [['ID', 'Nome', 'Tipo', 'Criticità', 'Antivirus', 'Backup', 'Responsabile']],
      body: allCriticalData,
      margin: { left: margin, right: margin },
      styles: { fontSize: 8 },
      headStyles: { fillColor: [30, 58, 138], textColor: [255, 255, 255] },
    });
  }

  // ==========================================
  // SECTION 3: Verification Status
  // ==========================================
  pdf.addPage();
  y = pdf.getContentStartY();

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(14);
  doc.text('3. STATO VERIFICHE PERIODICHE', margin, y);
  y += 10;

  // Overdue tests
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(11);
  doc.text('3.1 Test in ritardo', margin, y);
  y += 8;

  const overdueTestsData = overdueTests.map(test => [
    test.test_name,
    test.test_type,
    test.assets?.name || '-',
    test.next_due_date ? formatItalianDate(test.next_due_date) : '-',
    test.roles?.role_name || test.responsible_person || '-',
    test.last_execution_date ? formatItalianDate(test.last_execution_date) : 'Mai eseguito',
  ]);

  if (overdueTestsData.length > 0) {
    autoTable(doc, {
      startY: y,
      head: [['Nome Test', 'Tipo', 'Asset', 'Scadenza', 'Responsabile', 'Ultima Esecuzione']],
      body: overdueTestsData,
      margin: { left: margin, right: margin },
      styles: { fontSize: 8 },
      headStyles: { fillColor: [185, 28, 28], textColor: [255, 255, 255] },
    });
    y = (doc as any).lastAutoTable.finalY + 10;
  } else {
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    doc.text('✓ Nessun test in ritardo.', margin, y);
    y += 10;
  }

  // Recent tests (last 30 days)
  y += 5;
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(11);
  doc.text('3.2 Ultime verifiche eseguite', margin, y);
  y += 8;

  const thirtyDaysAgo = new Date(Date.now() - 30*24*60*60*1000);
  const recentTests = tests.filter(t => t.last_execution_date && new Date(t.last_execution_date) > thirtyDaysAgo);

  const recentTestsData = recentTests.slice(0, 15).map(test => [
    test.test_name,
    test.test_type,
    test.assets?.name || '-',
    test.last_execution_date ? formatItalianDate(test.last_execution_date) : '-',
    test.roles?.role_name || test.responsible_person || '-',
  ]);

  if (recentTestsData.length > 0) {
    autoTable(doc, {
      startY: y,
      head: [['Nome Test', 'Tipo', 'Asset', 'Data Esecuzione', 'Responsabile']],
      body: recentTestsData,
      margin: { left: margin, right: margin },
      styles: { fontSize: 8 },
      headStyles: { fillColor: [30, 58, 138], textColor: [255, 255, 255] },
    });
    y = (doc as any).lastAutoTable.finalY + 10;
  } else {
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    doc.text('Nessun test eseguito negli ultimi 30 giorni.', margin, y);
    y += 10;
  }

  // Upcoming tests
  y += 5;
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(11);
  doc.text('3.3 Prossime verifiche programmate', margin, y);
  y += 8;

  const nowDate = new Date();
  const in30Days = new Date(Date.now() + 30*24*60*60*1000);
  const upcomingTests = tests.filter(t => {
    if (!t.next_due_date) return false;
    const dueDate = new Date(t.next_due_date);
    return dueDate >= nowDate && dueDate <= in30Days;
  }).slice(0, 15);

  const upcomingTestsData = upcomingTests.map(test => [
    test.test_name,
    test.test_type,
    test.assets?.name || '-',
    test.assets?.criticality || '-',
    test.next_due_date ? formatItalianDate(test.next_due_date) : '-',
    test.roles?.role_name || test.responsible_person || '-',
  ]);

  if (upcomingTestsData.length > 0) {
    autoTable(doc, {
      startY: y,
      head: [['Nome Test', 'Tipo', 'Asset', 'Criticità', 'Scadenza', 'Responsabile']],
      body: upcomingTestsData,
      margin: { left: margin, right: margin },
      styles: { fontSize: 8 },
      headStyles: { fillColor: [30, 58, 138], textColor: [255, 255, 255] },
    });
  }

  // ==========================================
  // SECTION 4: Training Status
  // ==========================================
  pdf.addPage();
  y = pdf.getContentStartY();

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(14);
  doc.text('4. PERSONALE E FORMAZIONE', margin, y);
  y += 10;

  // Group trainings by employee
  const employeeTrainings = new Map<string, any[]>();
  trainings.forEach(t => {
    const name = t.employee_name?.toLowerCase() || 'sconosciuto';
    if (!employeeTrainings.has(name)) {
      employeeTrainings.set(name, []);
    }
    employeeTrainings.get(name)!.push(t);
  });

  const oneYearAgo = new Date(Date.now() - 365*24*60*60*1000);
  
  const trainingStatusData = Array.from(employeeTrainings.entries()).map(([name, records]) => {
    const latestTraining = records.sort((a, b) => new Date(b.training_date).getTime() - new Date(a.training_date).getTime())[0];
    const isUpToDate = new Date(latestTraining.training_date) > oneYearAgo;
    const role = latestTraining.role_id ? roles.find(r => r.id === latestTraining.role_id)?.role_name : latestTraining.department || '-';
    
    return [
      name.charAt(0).toUpperCase() + name.slice(1),
      role || '-',
      latestTraining.training_type || '-',
      formatItalianDate(latestTraining.training_date),
      isUpToDate ? '✓ In regola' : '⚠️ Da rinnovare',
    ];
  });

  if (trainingStatusData.length > 0) {
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    doc.text(`Totale personale tracciato: ${employeeTrainings.size}`, margin, y);
    y += 8;

    autoTable(doc, {
      startY: y,
      head: [['Dipendente', 'Ruolo/Reparto', 'Ultimo Corso', 'Data Formazione', 'Stato']],
      body: trainingStatusData,
      margin: { left: margin, right: margin },
      styles: { fontSize: 8 },
      headStyles: { fillColor: [30, 58, 138], textColor: [255, 255, 255] },
    });
    y = (doc as any).lastAutoTable.finalY + 10;
  } else {
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    doc.text('Nessun record di formazione disponibile.', margin, y);
    y += 10;
  }

  // ==========================================
  // SECTION 5: Risks Summary
  // ==========================================
  y += 10;
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(14);
  doc.text('5. RISCHI NON TRATTATI', margin, y);
  y += 10;

  const untreatedRisksData = untreatedRisks.map(risk => [
    risk.risk_id || '-',
    risk.risk_name || '-',
    risk.inherent_risk_level || '-',
    risk.assets?.name || '-',
    risk.threat_description?.substring(0, 50) + '...' || '-',
  ]);

  if (untreatedRisksData.length > 0) {
    autoTable(doc, {
      startY: y,
      head: [['ID Rischio', 'Nome', 'Livello', 'Asset', 'Minaccia']],
      body: untreatedRisksData,
      margin: { left: margin, right: margin },
      styles: { fontSize: 8 },
      headStyles: { fillColor: [185, 28, 28], textColor: [255, 255, 255] },
    });
  } else {
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    doc.text('✓ Nessun rischio critico/alto non trattato.', margin, y);
  }

  // ==========================================
  // Finalize PDF
  // ==========================================
  const filename = `Report_Sicurezza_${organization.name.replace(/\s+/g, '_')}_${format(new Date(), 'yyyy-MM-dd')}.pdf`;
  await pdf.finalize(filename);
}
