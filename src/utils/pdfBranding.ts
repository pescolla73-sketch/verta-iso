import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface Organization {
  name: string;
  piva?: string | null;
  sector?: string | null;
  scope?: string | null;
  isms_scope?: string | null;
  website?: string | null;
  contact_phone?: string | null;
  contact_email?: string | null;
  legal_address_street?: string | null;
  legal_address_city?: string | null;
  legal_address_zip?: string | null;
  legal_address_province?: string | null;
  legal_address_country?: string | null;
  ciso?: string | null;
  ceo?: string | null;
}

export interface DocumentMetadata {
  documentType: string; // SoA, Policy, Risk Assessment, etc.
  documentId: string;
  version: string;
  issueDate: string;
  revisionDate: string;
  nextReviewDate: string;
  status: 'draft' | 'approved' | 'in_review';
  classification: 'confidential' | 'internal' | 'public';
  preparedBy?: string;
  approvedBy?: string;
  approvalDate?: string;
}

const STATUS_LABELS = {
  draft: 'Bozza',
  approved: 'Approvato',
  in_review: 'In Revisione',
};

const CLASSIFICATION_LABELS = {
  confidential: 'CONFIDENZIALE',
  internal: 'INTERNO',
  public: 'PUBBLICO',
};


export class ProfessionalPDF {
  private doc: jsPDF;
  private organization: Organization;
  private metadata: DocumentMetadata;
  private pageHeight: number;
  private pageWidth: number;
  // ISO STANDARD A4 LAYOUT (210x297mm)
  private margin: number = 25; // 25mm margins all around
  private headerHeight: number = 18; // 18mm header
  private footerHeight: number = 12; // 12mm footer
  private headerSpacing: number = 2; // 2mm spacing after header
  private footerSpacing: number = 2; // 2mm spacing before footer
  private contentStartY: number; // Will be: 25 + 18 + 2 = 45mm
  private contentEndY: number; // Will be: 297 - 25 - 2 = 270mm

  constructor(organization: Organization, metadata: DocumentMetadata) {
    this.doc = new jsPDF('p', 'mm', 'a4'); // Portrait, millimeters, A4 (210x297mm)
    this.organization = organization;
    this.metadata = metadata;
    this.pageHeight = this.doc.internal.pageSize.height; // 297mm
    this.pageWidth = this.doc.internal.pageSize.width; // 210mm
    this.contentStartY = this.margin + this.headerHeight + this.headerSpacing; // 25 + 18 + 2 = 45mm
    this.contentEndY = this.pageHeight - this.margin - this.footerSpacing; // 297 - 25 - 2 = 270mm
  }


  private addHeader(isFirstPage: boolean = false) {
    let y = this.margin + 5; // Start 5mm from top margin
    
    // Line 1: Company | P.IVA | Website
    this.doc.setFontSize(9);
    this.doc.setFont('helvetica', 'normal');
    
    const headerParts = [this.organization.name];
    if (this.organization.piva) headerParts.push(`P.IVA: ${this.organization.piva}`);
    if (this.organization.website) headerParts.push(this.organization.website);
    
    this.doc.text(headerParts.join(' | '), this.margin, y);
    y += 5;

    // Line 2: Separator line
    this.doc.setDrawColor(200, 200, 200);
    this.doc.setLineWidth(0.3);
    this.doc.line(this.margin, y, this.pageWidth - this.margin, y);
    y += 4;

    // Line 3: Document Type
    this.doc.setFontSize(11);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(this.metadata.documentType.toUpperCase(), this.margin, y);
    y += 5;

    // Line 4: ISO Standard
    this.doc.setFontSize(9);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text('ISO/IEC 27001:2022', this.margin, y);

    if (isFirstPage) {
      this.addCoverPageMetadata();
    }
  }

  private addCoverPageMetadata() {
    let y = this.margin + 15;
    const centerX = this.pageWidth / 2;

    // Document Title
    this.doc.setFontSize(18);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(this.metadata.documentType.toUpperCase(), centerX, y, { align: 'center' });
    y += 8;

    this.doc.setFontSize(14);
    this.doc.text('ISO/IEC 27001:2022', centerX, y, { align: 'center' });
    y += 15;

    // Organization details
    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'normal');
    
    const addField = (label: string, value: string | null | undefined) => {
      if (value) {
        this.doc.setFont('helvetica', 'bold');
        this.doc.text(`${label}:`, this.margin, y);
        this.doc.setFont('helvetica', 'normal');
        this.doc.text(value, this.margin + 40, y);
        y += 6;
      }
    };

    addField('Organizzazione', this.organization.name);
    addField('Settore', this.organization.sector);
    addField('Ambito ISMS', this.organization.isms_scope || this.organization.scope);
    
