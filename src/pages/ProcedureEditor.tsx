import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Save, Home, ClipboardList, Download } from 'lucide-react';
import { toast } from 'sonner';
import { ProfessionalPDF } from '@/utils/pdfBranding';
import type { Organization, DocumentMetadata } from '@/utils/pdfBranding';

export default function ProcedureEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [procedure, setProcedure] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    console.log('🔍 ProcedureEditor mounted, ID:', id);
    if (id && id !== 'new') {
      loadProcedure();
    } else {
      setLoading(false);
    }
  }, [id]);

  const loadProcedure = async () => {
    try {
      console.log('📥 Loading procedure:', id);
      setLoading(true);

      const { data, error } = await supabase
        .from('procedures')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('❌ Error loading procedure:', error);
        toast.error('Errore caricamento procedura');
        throw error;
      }

      console.log('✅ Procedure loaded:', data);
      setProcedure(data);
    } catch (error) {
      console.error('Error loading procedure:', error);
      toast.error('Errore nel caricamento della procedura');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!procedure?.title?.trim()) {
      toast.error('Inserisci un titolo per la procedura');
      return;
    }

    setSaving(true);
    try {
      console.log('💾 Saving procedure:', procedure);

      const { error } = await supabase
        .from('procedures')
        .update({
          title: procedure.title,
          category: procedure.category,
          iso_reference: procedure.iso_reference,
          purpose: procedure.purpose,
          scope: procedure.scope,
          responsibilities: procedure.responsibilities,
          procedure_steps: procedure.procedure_steps,
          records: procedure.records,
          status: procedure.status,
          version: procedure.version,
          prepared_by: procedure.prepared_by,
          approved_by: procedure.approved_by,
          approval_date: procedure.approval_date,
          next_review_date: procedure.next_review_date,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;

      console.log('✅ Procedure saved');
      toast.success('✅ Procedura salvata!');
    } catch (error: any) {
      console.error('❌ Save error:', error);
      toast.error('Errore nel salvataggio');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field: string, value: any) => {
    console.log('✏️ Updating field:', field);
    setProcedure((prev: any) => ({ ...prev, [field]: value }));
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
        documentType: 'Procedura - ' + (procedure.title || 'Untitled'),
        documentId: procedure.procedure_id || 'PROC-XXX',
        version: procedure.version || '1.0',
        issueDate: procedure.approval_date || new Date().toISOString().split('T')[0],
        revisionDate: new Date().toISOString().split('T')[0],
        nextReviewDate: procedure.next_review_date || '',
        status: (procedure.status === 'approved' ? 'approved' : procedure.status === 'review' ? 'in_review' : 'draft') as 'draft' | 'approved' | 'in_review',
        classification: 'confidential',
        preparedBy: procedure.prepared_by || '',
        approvedBy: procedure.approved_by || '',
        approvalDate: procedure.approval_date || undefined,
      };

      const pdf = new ProfessionalPDF(organization, metadata);
      
      // Start content on a new page (cover page is page 1)
      pdf.addPage();
      let yPos = pdf.getContentStartY();

      // 1. PURPOSE
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.addText('1. PURPOSE', yPos);
      yPos += 10;
      
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'normal');
      const purposeLines = pdf.getDoc().splitTextToSize(procedure.purpose || 'N/A', 170);
      pdf.addText(purposeLines, yPos);
      yPos += purposeLines.length * 6 + 10;

      // 2. SCOPE
      if (yPos > 250) { pdf.addPage(); yPos = pdf.getContentStartY(); }
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.addText('2. SCOPE', yPos);
      yPos += 10;
      
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'normal');
      const scopeLines = pdf.getDoc().splitTextToSize(procedure.scope || 'N/A', 170);
      pdf.addText(scopeLines, yPos);
      yPos += scopeLines.length * 6 + 10;

      // 3. RESPONSIBILITIES
      if (procedure.responsibilities) {
        if (yPos > 250) { pdf.addPage(); yPos = pdf.getContentStartY(); }
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.addText('3. RESPONSIBILITIES', yPos);
        yPos += 10;
        
        pdf.setFontSize(11);
        pdf.setFont('helvetica', 'normal');
        const respLines = pdf.getDoc().splitTextToSize(procedure.responsibilities, 170);
        pdf.addText(respLines, yPos);
        yPos += respLines.length * 6 + 10;
      }

      // 4. PROCEDURE STEPS
      if (yPos > 250) { pdf.addPage(); yPos = pdf.getContentStartY(); }
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      const stepsNum = procedure.responsibilities ? '4' : '3';
      pdf.addText(`${stepsNum}. PROCEDURE STEPS`, yPos);
      yPos += 10;
      
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'normal');
      const stepsLines = pdf.getDoc().splitTextToSize(procedure.procedure_steps || 'N/A', 170);
      pdf.addText(stepsLines, yPos);
      yPos += stepsLines.length * 6 + 10;

      // 5. RECORDS
      if (procedure.records) {
        if (yPos > 250) { pdf.addPage(); yPos = pdf.getContentStartY(); }
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        const recordsNum = procedure.responsibilities ? '5' : '4';
        pdf.addText(`${recordsNum}. RECORDS`, yPos);
        yPos += 10;
        
        pdf.setFontSize(11);
        pdf.setFont('helvetica', 'normal');
        const recordsLines = pdf.getDoc().splitTextToSize(procedure.records, 170);
        pdf.addText(recordsLines, yPos);
      }

      // Finalize and save
      const filename = `${procedure.procedure_id}_${procedure.title.replace(/\s+/g, '_')}_v${procedure.version}.pdf`;
      await pdf.finalize(filename);

      console.log('✅ PDF exported successfully');
      toast.success('📄 PDF esportato con successo!');
    } catch (error) {
      console.error('❌ Export error:', error);
      toast.error('Errore durante l\'esportazione del PDF');
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Caricamento procedura...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!procedure) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <p className="text-lg mb-4">❌ Procedura non trovata</p>
            <Button onClick={() => navigate('/procedures')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Torna alle Procedure
            </Button>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Navigation */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
            <Home className="h-4 w-4 mr-1" />
            Dashboard
          </Button>
          <span>/</span>
          <Button variant="ghost" size="sm" onClick={() => navigate('/procedures')}>
            Procedure
          </Button>
          <span>/</span>
          <span>{procedure.title}</span>
        </div>

        {/* Header */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                console.log('🔙 Going back to procedures');
                navigate('/procedures');
              }}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Indietro
            </Button>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <ClipboardList className="h-6 w-6" />
                {procedure.title}
              </h1>
              <p className="text-sm text-muted-foreground">
                {procedure.procedure_id} • Versione {procedure.version}
              </p>
            </div>
          </div>
        </div>

        {/* Actions Bar */}
        <Card>
          <CardContent className="flex items-center justify-between p-4">
            <div className="flex gap-2">
              <Button onClick={handleSave} disabled={saving}>
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Salvataggio...' : 'Salva'}
              </Button>
              <Button variant="outline" onClick={exportPDF}>
                <Download className="h-4 w-4 mr-2" />
                Esporta PDF
              </Button>
            </div>
            <Button variant="outline" onClick={() => navigate('/procedures')}>
              Annulla
            </Button>
          </CardContent>
        </Card>

        {/* Editor Form */}
        <Card>
          <CardHeader>
            <CardTitle>Modifica Procedura</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Titolo Procedura *</Label>
              <Input
                id="title"
                value={procedure.title || ''}
                onChange={(e) => handleChange('title', e.target.value)}
                placeholder="es. Risk Assessment Procedure"
              />
            </div>

            {/* Status & Version */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select 
                  value={procedure.status || 'draft'}
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
                  value={procedure.version || '1.0'}
                  onChange={(e) => handleChange('version', e.target.value)}
                />
              </div>
            </div>

            <Separator />

            {/* Purpose */}
            <div className="space-y-2">
              <Label>1. Purpose (Scopo) *</Label>
              <Textarea
                value={procedure.purpose || ''}
                onChange={(e) => handleChange('purpose', e.target.value)}
                placeholder="Definisci lo scopo di questa procedura..."
                rows={3}
              />
            </div>

            {/* Scope */}
            <div className="space-y-2">
              <Label>2. Scope (Ambito) *</Label>
              <Textarea
                value={procedure.scope || ''}
                onChange={(e) => handleChange('scope', e.target.value)}
                placeholder="A cosa/chi si applica questa procedura..."
                rows={2}
              />
            </div>

            {/* Responsibilities */}
            <div className="space-y-2">
              <Label>3. Responsibilities (Responsabilità)</Label>
              <Textarea
                value={procedure.responsibilities || ''}
                onChange={(e) => handleChange('responsibilities', e.target.value)}
                placeholder="Chi è responsabile di cosa..."
                rows={4}
              />
            </div>

            {/* Procedure Steps */}
            <div className="space-y-2">
              <Label>4. Procedure Steps (Passi Operativi) *</Label>
              <Textarea
                value={procedure.procedure_steps || ''}
                onChange={(e) => handleChange('procedure_steps', e.target.value)}
                placeholder="1. Step one...
2. Step two...
3. Step three...
etc."
                rows={12}
              />
            </div>

            {/* Records */}
            <div className="space-y-2">
              <Label>5. Records (Registrazioni)</Label>
              <Textarea
                value={procedure.records || ''}
                onChange={(e) => handleChange('records', e.target.value)}
                placeholder="Quali registrazioni devono essere mantenute..."
                rows={3}
              />
            </div>

            <Separator />

            {/* Approval Info */}
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Prepared By</Label>
                <Input
                  value={procedure.prepared_by || ''}
                  onChange={(e) => handleChange('prepared_by', e.target.value)}
                  placeholder="Nome"
                />
              </div>
              <div className="space-y-2">
                <Label>Approved By</Label>
                <Input
                  value={procedure.approved_by || ''}
                  onChange={(e) => handleChange('approved_by', e.target.value)}
                  placeholder="Nome"
                />
              </div>
              <div className="space-y-2">
                <Label>Approval Date</Label>
                <Input
                  type="date"
                  value={procedure.approval_date || ''}
                  onChange={(e) => handleChange('approval_date', e.target.value)}
                />
              </div>
            </div>

            {/* Next Review */}
            <div className="space-y-2">
              <Label>Next Review Date</Label>
              <Input
                type="date"
                value={procedure.next_review_date || ''}
                onChange={(e) => handleChange('next_review_date', e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Save Button Bottom */}
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => navigate('/procedures')}>
            Annulla
          </Button>
          <Button onClick={handleSave} disabled={saving} size="lg">
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Salvataggio...' : 'Salva Procedura'}
          </Button>
        </div>
      </div>
    </AppLayout>
  );
}
