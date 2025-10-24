import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Document, Packer, Paragraph, Table, TableCell, TableRow, WidthType, AlignmentType, HeadingLevel, TextRun, ImageRun } from 'docx';
import { 
  ProfessionalPDF, 
  Organization as BrandedOrg, 
  DocumentMetadata,
  calculateNextReviewDate,
  formatItalianDate,
  generateDocumentId
} from './pdfBranding';

// Helper function to load image
async function loadImage(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = reject;
    img.src = url;
  });
}

// Helper to convert image URL to buffer for docx
async function imageUrlToBuffer(url: string): Promise<Uint8Array> {
  const response = await fetch(url);
  const arrayBuffer = await response.arrayBuffer();
  return new Uint8Array(arrayBuffer);
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
  logo_url: string | null;
  ciso?: string | null;
  piva?: string | null;
  isms_scope?: string | null;
  website?: string | null;
  contact_phone?: string | null;
  contact_email?: string | null;
  legal_address_street?: string | null;
  legal_address_city?: string | null;
  legal_address_zip?: string | null;
  legal_address_province?: string | null;
  legal_address_country?: string | null;
}

interface SoAData {
  controls: Control[];
  organization: Organization;
  date: string;
  version: string;
  metadata?: {
    status?: 'draft' | 'approved' | 'in_review';
    classification?: 'confidential' | 'internal' | 'public';
    preparedBy?: string;
    approvedBy?: string;
    approvalDate?: string;
  };
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

export function calculateStatistics(controls: Control[]) {
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
  const stats = calculateStatistics(data.controls);
  const today = new Date().toISOString().split('T')[0];
  const nextReview = calculateNextReviewDate(today);
  
  // Prepare document metadata
  const documentId = generateDocumentId('SoA', data.organization.name, data.version);
  const metadata: DocumentMetadata = {
    documentType: 'STATEMENT OF APPLICABILITY',
    documentId,
    version: data.version,
    issueDate: formatItalianDate(today),
    revisionDate: formatItalianDate(today),
    nextReviewDate: formatItalianDate(nextReview),
    status: data.metadata?.status || 'draft',
    classification: data.metadata?.classification || 'confidential',
    preparedBy: data.metadata?.preparedBy || data.organization.ciso || 'Non specificato',
    approvedBy: data.metadata?.approvedBy,
    approvalDate: data.metadata?.approvalDate ? formatItalianDate(data.metadata.approvalDate) : undefined,
  };

  // Create professional PDF
  const pdf = new ProfessionalPDF(data.organization as BrandedOrg, metadata);
  await pdf.initialize();

  // Add cover page (automatically done by header on first page)
  pdf.addPage();

  // Statistics Page
  let y = pdf.getContentStartY();
  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'bold');
  pdf.addText('Riepilogo Statistiche', y);
  y += 15;

  const statsData = [
    ['Metrica', 'Valore'],
    ['Controlli Totali', stats.total.toString()],
    ['Controlli Applicabili', stats.applicable.toString()],
    ['Controlli Non Applicabili', stats.notApplicable.toString()],
    ['Implementati', stats.implemented.toString()],
    ['Parzialmente Implementati', stats.partiallyImplemented.toString()],
    ['Non Implementati', stats.notImplemented.toString()],
    ['Percentuale di Conformità', `${stats.compliancePercentage}%`],
  ];

  autoTable(pdf.getDoc(), {
    startY: y,
    head: [statsData[0]],
    body: statsData.slice(1),
    theme: 'grid',
    headStyles: { fillColor: [66, 66, 66], textColor: 255, fontStyle: 'bold' },
    margin: { left: 20, right: 20 },
  });

  // Controls Table
  pdf.addPage();
  y = pdf.getContentStartY();
  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'bold');
  pdf.addText('Controlli ISO 27001:2022', y);
  y += 15;

  const sortedControls = data.controls.sort((a, b) => 
    a.control_id.localeCompare(b.control_id)
  );

  const controlsData = sortedControls.map(control => [
    control.control_id,
    control.title,
    getDomainLabel(control.domain),
    control.status === 'not_applicable' ? 'No' : 'Sì',
    getStatusLabel(control.status),
    control.responsible || '-',
  ]);

  autoTable(pdf.getDoc(), {
    startY: y,
    head: [['ID', 'Titolo', 'Dominio', 'Applicabile', 'Stato', 'Responsabile']],
    body: controlsData,
    theme: 'grid',
    headStyles: { fillColor: [66, 66, 66], textColor: 255, fontStyle: 'bold', fontSize: 9 },
    bodyStyles: { fontSize: 8 },
    columnStyles: {
      0: { cellWidth: 20 },
      1: { cellWidth: 60 },
      2: { cellWidth: 25 },
      3: { cellWidth: 20 },
      4: { cellWidth: 35 },
      5: { cellWidth: 30 },
    },
    margin: { left: 20, right: 20 },
  });

  // Finalize and save
  await pdf.finalize(`SoA_${data.organization.name.replace(/\s+/g, '_')}_${data.version}.pdf`);
}