    y += 5;

    // Document metadata
    addField('Documento', this.metadata.documentId);
    addField('Versione', this.metadata.version);
    addField('Data Emissione', this.metadata.issueDate);
    addField('Data Ultima Revisione', this.metadata.revisionDate);
    addField('Prossima Revisione', this.metadata.nextReviewDate);
    addField('Stato', STATUS_LABELS[this.metadata.status]);
    addField('Classificazione', CLASSIFICATION_LABELS[this.metadata.classification]);
    
    y += 5;

    // Approval info
    addField('Redatto da', this.metadata.preparedBy);
    addField('Approvato da', this.metadata.approvedBy);
    if (this.metadata.approvalDate) {
      addField('Data Approvazione', this.metadata.approvalDate);
    }
  }

  private addFooter(pageNumber: number, totalPages: number) {
    // Footer starts at 272mm from top (297 - 25 = 272)
    const footerStartY = this.pageHeight - this.margin - this.footerHeight;
    let y = footerStartY + 3;
    
    // Footer separator line
    this.doc.setDrawColor(200, 200, 200);
    this.doc.setLineWidth(0.3);
    this.doc.line(this.margin, footerStartY, this.pageWidth - this.margin, footerStartY);
    
    this.doc.setFontSize(7);
    this.doc.setFont('helvetica', 'normal');

    // Line 1: Doc Type v1.0 - DD/MM/YYYY | Company - Full Address
    const addressParts = [];
    if (this.organization.legal_address_street) addressParts.push(this.organization.legal_address_street);
    if (this.organization.legal_address_zip && this.organization.legal_address_city) {
      addressParts.push(`${this.organization.legal_address_zip} ${this.organization.legal_address_city}`);
    }
    
    const addressStr = addressParts.length > 0 ? ` - ${addressParts.join(', ')}` : '';
    const formattedDate = formatItalianDate(this.metadata.revisionDate);
    const footerLine1 = `${this.metadata.documentType} v${this.metadata.version} - ${formattedDate} | ${this.organization.name}${addressStr}`;
    this.doc.text(footerLine1, this.margin, y);
    y += 4;

    // Line 2: Classification (left) | Page X of Y (right)
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(
      CLASSIFICATION_LABELS[this.metadata.classification],
      this.margin,
      y
    );
    
    this.doc.text(
      `Pagina ${pageNumber} di ${totalPages}`,
      this.pageWidth - this.margin,
      y,
      { align: 'right' }
    );
  }

  getContentStartY(): number {
    return this.contentStartY;
  }

  getContentMaxY(): number {
    // Content must stop at 270mm (297 - 25 - 2)
    return this.contentEndY;
  }
  
  getPageHeight(): number {
    return this.pageHeight;
  }
  
  getMargin(): number {
    return this.margin;
  }

  addPage() {
    this.doc.addPage();
  }

  getCurrentY(): number {
    return (this.doc as any).lastAutoTable?.finalY || this.contentStartY;
  }

  addText(text: string, y: number, options?: any) {
    this.doc.text(text, this.margin, y, options);
  }

  addTable(data: any, options?: any) {
    autoTable(this.doc, {
      ...options,
      margin: { 
        left: this.margin, // 25mm
        right: this.margin, // 25mm
        top: this.contentStartY, // 45mm
        bottom: this.pageHeight - this.contentEndY // Reserve space: 297 - 270 = 27mm
      },
      startY: options?.startY || this.contentStartY,
      showHead: 'everyPage',
      pageBreak: 'auto',
    });
  }

  setFontSize(size: number) {
    this.doc.setFontSize(size);
  }

  setFont(font: string, style: string = 'normal') {
    this.doc.setFont(font, style);
  }

  async finalize(filename: string) {
    const totalPages = this.doc.getNumberOfPages();
    
    // Add headers and footers to all pages
    for (let i = 1; i <= totalPages; i++) {
      this.doc.setPage(i);
      this.addHeader(i === 1);
      this.addFooter(i, totalPages);
    }

    this.doc.save(filename);
  }

  getDoc(): jsPDF {
    return this.doc;
  }
}

// Helper function to calculate next review date (6 months from revision)
export function calculateNextReviewDate(revisionDate: string): string {
  const date = new Date(revisionDate);
  date.setMonth(date.getMonth() + 6);
  return date.toISOString().split('T')[0];
}

// Helper function to format date to Italian locale
export function formatItalianDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('it-IT');
}

// Generate document ID
export function generateDocumentId(
  docType: string,
  orgName: string,
  version: string
): string {
  const year = new Date().getFullYear();
  const cleanOrgName = orgName.replace(/\s+/g, '').substring(0, 15);
  return `${docType}-${cleanOrgName}-${year}-${version}`;
}
