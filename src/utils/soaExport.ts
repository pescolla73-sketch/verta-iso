import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { Document, Packer, Paragraph, Table, TableCell, TableRow, WidthType, AlignmentType, HeadingLevel, TextRun } from 'docx';

declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
    lastAutoTable: { finalY: number };
  }
}

interface Control {
  control_id: string;
  title: string;
  domain: string;
  status: string;
  responsible: string | null;
  last_verification_date: string | null;
  implementation_notes: string | null;
}

interface Organization {
  name: string;
  sector: string | null;
  scope: string | null;
}

interface SoAData {
  controls: Control[];
  organization: Organization;
  date: string;
  version: string;
}

function getStatusLabel(status: string): string {
  const statusMap: { [key: string]: string } = {
    implemented: 'Implementato',
    partially_implemented: 'Parzialmente Implementato',
    not_implemented: 'Non Implementato',
    not_applicable: 'N/A',
  };
  return statusMap[status] || status;
}

function getDomainLabel(domain: string): string {
  const domainMap: { [key: string]: string } = {
    organizational: 'Organizzativo',
    people: 'Persone',
    physical: 'Fisico',
    technological: 'Tecnologico',
  };
  return domainMap[domain] || domain;
}

function calculateStatistics(controls: Control[]) {
  const total = controls.length;
  const implemented = controls.filter(c => c.status === 'implemented').length;
  const partiallyImplemented = controls.filter(c => c.status === 'partially_implemented').length;
  const notImplemented = controls.filter(c => c.status === 'not_implemented').length;
  const notApplicable = controls.filter(c => c.status === 'not_applicable').length;
  const applicable = total - notApplicable;
  const compliancePercentage = applicable > 0 
    ? Math.round(((implemented + partiallyImplemented * 0.5) / applicable) * 100) 
    : 0;

  return {
    total,
    implemented,
    partiallyImplemented,
    notImplemented,
    notApplicable,
    applicable,
    compliancePercentage,
  };
}

export async function generateSoAPDF(data: SoAData) {
  const doc = new jsPDF();
  const stats = calculateStatistics(data.controls);

  // Cover Page
  doc.setFontSize(24);
  doc.text('Statement of Applicability', 105, 40, { align: 'center' });
  doc.setFontSize(18);
  doc.text('ISO/IEC 27001:2022', 105, 55, { align: 'center' });
  
  doc.setFontSize(12);
  doc.text(`Organizzazione: ${data.organization.name}`, 20, 80);
  if (data.organization.sector) {
    doc.text(`Settore: ${data.organization.sector}`, 20, 90);
  }
  if (data.organization.scope) {
    doc.text(`Ambito: ${data.organization.scope}`, 20, 100);
  }
  doc.text(`Data: ${data.date}`, 20, 110);
  doc.text(`Versione: ${data.version}`, 20, 120);

  // Statistics Summary
  doc.addPage();
  doc.setFontSize(16);
  doc.text('Riepilogo Statistiche', 20, 20);
  
  doc.setFontSize(11);
  const statsData = [
    ['Controlli Totali', stats.total.toString()],
    ['Controlli Applicabili', stats.applicable.toString()],
    ['Controlli Non Applicabili', stats.notApplicable.toString()],
    ['Implementati', stats.implemented.toString()],
    ['Parzialmente Implementati', stats.partiallyImplemented.toString()],
    ['Non Implementati', stats.notImplemented.toString()],
    ['Percentuale di Conformità', `${stats.compliancePercentage}%`],
  ];

  doc.autoTable({
    startY: 30,
    head: [['Metrica', 'Valore']],
    body: statsData,
    theme: 'grid',
    headStyles: { fillColor: [66, 66, 66] },
  });

  // Controls Table
  doc.addPage();
  doc.setFontSize(16);
  doc.text('Controlli ISO 27001:2022', 20, 20);

  const tableData = data.controls
    .sort((a, b) => a.control_id.localeCompare(b.control_id))
    .map(control => [
      control.control_id,
      control.title.substring(0, 50) + (control.title.length > 50 ? '...' : ''),
      getDomainLabel(control.domain),
      control.status === 'not_applicable' ? 'No' : 'Sì',
      getStatusLabel(control.status),
      control.responsible || '-',
      control.last_verification_date || '-',
    ]);

  doc.autoTable({
    startY: 30,
    head: [['ID', 'Titolo', 'Dominio', 'Applicabile', 'Stato', 'Responsabile', 'Ultima Verifica']],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: [66, 66, 66], fontSize: 9 },
    bodyStyles: { fontSize: 8 },
    columnStyles: {
      0: { cellWidth: 15 },
      1: { cellWidth: 50 },
      2: { cellWidth: 25 },
      3: { cellWidth: 20 },
      4: { cellWidth: 30 },
      5: { cellWidth: 25 },
      6: { cellWidth: 25 },
    },
    margin: { left: 10, right: 10 },
  });

  // Save PDF
  doc.save(`SoA_${data.organization.name.replace(/\s+/g, '_')}_${data.version}.pdf`);
}