export function generateSoAHTML(data: SoAData) {
  const stats = calculateStatistics(data.controls);
  
  const logoHtml = data.organization.logo_url 
    ? `<img src="${data.organization.logo_url}" alt="Logo" style="max-width: 100px; max-height: 100px; margin-bottom: 20px;" />`
    : '';

  const html = `
<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8">
  <title>Statement of Applicability - ${data.organization.name}</title>
  <style>
    @media print {
      @page { margin: 2cm; }
      body { margin: 0; }
    }
    body {
      font-family: Arial, sans-serif;
      max-width: 210mm;
      margin: 0 auto;
      padding: 20px;
      font-size: 11pt;
    }
    .cover {
      text-align: center;
      margin-bottom: 50px;
      page-break-after: always;
    }
    .cover h1 {
      font-size: 28pt;
      margin-bottom: 10px;
    }
    .cover h2 {
      font-size: 20pt;
      color: #666;
      margin-bottom: 40px;
    }
    .info {
      text-align: left;
      margin: 20px auto;
      max-width: 400px;
    }
    .stats {
      margin: 30px 0;
      page-break-after: always;
    }
    .stats h3 {
      font-size: 18pt;
      margin-bottom: 20px;
    }
    .stat-line {
      margin: 10px 0;
      padding: 10px;
      background: #f5f5f5;
      border-left: 4px solid #424242;
    }
    .controls h3 {
      font-size: 18pt;
      margin-bottom: 20px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 20px;
    }
    th, td {
      border: 1px solid #ddd;
      padding: 8px;
      text-align: left;
      font-size: 9pt;
    }
    th {
      background-color: #424242;
      color: white;
    }
    tr:nth-child(even) {
      background-color: #f9f9f9;
    }
    .status-implemented { color: #2e7d32; font-weight: bold; }
    .status-partial { color: #f57c00; font-weight: bold; }
    .status-not { color: #c62828; font-weight: bold; }
    .status-na { color: #757575; }
  </style>
</head>
<body>
  <div class="cover">
    ${logoHtml}
    <h1>Statement of Applicability</h1>
    <h2>ISO/IEC 27001:2022</h2>
    <div class="info">
      <p><strong>Organizzazione:</strong> ${data.organization.name}</p>
      ${data.organization.sector ? `<p><strong>Settore:</strong> ${data.organization.sector}</p>` : ''}
      ${data.organization.scope ? `<p><strong>Ambito:</strong> ${data.organization.scope}</p>` : ''}
      <p><strong>Data:</strong> ${data.date}</p>
      <p><strong>Versione:</strong> ${data.version}</p>
    </div>
  </div>

  <div class="stats">
    <h3>Riepilogo Statistiche</h3>
    <div class="stat-line"><strong>Controlli Totali:</strong> ${stats.total}</div>
    <div class="stat-line"><strong>Controlli Applicabili:</strong> ${stats.applicable}</div>
    <div class="stat-line"><strong>Controlli Non Applicabili:</strong> ${stats.notApplicable}</div>
    <div class="stat-line"><strong>Implementati:</strong> ${stats.implemented}</div>
    <div class="stat-line"><strong>Parzialmente Implementati:</strong> ${stats.partiallyImplemented}</div>
    <div class="stat-line"><strong>Non Implementati:</strong> ${stats.notImplemented}</div>
    <div class="stat-line"><strong>Percentuale di Conformità:</strong> ${stats.compliancePercentage}%</div>
  </div>

  <div class="controls">
    <h3>Controlli ISO 27001:2022</h3>
    <table>
      <thead>
        <tr>
          <th>ID</th>
          <th>Titolo</th>
          <th>Dominio</th>
          <th>Applicabile</th>
          <th>Stato</th>
          <th>Responsabile</th>
        </tr>
      </thead>
      <tbody>
        ${data.controls
          .sort((a, b) => a.control_id.localeCompare(b.control_id))
          .map(control => {
            const statusClass = 
              control.status === 'implemented' ? 'status-implemented' :
              control.status === 'partially_implemented' ? 'status-partial' :
              control.status === 'not_applicable' ? 'status-na' : 'status-not';
            
            return `
              <tr>
                <td>${control.control_id}</td>
                <td>${control.title}</td>
                <td>${getDomainLabel(control.domain)}</td>
                <td>${control.status === 'not_applicable' ? 'No' : 'Sì'}</td>
                <td class="${statusClass}">${getStatusLabel(control.status)}</td>
                <td>${control.responsible || '-'}</td>
              </tr>
            `;
          }).join('')}
      </tbody>
    </table>
  </div>
</body>
</html>
  `;

  const blob = new Blob([html], { type: 'text/html' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `SoA_${data.organization.name.replace(/\s+/g, '_')}_${data.version}.html`;
  link.click();
  window.URL.revokeObjectURL(url);
  
  // Also open in new window for printing
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
  }
}

export async function generateSoAWord(data: SoAData) {
  const stats = calculateStatistics(data.controls);

    // Add logo if available
    const logoImage = data.organization.logo_url 
      ? [new Paragraph({
          children: [
            new ImageRun({
              data: await imageUrlToBuffer(data.organization.logo_url),
              transformation: { width: 100, height: 100 },
              type: 'png',
            }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 400 },
        })]
      : [];

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          ...logoImage,
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
