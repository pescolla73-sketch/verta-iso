import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Save, 
  FileText, 
  ArrowLeft,
  CheckCircle, 
  Clock,
  Edit3,
  Archive,
  Download
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { PolicyNavigation } from "@/components/PolicyNavigation";
import { ProfessionalPDF, type Organization, type DocumentMetadata } from "@/utils/pdfBranding";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function PolicyEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isSaving, setIsSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [policy, setPolicy] = useState<any>(null);

  useEffect(() => {
    console.log('🔍 PolicyEditor mounted, ID:', id);
    if (id && id !== 'new') {
      loadPolicy();
    } else {
      setLoading(false);
    }
  }, [id]);

  // Debug: Track all policy state changes
  useEffect(() => {
    if (policy) {
      console.log('🔄 Policy state changed:', {
        policy_name: policy.policy_name,
        purpose: policy.purpose?.substring(0, 50) + '...',
        scope: policy.scope?.substring(0, 50) + '...',
        policy_statement: policy.policy_statement?.substring(0, 50) + '...',
        allFieldsCount: Object.keys(policy).length
      });
    }
  }, [policy]);

  const loadPolicy = async () => {
    try {
      console.log('📥 Loading policy:', id);
      setLoading(true);
      
      const { data, error } = await supabase
        .from('policies')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('❌ Error loading policy:', error);
        toast.error('Errore nel caricamento della policy');
        throw error;
      }

      console.log('✅ Policy loaded:', data);
      setPolicy(data);
    } catch (error) {
      console.error('Error loading policy:', error);
      toast.error('Errore nel caricamento della policy');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!policy?.policy_name?.trim()) {
      toast.error('Inserisci un nome per la policy');
      return;
    }

    console.log('🔵 handleSave called - starting save process');
    setIsSaving(true);
    
    try {
      console.log('💾 Saving policy:', policy);

      // DEMO mode: always get first organization
      console.log('📥 Getting organization for save...');
      const { data: orgs, error: orgError } = await supabase
        .from('organizations')
        .select('id')
        .limit(1)
        .maybeSingle();
      
      if (orgError || !orgs) {
        console.error('❌ No organization found:', orgError);
        toast.error('Nessuna organizzazione trovata');
        return; // Don't navigate on error
      }
      
      const orgId = orgs.id;
      console.log('✅ Saving policy with org_id:', orgId);

      console.log('🔍 Current policy state before payload:', policy);
      console.log('🔍 policy.policy_name value:', policy.policy_name);

      const policyPayload = {
        policy_name: policy.policy_name || 'Untitled Policy',
        policy_type: policy.policy_type || 'custom',
        status: policy.status || 'draft',
        version: policy.version || '1.0',
        category: policy.category || 'custom',
        iso_reference: policy.iso_reference || [],
        nis2_reference: policy.nis2_reference || [],
        purpose: policy.purpose || '',
        scope: policy.scope || '',
        policy_statement: policy.policy_statement || '',
        roles_responsibilities: policy.roles_responsibilities || '',
        procedures: policy.procedures || '',
        compliance_requirements: policy.compliance_requirements || '',
        review_requirements: policy.review_requirements || '',
        prepared_by: policy.prepared_by || '',
        approved_by: policy.approved_by || null,
        approval_date: policy.approval_date || null,
        next_review_date: policy.next_review_date || null,
        updated_at: new Date().toISOString()
      };

      console.log('💾 Executing UPDATE with payload:', policyPayload);
      console.log('🎯 policy_name in payload:', policyPayload.policy_name);

      const { data, error } = await supabase
        .from('policies')
        .update(policyPayload)
        .eq('id', id)
        .eq('organization_id', orgId)
        .select();

      console.log('📊 UPDATE result:', { data, error, affectedRows: data?.length });

      if (error) {
        console.error('❌ UPDATE ERROR:', error);
        toast.error('Errore: ' + error.message);
        return; // Don't navigate on error
      }

      if (!data || data.length === 0) {
        console.error('❌ UPDATE returned no data - RLS might be blocking');
        toast.error('Aggiornamento bloccato dalle policy di sicurezza');
        return; // Don't navigate on error
      }

      console.log('✅ Policy updated successfully', data[0]);
      toast.success('✅ Policy salvata con successo!');
      
      // ONLY navigate after successful save
      console.log('🔙 Navigating back to /policies after successful save');
      navigate('/policies');
      
    } catch (error: any) {
      console.error('❌ Unexpected save error:', error);
      toast.error('Errore: ' + (error.message || 'Errore nel salvataggio'));
      // Don't navigate on error
    } finally {
      setIsSaving(false);
    }
  };

  const handleChange = (field: string, value: any) => {
    console.log('✏️ Updating field:', field, 'with value:', value);
    console.log('📋 Current policy state BEFORE update:', {
      policy_name: policy?.policy_name,
      purpose: policy?.purpose?.substring(0, 30),
      scope: policy?.scope?.substring(0, 30),
      fieldCount: Object.keys(policy || {}).length
    });
    
    setPolicy((prev: any) => {
      const updated = { ...prev, [field]: value };
      console.log('📝 Updated policy state AFTER update:', {
        policy_name: updated.policy_name,
        purpose: updated.purpose?.substring(0, 30),
        scope: updated.scope?.substring(0, 30),
        fieldCount: Object.keys(updated).length
      });
      return updated;
    });
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
      pdf.addText('1. PURPOSE', yPos);
      yPos += 10;
      
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'normal');
      if (policy.purpose) {
        const purposeLines = pdf.getDoc().splitTextToSize(policy.purpose, 170);
        for (let i = 0; i < purposeLines.length; i++) {
          if (yPos > 250) { 
            pdf.addPage(); 
            yPos = pdf.getContentStartY(); 
          }
          pdf.addText(purposeLines[i], yPos);
          yPos += 6;
        }
        yPos += 10;
      } else {
        pdf.addText('N/A', yPos);
        yPos += 10;
      }

      // 2. Scope
      if (yPos > 250) { pdf.addPage(); yPos = pdf.getContentStartY(); }
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.addText('2. SCOPE', yPos);
      yPos += 10;
      
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'normal');
      if (policy.scope) {
        const scopeLines = pdf.getDoc().splitTextToSize(policy.scope, 170);
        for (let i = 0; i < scopeLines.length; i++) {
          if (yPos > 250) { 
            pdf.addPage(); 
            yPos = pdf.getContentStartY(); 
          }
          pdf.addText(scopeLines[i], yPos);
          yPos += 6;
        }
        yPos += 10;
      } else {
        pdf.addText('N/A', yPos);
        yPos += 10;
      }

      // 3. Policy Statement
      if (yPos > 250) { pdf.addPage(); yPos = pdf.getContentStartY(); }
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.addText('3. POLICY STATEMENT', yPos);
      yPos += 10;
      
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'normal');
      if (policy.policy_statement) {
        const statementLines = pdf.getDoc().splitTextToSize(policy.policy_statement, 170);
        for (let i = 0; i < statementLines.length; i++) {
          if (yPos > 250) { 
            pdf.addPage(); 
            yPos = pdf.getContentStartY(); 
          }
          pdf.addText(statementLines[i], yPos);
          yPos += 6;
        }
        yPos += 10;
      } else {
        pdf.addText('N/A', yPos);
        yPos += 10;
      }

      // 4. Roles & Responsibilities
      if (policy.roles_responsibilities) {
        if (yPos > 250) { pdf.addPage(); yPos = pdf.getContentStartY(); }
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.addText('4. ROLES & RESPONSIBILITIES', yPos);
        yPos += 10;
        
        pdf.setFontSize(11);
        pdf.setFont('helvetica', 'normal');
        const rolesLines = pdf.getDoc().splitTextToSize(policy.roles_responsibilities, 170);
        for (let i = 0; i < rolesLines.length; i++) {
          if (yPos > 250) { 
            pdf.addPage(); 
            yPos = pdf.getContentStartY(); 
          }
          pdf.addText(rolesLines[i], yPos);
          yPos += 6;
        }
        yPos += 10;
      }

      // 5. Procedures
      if (policy.procedures) {
        if (yPos > 250) { pdf.addPage(); yPos = pdf.getContentStartY(); }
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.addText('5. PROCEDURES', yPos);
        yPos += 10;
        
        pdf.setFontSize(11);
        pdf.setFont('helvetica', 'normal');
        const procLines = pdf.getDoc().splitTextToSize(policy.procedures, 170);
        for (let i = 0; i < procLines.length; i++) {
          if (yPos > 250) { 
            pdf.addPage(); 
            yPos = pdf.getContentStartY(); 
          }
          pdf.addText(procLines[i], yPos);
          yPos += 6;
        }
        yPos += 10;
      }

      // 6. Compliance Requirements
      if (policy.compliance_requirements) {
        if (yPos > 250) { pdf.addPage(); yPos = pdf.getContentStartY(); }
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.addText('6. COMPLIANCE REQUIREMENTS', yPos);
        yPos += 10;
        
        pdf.setFontSize(11);
        pdf.setFont('helvetica', 'normal');
        const complianceLines = pdf.getDoc().splitTextToSize(policy.compliance_requirements, 170);
        for (let i = 0; i < complianceLines.length; i++) {
          if (yPos > 250) { 
            pdf.addPage(); 
            yPos = pdf.getContentStartY(); 
          }
          pdf.addText(complianceLines[i], yPos);
          yPos += 6;
        }
        yPos += 10;
      }

      // 7. Review Requirements
      if (yPos > 250) { pdf.addPage(); yPos = pdf.getContentStartY(); }
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.addText('7. POLICY REVIEW', yPos);
      yPos += 10;
      
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'normal');
      const reviewText = policy.review_requirements || 'This policy shall be reviewed annually.';
      const reviewLines = pdf.getDoc().splitTextToSize(reviewText, 170);
      // Render line by line with page break checks
      for (let i = 0; i < reviewLines.length; i++) {
        if (yPos > 250) { 
          pdf.addPage(); 
          yPos = pdf.getContentStartY(); 
        }
        pdf.addText(reviewLines[i], yPos);
        yPos += 6;
      }

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

  const getStatusBadge = () => {
    const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline'; icon: any }> = {
      draft: { label: 'Bozza', variant: 'secondary', icon: Edit3 },
      review: { label: 'In Revisione', variant: 'default', icon: Clock },
      approved: { label: 'Approvata', variant: 'default', icon: CheckCircle },
      archived: { label: 'Archiviata', variant: 'outline', icon: Archive }
    };

    const config = statusConfig[policy?.status] || statusConfig.draft;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Caricamento policy...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!policy) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <p className="text-lg mb-4">❌ Policy non trovata</p>
            <Button onClick={() => navigate('/policies')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Torna alle Policy
            </Button>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <PolicyNavigation currentPage={policy.policy_name || 'Modifica Policy'} />
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                console.log('🔙 Going back to policies');
                navigate('/policies');
              }}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Indietro
            </Button>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <FileText className="h-6 w-6" />
                {policy.policy_name}
              </h1>
              <p className="text-sm text-muted-foreground">
                {policy.policy_id || 'POL-XXX'} • Versione {policy.version}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {getStatusBadge()}
            <Button variant="outline" size="sm" onClick={exportPDF}>
              <Download className="h-4 w-4 mr-2" />
              Esporta PDF
            </Button>
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
            </div>
            <Button variant="outline" onClick={() => navigate('/policies')}>
              Annulla
            </Button>
          </CardContent>
        </Card>

        {/* Editor Form */}
        <Card>
          <CardHeader>
            <CardTitle>Modifica Policy</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="policy_name">Titolo Policy *</Label>
              <Input
                id="policy_name"
                value={policy.policy_name || ''}
                onChange={(e) => handleChange('policy_name', e.target.value)}
                placeholder="es. Information Security Policy"
              />
            </div>

            {/* Status & Version */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select 
                  value={policy.status || 'draft'}
                  onValueChange={(value) => handleChange('status', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">📝 Bozza</SelectItem>
                    <SelectItem value="review">👁️ In Revisione</SelectItem>
                    <SelectItem value="approved">✅ Approvata</SelectItem>
                    <SelectItem value="archived">📦 Archiviata</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Versione</Label>
                <Input
                  value={policy.version || '1.0'}
                  onChange={(e) => handleChange('version', e.target.value)}
                />
              </div>
            </div>

            <Separator />

            {/* Purpose */}
            <div className="space-y-2">
              <Label>1. Purpose (Scopo) *</Label>
              <Textarea
                value={policy.purpose || ''}
                onChange={(e) => handleChange('purpose', e.target.value)}
                placeholder="Definisci lo scopo di questa policy..."
                rows={4}
              />
            </div>

            {/* Scope */}
            <div className="space-y-2">
              <Label>2. Scope (Ambito) *</Label>
              <Textarea
                value={policy.scope || ''}
                onChange={(e) => handleChange('scope', e.target.value)}
                placeholder="A chi si applica questa policy..."
                rows={3}
              />
            </div>

            {/* Policy Statement */}
            <div className="space-y-2">
              <Label>3. Policy Statement (Dichiarazione) *</Label>
              <Textarea
                value={policy.policy_statement || ''}
                onChange={(e) => handleChange('policy_statement', e.target.value)}
                placeholder="I principi e requisiti della policy..."
                rows={6}
              />
            </div>

            {/* Roles */}
            <div className="space-y-2">
              <Label>4. Roles & Responsibilities</Label>
              <Textarea
                value={policy.roles_responsibilities || ''}
                onChange={(e) => handleChange('roles_responsibilities', e.target.value)}
                placeholder="Chi è responsabile di cosa..."
                rows={4}
              />
            </div>

            {/* Procedures */}
            <div className="space-y-2">
              <Label>5. Procedures (Procedure Correlate)</Label>
              <Textarea
                value={policy.procedures || ''}
                onChange={(e) => handleChange('procedures', e.target.value)}
                placeholder="Procedure operative collegate..."
                rows={3}
              />
            </div>

            {/* Compliance */}
            <div className="space-y-2">
              <Label>6. Compliance Requirements</Label>
              <Textarea
                value={policy.compliance_requirements || ''}
                onChange={(e) => handleChange('compliance_requirements', e.target.value)}
                placeholder="Requisiti legali, normativi, contrattuali..."
                rows={3}
              />
            </div>

            {/* Review */}
            <div className="space-y-2">
              <Label>7. Policy Review</Label>
              <Textarea
                value={policy.review_requirements || ''}
                onChange={(e) => handleChange('review_requirements', e.target.value)}
                placeholder="Frequenza e processo di revisione..."
                rows={2}
              />
            </div>

            <Separator />

            {/* Approval Info */}
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Prepared By</Label>
                <Input
                  value={policy.prepared_by || ''}
                  onChange={(e) => handleChange('prepared_by', e.target.value)}
                  placeholder="Nome"
                />
              </div>
              <div className="space-y-2">
                <Label>Approved By</Label>
                <Input
                  value={policy.approved_by || ''}
                  onChange={(e) => handleChange('approved_by', e.target.value)}
                  placeholder="Nome"
                />
              </div>
              <div className="space-y-2">
                <Label>Approval Date</Label>
                <Input
                  type="date"
                  value={policy.approval_date || ''}
                  onChange={(e) => handleChange('approval_date', e.target.value)}
                />
              </div>
            </div>

            {/* Next Review */}
            <div className="space-y-2">
              <Label>Next Review Date</Label>
              <Input
                type="date"
                value={policy.next_review_date || ''}
                onChange={(e) => handleChange('next_review_date', e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Save Button Bottom */}
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => navigate('/policies')}>
            Annulla
          </Button>
          <Button onClick={handleSave} disabled={isSaving} size="lg">
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? 'Salvataggio...' : 'Salva Policy'}
          </Button>
        </div>
      </div>
    </AppLayout>
  );
}
