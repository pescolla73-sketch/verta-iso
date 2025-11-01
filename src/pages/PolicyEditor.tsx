import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Save, 
  FileText, 
  Download, 
  Eye, 
  Edit3, 
  CheckCircle, 
  Clock,
  Send,
  Archive,
  FileDown
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { PolicyTemplate, PolicySection } from "@/data/policyTemplates";
import jsPDF from "jspdf";
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from "docx";
import { ProfessionalPDF, Organization, DocumentMetadata, calculateNextReviewDate } from "@/utils/pdfBranding";
interface PolicyData {
  id?: string;
  policy_name: string;
  policy_type: string;
  content: string;
  sections: PolicySection[];
  status: string;
  version: string;
  template_id?: string;
  iso_reference?: string[];
  nis2_reference?: string[];
  category?: string;
  approved_by?: string;
  approval_date?: string;
  next_review_date?: string;
}

export default function PolicyEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');
  const [isSaving, setIsSaving] = useState(false);
  const [organizationData, setOrganizationData] = useState<any>(null);

  const [policyData, setPolicyData] = useState<PolicyData>({
    policy_name: '',
    policy_type: '',
    content: '',
    sections: [],
    status: 'draft',
    version: '1.0',
    category: 'custom'
  });

  useEffect(() => {
    loadOrganizationData();
    if (id && id !== 'new') {
      loadPolicy();
    }
  }, [id]);

  const loadOrganizationData = async () => {
    try {
      const { data, error } = await supabase
        .from('organization')
        .select('*')
        .limit(1)
        .single();

      if (error) throw error;
      setOrganizationData(data);
    } catch (error) {
      console.error('Error loading organization:', error);
    }
  };

  const loadPolicy = async () => {
    try {
      const { data, error } = await supabase
        .from('policies')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      setPolicyData({
        ...data,
        sections: (data.sections as unknown as PolicySection[]) || []
      });
    } catch (error) {
      console.error('Error loading policy:', error);
      toast.error('Errore nel caricamento della policy');
    }
  };

  const replacePlaceholders = (text: string): string => {
    if (!organizationData) return text;

    const replacements: Record<string, string> = {
      '{{organization_name}}': organizationData.name || '[NOME ORGANIZZAZIONE]',
      '{{ciso_name}}': organizationData.ciso || '[CISO]',
      '{{iso_manager_name}}': organizationData.ciso || '[ISO MANAGER]',
      '{{it_manager}}': organizationData.it_manager || '[IT MANAGER]',
      '{{dpo_name}}': organizationData.dpo || '[DPO]',
      '{{incident_email}}': organizationData.contact_email || '[EMAIL INCIDENTI]',
      '{{incident_phone}}': organizationData.contact_phone || '[TELEFONO INCIDENTI]',
      '{{incident_manager}}': organizationData.incident_response_manager || '[INCIDENT MANAGER]',
      '{{legal_counsel}}': '[CONSULENTE LEGALE]',
      '{{comm_manager}}': organizationData.communication_manager || '[COMMUNICATION MANAGER]',
      '{{review_owner}}': organizationData.ciso || '[RESPONSABILE REVISIONE]',
      '{{key_manager}}': organizationData.system_administrator || '[KEY MANAGER]',
      '{{csirt_contact}}': '[CSIRT NAZIONALE]',
      '{{rto_hours}}': '24',
      '{{rpo_hours}}': '4',
      '{{mbco_percentage}}': '80'
    };

    let result = text;
    Object.entries(replacements).forEach(([placeholder, value]) => {
      result = result.replace(new RegExp(placeholder, 'g'), value);
    });

    return result;
  };

  const handleSave = async () => {
    if (!policyData.policy_name.trim()) {
      toast.error('Inserisci un nome per la policy');
      return;
    }

    setIsSaving(true);
    try {
      // Generate full content from sections
      const fullContent = policyData.sections
        .map(section => `${section.title}\n\n${replacePlaceholders(section.content)}`)
        .join('\n\n---\n\n');

      const policyPayload = {
        policy_name: policyData.policy_name,
        policy_type: policyData.policy_type || 'custom',
        content: fullContent,
        sections: policyData.sections as any, // Cast to Json type for Supabase
        status: policyData.status,
        version: policyData.version,
        template_id: policyData.template_id,
        iso_reference: policyData.iso_reference,
        nis2_reference: policyData.nis2_reference,
        category: policyData.category,
        updated_at: new Date().toISOString()
      };

      if (id) {
        // Update existing
        const { error } = await supabase
          .from('policies')
          .update(policyPayload)
          .eq('id', id);

        if (error) throw error;
        toast.success('Policy aggiornata!');
      } else {
        // Create new
        const { error } = await supabase
          .from('policies')
          .insert([policyPayload]);

        if (error) throw error;
        toast.success('Policy creata!');
        navigate('/policies');
      }
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Errore nel salvataggio');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateStatus = async (newStatus: string) => {
    if (!id) {
      toast.error('Salva prima la policy');
      return;
    }

    try {
      const updates: any = {
        status: newStatus,
        updated_at: new Date().toISOString()
      };

      if (newStatus === 'approved') {
        updates.approval_date = new Date().toISOString().split('T')[0];
        updates.approved_by = organizationData?.ciso || 'Unknown';
        // Set next review date to 1 year from now
        const nextReview = new Date();
        nextReview.setFullYear(nextReview.getFullYear() + 1);
        updates.next_review_date = nextReview.toISOString().split('T')[0];
      }

      const { error } = await supabase
        .from('policies')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      setPolicyData(prev => ({ ...prev, ...updates }));
      toast.success(`Policy ${newStatus === 'approved' ? 'approvata' : 'aggiornata'}!`);
    } catch (error) {
      console.error('Status update error:', error);
      toast.error('Errore aggiornamento status');
    }
  };

  const handleSectionUpdate = (index: number, field: 'title' | 'content', value: string) => {
    const updatedSections = [...policyData.sections];
    updatedSections[index] = {
      ...updatedSections[index],
      [field]: value
    };
    setPolicyData(prev => ({ ...prev, sections: updatedSections }));
  };

  const exportToPDF = async () => {
    try {
      if (!organizationData) {
        toast.error('Dati organizzazione non disponibili');
        return;
      }

      const today = new Date().toISOString().split('T')[0];

      // Create organization and metadata objects
      const orgData: Organization = {
        name: organizationData.name,
        piva: organizationData.piva,
        sector: organizationData.sector,
        scope: organizationData.scope,
        isms_scope: organizationData.isms_scope,
        website: organizationData.website,
        contact_phone: organizationData.contact_phone,
        contact_email: organizationData.contact_email,
        legal_address_street: organizationData.legal_address_street,
        legal_address_city: organizationData.legal_address_city,
        legal_address_zip: organizationData.legal_address_zip,
        legal_address_province: organizationData.legal_address_province,
        legal_address_country: organizationData.legal_address_country,
        ciso: organizationData.ciso,
        ceo: organizationData.ceo
      };

      const metadataObj: DocumentMetadata = {
        documentType: policyData.policy_name,
        documentId: policyData.id || 'POL-XXX',
        version: policyData.version,
        issueDate: today,
        revisionDate: policyData.approval_date || today,
        nextReviewDate: policyData.next_review_date || calculateNextReviewDate(today),
        status: (policyData.status as any) || 'draft',
        classification: 'confidential',
        preparedBy: organizationData.ciso || 'N/A',
        approvedBy: policyData.approved_by || 'N/A',
        approvalDate: policyData.approval_date
      };

      // Use ProfessionalPDF class for consistent formatting
      const pdf = new ProfessionalPDF(orgData, metadataObj);
      const doc = pdf.getDoc(); // Get the internal jsPDF instance

      // Add content sections
      let yPos = pdf.getContentStartY();
      const margin = pdf.getMargin();

      policyData.sections.forEach((section, index) => {
        if (yPos > 250) { 
          pdf.addPage(); 
          yPos = pdf.getContentStartY(); 
        }

        // Section title
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text(section.title, margin, yPos);
        yPos += 10;
        
        // Section content
        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        const contentLines = doc.splitTextToSize(replacePlaceholders(section.content), 170);
        doc.text(contentLines, margin, yPos);
        yPos += contentLines.length * 6 + 10;
      });

      // Finalize (adds headers/footers to all pages)
      await pdf.finalize(`${policyData.policy_name.replace(/\s+/g, '_')}_v${policyData.version}.pdf`);

      toast.success('📄 PDF esportato con successo!');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Errore durante l\'export PDF');
    }
  };

  const exportToWord = async () => {
    const doc = new Document({
      sections: [{
        properties: {},
        children: [
          new Paragraph({
            text: policyData.policy_name,
            heading: HeadingLevel.HEADING_1,
          }),
          new Paragraph({
            children: [
              new TextRun({ text: `Version: ${policyData.version} | Status: ${policyData.status}`, size: 20 })
            ]
          }),
          ...policyData.sections.flatMap(section => [
            new Paragraph({ text: '' }), // spacing
            new Paragraph({
              text: section.title,
              heading: HeadingLevel.HEADING_2,
            }),
            new Paragraph({
              text: replacePlaceholders(section.content),
            })
          ])
        ]
      }]
    });

    const blob = await Packer.toBlob(doc);
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${policyData.policy_name.replace(/\s+/g, '_')}.docx`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success('Word esportato!');
  };

  const getStatusBadge = () => {
    const statusConfig = {
      draft: { label: 'Bozza', variant: 'secondary' as const, icon: Edit3 },
      in_review: { label: 'In Revisione', variant: 'default' as const, icon: Clock },
      approved: { label: 'Approvata', variant: 'default' as const, icon: CheckCircle },
      archived: { label: 'Archiviata', variant: 'outline' as const, icon: Archive }
    };

    const config = statusConfig[policyData.status as keyof typeof statusConfig] || statusConfig.draft;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <FileText className="h-8 w-8" />
              {id ? 'Modifica Policy' : 'Nuova Policy'}
            </h1>
            <p className="text-muted-foreground mt-1">
              {id ? 'Modifica e gestisci la policy' : 'Crea una nuova policy di sicurezza'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {getStatusBadge()}
          </div>
        </div>

        {/* Actions Bar */}
        <Card>
          <CardContent className="flex items-center justify-between p-4">
            <div className="flex items-center gap-2">
              <Button onClick={handleSave} disabled={isSaving}>
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? 'Salvataggio...' : 'Salva'}
              </Button>

              {id && policyData.status === 'draft' && (
                <Button variant="outline" onClick={() => handleUpdateStatus('in_review')}>
                  <Send className="h-4 w-4 mr-2" />
                  Invia in Revisione
                </Button>
              )}

              {id && policyData.status === 'in_review' && (
                <Button variant="default" onClick={() => handleUpdateStatus('approved')}>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Approva Policy
                </Button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={exportToPDF}>
                <FileDown className="h-4 w-4 mr-2" />
                PDF
              </Button>
              <Button variant="outline" size="sm" onClick={exportToWord}>
                <FileDown className="h-4 w-4 mr-2" />
                Word
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Editor */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="policy_name">Nome Policy</Label>
                <Input
                  id="policy_name"
                  value={policyData.policy_name}
                  onChange={(e) => setPolicyData(prev => ({ ...prev, policy_name: e.target.value }))}
                  placeholder="Es: Information Security Policy"
                  className="max-w-xl"
                />
              </div>
              <div className="flex items-center gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Versione</Label>
                  <Input
                    value={policyData.version}
                    onChange={(e) => setPolicyData(prev => ({ ...prev, version: e.target.value }))}
                    className="w-20"
                  />
                </div>
              </div>
            </div>
          </CardHeader>

          <Separator />

          <CardContent className="pt-6">
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
              <TabsList className="grid w-full grid-cols-2 max-w-md">
                <TabsTrigger value="edit" className="flex items-center gap-2">
                  <Edit3 className="h-4 w-4" />
                  Modifica
                </TabsTrigger>
                <TabsTrigger value="preview" className="flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  Anteprima
                </TabsTrigger>
              </TabsList>

              <TabsContent value="edit" className="space-y-6 mt-6">
                {policyData.sections.map((section, index) => (
                  <Card key={index} className="border-l-4 border-l-primary">
                    <CardHeader>
                      <Input
                        value={section.title}
                        onChange={(e) => handleSectionUpdate(index, 'title', e.target.value)}
                        className="font-semibold text-lg"
                      />
                    </CardHeader>
                    <CardContent>
                      <Textarea
                        value={section.content}
                        onChange={(e) => handleSectionUpdate(index, 'content', e.target.value)}
                        rows={10}
                        className="font-mono text-sm"
                      />
                      {section.placeholders.length > 0 && (
                        <div className="mt-2">
                          <Label className="text-xs text-muted-foreground">
                            Placeholder disponibili:
                          </Label>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {section.placeholders.map(ph => (
                              <Badge key={ph} variant="outline" className="text-xs">
                                {ph}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>

              <TabsContent value="preview" className="mt-6">
                <div className="prose prose-sm max-w-none bg-background p-8 rounded-lg border">
                  <h1>{policyData.policy_name}</h1>
                  <div className="flex gap-2 mb-6">
                    <Badge>Version {policyData.version}</Badge>
                    {policyData.iso_reference?.map(ref => (
                      <Badge key={ref} variant="outline">ISO 27001:{ref}</Badge>
                    ))}
                  </div>

                  {policyData.sections.map((section, index) => (
                    <div key={index} className="mb-6">
                      <h2>{section.title}</h2>
                      <div className="whitespace-pre-wrap">
                        {replacePlaceholders(section.content)}
                      </div>
                    </div>
                  ))}

                  <Separator className="my-8" />

                  <div className="text-sm text-muted-foreground">
                    <p><strong>Controllo Documento:</strong></p>
                    <p>Versione: {policyData.version}</p>
                    {policyData.approved_by && <p>Approvato da: {policyData.approved_by}</p>}
                    {policyData.approval_date && <p>Data approvazione: {new Date(policyData.approval_date).toLocaleDateString('it-IT')}</p>}
                    {policyData.next_review_date && <p>Prossima revisione: {new Date(policyData.next_review_date).toLocaleDateString('it-IT')}</p>}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
