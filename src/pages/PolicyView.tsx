import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { PolicyNavigation } from '@/components/PolicyNavigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Edit, Download, ArrowLeft, FileText } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ProfessionalPDF, type Organization, type DocumentMetadata } from '@/utils/pdfBranding';

export default function PolicyView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [policy, setPolicy] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadPolicy();
    }
  }, [id]);

  const loadPolicy = async () => {
    try {
      const { data, error } = await supabase
        .from('policies')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setPolicy(data);
    } catch (error) {
      console.error('Error loading policy:', error);
      toast.error('Errore nel caricamento della policy');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = () => {
    const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
      draft: { label: 'Bozza', variant: 'outline' },
      review: { label: 'In Revisione', variant: 'secondary' },
      approved: { label: 'Approvata', variant: 'default' },
      archived: { label: 'Archiviata', variant: 'outline' }
    };

    const config = statusConfig[policy?.status] || statusConfig.draft;

    return (
      <Badge variant={config.variant}>
        {config.label}
      </Badge>
    );
  };

  const exportPDF = async () => {
    try {
      console.log('📄 Starting PDF export...');
      
      // Load organization data
      const { data: orgData, error: orgError } = await supabase
        .from('organization')
        .select('*')
        .limit(1)
        .single();

      if (orgError || !orgData) {
        toast.error('Dati organizzazione mancanti');
        return;
      }

      const organization: Organization = {
        name: orgData.name,
        piva: orgData.piva,
        sector: orgData.sector,
        scope: orgData.scope,
        isms_scope: orgData.isms_scope,
        website: orgData.website,
        contact_phone: orgData.contact_phone,
        contact_email: orgData.contact_email,
        legal_address_street: orgData.legal_address_street,
        legal_address_city: orgData.legal_address_city,
        legal_address_zip: orgData.legal_address_zip,
        legal_address_province: orgData.legal_address_province,
        legal_address_country: orgData.legal_address_country,
        ciso: orgData.ciso,
        ceo: orgData.ceo,
      };

      const metadata: DocumentMetadata = {
        documentType: 'Policy - ' + (policy.policy_name || 'Untitled'),
        documentId: policy.policy_id || 'POL-XXX',
        version: policy.version || '1.0',
        issueDate: policy.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
        revisionDate: policy.updated_at?.split('T')[0] || new Date().toISOString().split('T')[0],
        nextReviewDate: policy.next_review_date || new Date(Date.now() + 180*24*60*60*1000).toISOString().split('T')[0],
        status: (policy.status === 'approved' ? 'approved' : policy.status === 'review' ? 'in_review' : 'draft') as 'draft' | 'approved' | 'in_review',
        classification: 'confidential',
        preparedBy: policy.prepared_by || 'TBD',
        approvedBy: policy.approved_by || 'TBD',
        approvalDate: policy.approval_date || undefined,
      };

      const pdf = new ProfessionalPDF(organization, metadata);
      
      // Start content on a new page (cover page is page 1)
      pdf.addPage();
      let yPos = pdf.getContentStartY();

      // 1. Purpose
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.addText('1. SCOPO', yPos);
      yPos += 10;
      
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'normal');
      const purposeLines = pdf.getDoc().splitTextToSize(policy.custom_purpose || policy.purpose || 'N/A', 170);
      pdf.addText(purposeLines, yPos);
      yPos += purposeLines.length * 6 + 10;

      // 2. Scope
      if (yPos > 250) { pdf.addPage(); yPos = pdf.getContentStartY(); }
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.addText('2. AMBITO', yPos);
      yPos += 10;
      
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'normal');
      const scopeLines = pdf.getDoc().splitTextToSize(policy.scope || 'N/A', 170);
      pdf.addText(scopeLines, yPos);
      yPos += scopeLines.length * 6 + 10;

      // 3. Policy Statement
      if (yPos > 250) { pdf.addPage(); yPos = pdf.getContentStartY(); }
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.addText('3. DICHIARAZIONE DELLA POLICY', yPos);
      yPos += 10;
      
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'normal');
      const statementLines = pdf.getDoc().splitTextToSize(policy.custom_policy_statement || policy.policy_statement || 'N/A', 170);
      pdf.addText(statementLines, yPos);
      yPos += statementLines.length * 6 + 10;

      // 4. Roles & Responsibilities
      if (policy.roles_responsibilities) {
        if (yPos > 250) { pdf.addPage(); yPos = pdf.getContentStartY(); }
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.addText('4. RUOLI E RESPONSABILITÀ', yPos);
        yPos += 10;
        
        pdf.setFontSize(11);
        pdf.setFont('helvetica', 'normal');
        const rolesLines = pdf.getDoc().splitTextToSize(policy.roles_responsibilities, 170);
        pdf.addText(rolesLines, yPos);
        yPos += rolesLines.length * 6 + 10;
      }

      // 5. Procedures
      const procedures = policy.custom_procedures || policy.procedures;
      if (procedures) {
        if (yPos > 250) { pdf.addPage(); yPos = pdf.getContentStartY(); }
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.addText('5. PROCEDURE', yPos);
        yPos += 10;
        
        pdf.setFontSize(11);
        pdf.setFont('helvetica', 'normal');
        const procLines = pdf.getDoc().splitTextToSize(procedures, 170);
        pdf.addText(procLines, yPos);
        yPos += procLines.length * 6 + 10;
      }

      // 6. Compliance Requirements
      if (policy.compliance_requirements) {
        if (yPos > 250) { pdf.addPage(); yPos = pdf.getContentStartY(); }
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.addText('6. REQUISITI DI CONFORMITÀ', yPos);
        yPos += 10;
        
        pdf.setFontSize(11);
        pdf.setFont('helvetica', 'normal');
        const complianceLines = pdf.getDoc().splitTextToSize(policy.compliance_requirements, 170);
        pdf.addText(complianceLines, yPos);
        yPos += complianceLines.length * 6 + 10;
      }

      // 7. Exceptions
      const exceptions = policy.custom_exceptions;
      if (exceptions) {
        if (yPos > 250) { pdf.addPage(); yPos = pdf.getContentStartY(); }
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.addText('7. ECCEZIONI', yPos);
        yPos += 10;
        
        pdf.setFontSize(11);
        pdf.setFont('helvetica', 'normal');
        const exceptionsLines = pdf.getDoc().splitTextToSize(exceptions, 170);
        pdf.addText(exceptionsLines, yPos);
        yPos += exceptionsLines.length * 6 + 10;
      }

      // 8. Additional Notes
      const notes = policy.custom_notes;
      if (notes) {
        if (yPos > 250) { pdf.addPage(); yPos = pdf.getContentStartY(); }
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.addText('8. NOTE AGGIUNTIVE', yPos);
        yPos += 10;
        
        pdf.setFontSize(11);
        pdf.setFont('helvetica', 'normal');
        const notesLines = pdf.getDoc().splitTextToSize(notes, 170);
        pdf.addText(notesLines, yPos);
        yPos += notesLines.length * 6 + 10;
      }

      // 9. Policy Review
      if (yPos > 250) { pdf.addPage(); yPos = pdf.getContentStartY(); }
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.addText('9. REVISIONE DELLA POLICY', yPos);
      yPos += 10;
      
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'normal');
      const reviewLines = pdf.getDoc().splitTextToSize(
        policy.review_requirements || 'Questa policy deve essere rivista annualmente.',
        170
      );
      pdf.addText(reviewLines, yPos);


      // Finalize and save
      const filename = `${policy.policy_id || 'Policy'}_${(policy.policy_name || 'Document').replace(/\s+/g, '_')}.pdf`;
      await pdf.finalize(filename);

      console.log('✅ PDF exported successfully');
      toast.success('📄 PDF esportato con successo!');
    } catch (error) {
      console.error('❌ Export error:', error);
      toast.error('Errore durante l\'esportazione PDF');
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="p-6">Caricamento...</div>
      </AppLayout>
    );
  }

  if (!policy) {
    return (
      <AppLayout>
        <div className="p-6">
          <PolicyNavigation />
          <p>Policy non trovata</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6 max-w-5xl mx-auto">
        <PolicyNavigation currentPage={policy.policy_name} />

        {/* Header */}
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline">{policy.policy_id || 'POL-XXX'}</Badge>
              {getStatusBadge()}
              <span className="text-sm text-muted-foreground">v{policy.version}</span>
            </div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <FileText className="h-8 w-8" />
              {policy.policy_name}
            </h1>
            {policy.iso_reference && policy.iso_reference.length > 0 && (
              <div className="flex gap-2 mt-2">
                {policy.iso_reference.map((ref: string) => (
                  <Badge key={ref} variant="outline">ISO 27001:{ref}</Badge>
                ))}
                {policy.nis2_reference?.map((ref: string) => (
                  <Badge key={ref} variant="outline" className="bg-blue-50">NIS2 {ref}</Badge>
                ))}
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => navigate('/policies')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Indietro
            </Button>
            <Button
              variant="outline"
              onClick={exportPDF}
            >
              <Download className="h-4 w-4 mr-2" />
              Esporta PDF
            </Button>
            <Button
              onClick={() => navigate(`/policy-editor/${id}`)}
            >
              <Edit className="h-4 w-4 mr-2" />
              Modifica
            </Button>
          </div>
        </div>

        {/* Policy Content */}
        <Card>
          <CardHeader>
            <CardTitle>Contenuto Policy</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 prose prose-sm max-w-none">
            {(policy.custom_purpose || policy.purpose) && (
              <div>
                <h3 className="text-lg font-semibold mb-2">1. Scopo</h3>
                <p className="whitespace-pre-wrap text-muted-foreground">{policy.custom_purpose || policy.purpose}</p>
              </div>
            )}

            {policy.scope && (
              <>
                <Separator />
                <div>
                  <h3 className="text-lg font-semibold mb-2">2. Ambito</h3>
                  <p className="whitespace-pre-wrap text-muted-foreground">{policy.scope}</p>
                </div>
              </>
            )}

            {(policy.custom_policy_statement || policy.policy_statement) && (
              <>
                <Separator />
                <div>
                  <h3 className="text-lg font-semibold mb-2">3. Dichiarazione della Policy</h3>
                  <p className="whitespace-pre-wrap text-muted-foreground">{policy.custom_policy_statement || policy.policy_statement}</p>
                </div>
              </>
            )}

            {policy.roles_responsibilities && (
              <>
                <Separator />
                <div>
                  <h3 className="text-lg font-semibold mb-2">4. Ruoli e Responsabilità</h3>
                  <p className="whitespace-pre-wrap text-muted-foreground">{policy.roles_responsibilities}</p>
                </div>
              </>
            )}

            {(policy.custom_procedures || policy.procedures) && (
              <>
                <Separator />
                <div>
                  <h3 className="text-lg font-semibold mb-2">5. Procedure</h3>
                  <p className="whitespace-pre-wrap text-muted-foreground">{policy.custom_procedures || policy.procedures}</p>
                </div>
              </>
            )}

            {policy.compliance_requirements && (
              <>
                <Separator />
                <div>
                  <h3 className="text-lg font-semibold mb-2">6. Requisiti di Conformità</h3>
                  <p className="whitespace-pre-wrap text-muted-foreground">{policy.compliance_requirements}</p>
                </div>
              </>
            )}

            {policy.custom_exceptions && (
              <>
                <Separator />
                <div>
                  <h3 className="text-lg font-semibold mb-2">7. Eccezioni</h3>
                  <p className="whitespace-pre-wrap text-muted-foreground">{policy.custom_exceptions}</p>
                </div>
              </>
            )}

            {policy.custom_notes && (
              <>
                <Separator />
                <div>
                  <h3 className="text-lg font-semibold mb-2">8. Note Aggiuntive</h3>
                  <p className="whitespace-pre-wrap text-muted-foreground">{policy.custom_notes}</p>
                </div>
              </>
            )}

            {policy.review_requirements && (
              <>
                <Separator />
                <div>
                  <h3 className="text-lg font-semibold mb-2">9. Revisione della Policy</h3>
                  <p className="whitespace-pre-wrap text-muted-foreground">{policy.review_requirements}</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Metadata */}
        {(policy.approved_by || policy.approval_date || policy.next_review_date) && (
          <Card>
            <CardHeader>
              <CardTitle>Document Control</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-3 gap-4 text-sm">
              {policy.approved_by && (
                <div>
                  <p className="text-muted-foreground">Approved By</p>
                  <p className="font-medium">{policy.approved_by}</p>
                </div>
              )}
              {policy.approval_date && (
                <div>
                  <p className="text-muted-foreground">Approval Date</p>
                  <p className="font-medium">{new Date(policy.approval_date).toLocaleDateString()}</p>
                </div>
              )}
              {policy.next_review_date && (
                <div>
                  <p className="text-muted-foreground">Next Review</p>
                  <p className="font-medium">{new Date(policy.next_review_date).toLocaleDateString()}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
