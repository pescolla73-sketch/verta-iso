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
  private margin: number = 20;
  private headerHeight: number = 45;
  private footerHeight: number = 25;
  private contentStartY: number;

  constructor(organization: Organization, metadata: DocumentMetadata) {
    this.doc = new jsPDF();
    this.organization = organization;
    this.metadata = metadata;
    this.pageHeight = this.doc.internal.pageSize.height;
    this.pageWidth = this.doc.internal.pageSize.width;
    this.contentStartY = this.margin + this.headerHeight + 10;
  }


  private addHeader(isFirstPage: boolean = false) {
    const startY = this.margin;
    
    // Company info - text only
    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'bold');
    let y = startY;
    
    this.doc.text(this.organization.name, this.margin, y);
    y += 7;
    
    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(9);
    
    if (this.organization.piva) {
      this.doc.text(`P.IVA: ${this.organization.piva}`, this.margin, y);
      y += 6;
    }
    if (this.organization.website) {
      this.doc.text(this.organization.website, this.margin, y);
      y += 6;
    }

    // Separator line
    this.doc.setDrawColor(200, 200, 200);
    this.doc.setLineWidth(0.5);
    this.doc.line(this.margin, startY + this.headerHeight, this.pageWidth - this.margin, startY + this.headerHeight);

    if (isFirstPage) {
      this.addCoverPageMetadata();
    }
  }

  private addCoverPageMetadata() {
    let y = this.margin + 45;
    const centerX = this.pageWidth / 2;

    // Document Title
    this.doc.setFontSize(20);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(this.metadata.documentType.toUpperCase(), centerX, y, { align: 'center' });
    y += 10;

    this.doc.setFontSize(16);
    this.doc.text('ISO/IEC 27001:2022', centerX, y, { align: 'center' });
    y += 20;

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
    const footerY = this.pageHeight - this.footerHeight;
    
    // Footer separator line
    this.doc.setDrawColor(200, 200, 200);
    this.doc.setLineWidth(0.5);
    this.doc.line(this.margin, footerY - 5, this.pageWidth - this.margin, footerY - 5);
    
    this.doc.setFontSize(8);
    this.doc.setFont('helvetica', 'normal');

    // Line 1: Document metadata
    const docDate = formatItalianDate(this.metadata.revisionDate || this.metadata.issueDate);
    const docInfo = `${this.metadata.documentType} ${this.metadata.version} - ${docDate}`;
    this.doc.text(docInfo, this.margin, footerY + 2);

    // Line 2: Company address
    const addressParts = [];
    if (this.organization.legal_address_street) addressParts.push(this.organization.legal_address_street);
    if (this.organization.legal_address_zip && this.organization.legal_address_city) {
      addressParts.push(`${this.organization.legal_address_zip} ${this.organization.legal_address_city}`);
    }
    
    let footerLine2 = `${this.organization.name}`;
    if (addressParts.length > 0) {
      footerLine2 += ` - ${addressParts.join(', ')}`;
    }
    this.doc.text(footerLine2, this.margin, footerY + 7);

    // Line 3: Classification and page number
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(
      CLASSIFICATION_LABELS[this.metadata.classification],
      this.margin,
      footerY + 12
    );
    
    this.doc.text(
      `Pagina ${pageNumber} di ${totalPages}`,
      this.pageWidth - this.margin,
      footerY + 12,
      { align: 'right' }
    );
  }

  getContentStartY(): number {
    return this.contentStartY;
  }

  getContentMaxY(): number {
    return this.pageHeight - this.footerHeight - 10;
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
      margin: { left: this.margin, right: this.margin },
      didDrawPage: (data) => {
        // Headers and footers are added separately
      },
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
