import jsPDF from 'jspdf';
import { Document, Packer, Paragraph, Table, TableCell, TableRow, WidthType, AlignmentType, HeadingLevel, TextRun, ImageRun } from 'docx';

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
  const doc = new jsPDF();
  const stats = calculateStatistics(data.controls);
  let y = 20;

  // Add logo if available
  if (data.organization.logo_url) {
    try {
      const img = await loadImage(data.organization.logo_url);
      doc.addImage(img, 'PNG', 20, y, 30, 30);
      y += 5;
    } catch (error) {
      console.error('Error loading logo:', error);
    }
  }

  // Cover Page
  doc.setFontSize(24);
  doc.text('Statement of Applicability', 105, y, { align: 'center' });
  y += 15;
  
  doc.setFontSize(18);
  doc.text('ISO/IEC 27001:2022', 105, y, { align: 'center' });
  y += 25;
  
  doc.setFontSize(12);
  doc.text(`Organizzazione: ${data.organization.name}`, 20, y);
  y += 10;
  
  if (data.organization.sector) {
    doc.text(`Settore: ${data.organization.sector}`, 20, y);
    y += 10;
  }
  if (data.organization.scope) {
    doc.text(`Ambito: ${data.organization.scope}`, 20, y);
    y += 10;
  }
  doc.text(`Data: ${data.date}`, 20, y);
  y += 10;
  doc.text(`Versione: ${data.version}`, 20, y);

  // Statistics Page
  doc.addPage();
  y = 20;
  doc.setFontSize(16);
  doc.text('Riepilogo Statistiche', 20, y);
  y += 15;
  
  doc.setFontSize(11);
  doc.text(`Controlli Totali: ${stats.total}`, 20, y);
  y += 8;
  doc.text(`Controlli Applicabili: ${stats.applicable}`, 20, y);
  y += 8;
  doc.text(`Controlli Non Applicabili: ${stats.notApplicable}`, 20, y);
  y += 8;
  doc.text(`Implementati: ${stats.implemented}`, 20, y);
  y += 8;
  doc.text(`Parzialmente Implementati: ${stats.partiallyImplemented}`, 20, y);
  y += 8;
  doc.text(`Non Implementati: ${stats.notImplemented}`, 20, y);
  y += 8;
  doc.text(`Percentuale di Conformità: ${stats.compliancePercentage}%`, 20, y);

  // Controls List
  doc.addPage();
  y = 20;
  doc.setFontSize(16);
  doc.text('Controlli ISO 27001:2022', 20, y);
  y += 15;
  
  doc.setFontSize(9);
  const sortedControls = data.controls.sort((a, b) => 
    a.control_id.localeCompare(b.control_id)
  );

  sortedControls.forEach((control, index) => {
    if (y > 270) {
      doc.addPage();
      y = 20;
    }

    const line = `${control.control_id} | ${control.title.substring(0, 60)}${control.title.length > 60 ? '...' : ''} | ${getStatusLabel(control.status)}`;
    doc.text(line, 20, y);
    y += 6;
  });

  // Save PDF
  doc.save(`SoA_${data.organization.name.replace(/\s+/g, '_')}_${data.version}.pdf`);
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