export async function generateSoAWord(data: SoAData) {
  const stats = calculateStatistics(data.controls);

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          // Cover Page
          new Paragraph({
            text: 'Statement of Applicability',
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 },
          }),
          new Paragraph({
            text: 'ISO/IEC 27001:2022',
            heading: HeadingLevel.HEADING_2,
            alignment: AlignmentType.CENTER,
            spacing: { after: 600 },
          }),
          new Paragraph({
            text: `Organizzazione: ${data.organization.name}`,
            spacing: { after: 200 },
          }),
          ...(data.organization.sector ? [
            new Paragraph({
              text: `Settore: ${data.organization.sector}`,
              spacing: { after: 200 },
            }),
          ] : []),
          ...(data.organization.scope ? [
            new Paragraph({
              text: `Ambito: ${data.organization.scope}`,
              spacing: { after: 200 },
            }),
          ] : []),
          new Paragraph({
            text: `Data: ${data.date}`,
            spacing: { after: 200 },
          }),
          new Paragraph({
            text: `Versione: ${data.version}`,
            spacing: { after: 600 },
          }),

          // Statistics
          new Paragraph({
            text: 'Riepilogo Statistiche',
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 400, after: 200 },
          }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Metrica', bold: true })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Valore', bold: true })] })] }),
                ],
              }),
              ...Object.entries({
                'Controlli Totali': stats.total,
                'Controlli Applicabili': stats.applicable,
                'Controlli Non Applicabili': stats.notApplicable,
                'Implementati': stats.implemented,
                'Parzialmente Implementati': stats.partiallyImplemented,
                'Non Implementati': stats.notImplemented,
                'Percentuale di Conformità': `${stats.compliancePercentage}%`,
              }).map(([key, value]) => 
                new TableRow({
                  children: [
                    new TableCell({ children: [new Paragraph(key)] }),
                    new TableCell({ children: [new Paragraph(value.toString())] }),
                  ],
                })
              ),
            ],
          }),

          // Controls Table
          new Paragraph({
            text: 'Controlli ISO 27001:2022',
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 600, after: 200 },
          }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'ID', bold: true })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Titolo', bold: true })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Dominio', bold: true })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Applicabile', bold: true })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Stato', bold: true })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Responsabile', bold: true })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Ultima Verifica', bold: true })] })] }),
                ],
              }),
              ...data.controls
                .sort((a, b) => a.control_id.localeCompare(b.control_id))
                .map(control => 
                  new TableRow({
                    children: [
                      new TableCell({ children: [new Paragraph(control.control_id)] }),
                      new TableCell({ children: [new Paragraph(control.title)] }),
                      new TableCell({ children: [new Paragraph(getDomainLabel(control.domain))] }),
                      new TableCell({ children: [new Paragraph(control.status === 'not_applicable' ? 'No' : 'Sì')] }),
                      new TableCell({ children: [new Paragraph(getStatusLabel(control.status))] }),
                      new TableCell({ children: [new Paragraph(control.responsible || '-')] }),
                      new TableCell({ children: [new Paragraph(control.last_verification_date || '-')] }),
                    ],
                  })
                ),
            ],
          }),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `SoA_${data.organization.name.replace(/\s+/g, '_')}_${data.version}.docx`;
  link.click();
  window.URL.revokeObjectURL(url);
}
