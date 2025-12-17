import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Plus, Eye, Edit, CheckCircle, Home, ClipboardList, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { PermissionGuard } from '@/components/PermissionGuard';
import { ProcedureTemplateSelector } from '@/components/ProcedureTemplateSelector';

export default function ProcedureManagementPage() {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState<any[]>([]);
  const [procedures, setProcedures] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [orgId, setOrgId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      console.log('📋 Loading procedure templates and procedures...');

      // DEMO mode: always get first organization
      console.log('📥 Loading organization...');
      const { data: orgs, error: orgError } = await supabase
        .from('organization')
        .select('id, name')
        .limit(1)
        .maybeSingle();
      
      if (orgError) {
        console.error('❌ Organization query error:', orgError);
      }
      
      if (!orgs) {
        console.log('⚠️ No organization found');
        toast.error('Nessuna organizzazione disponibile');
        setLoading(false);
        return;
      }
      
      const orgId = orgs.id;
      console.log('✅ Using organization:', orgId);
      setOrgId(orgId);

      if (orgId) {

        const [templatesRes, proceduresRes] = await Promise.all([
          supabase
            .from('procedure_templates')
            .select('*')
            .eq('is_active', true)
            .order('order_index'),
          supabase
            .from('procedures')
            .select('*')
            .eq('organization_id', orgId)
            .order('procedure_id')
        ]);

        console.log('✅ Templates loaded:', templatesRes.data?.length);
        console.log('✅ Procedures loaded:', proceduresRes.data?.length);

        setTemplates(templatesRes.data || []);
        setProcedures(proceduresRes.data || []);
      }
    } catch (error) {
      console.error('❌ Error loading:', error);
      toast.error('Errore caricamento dati');
    } finally {
      setLoading(false);
    }
  };

  const createFromTemplate = async (template: any) => {
    try {
      console.log('🔄 Creating procedure from template:', template.name);

      if (!orgId) {
        toast.error('Organizzazione non trovata');
        return;
      }

      // Check if already exists
      const existing = procedures.find(p => p.title === template.name);
      if (existing) {
        toast.error('Procedura già esistente');
        return;
      }

      // Get organization name for template replacement
      const { data: org } = await supabase
        .from('organization')
        .select('name')
        .eq('id', orgId)
        .single();

      const orgName = org?.name || 'Organization';

      const { data, error } = await supabase
        .from('procedures')
        .insert({
          organization_id: orgId,
          title: template.name,
          category: template.category,
          iso_reference: template.iso_reference,
          purpose: template.purpose_template?.replace(/{{organization_name}}/g, orgName) || '',
          scope: template.scope_template?.replace(/{{organization_name}}/g, orgName) || '',
          responsibilities: template.responsibilities_template || '',
          procedure_steps: template.steps_template || '',
          records: template.records_template || '',
          status: 'draft',
          version: '1.0'
        })
        .select()
        .single();

      if (error) throw error;

      console.log('✅ Procedure created:', data.procedure_id);
      toast.success('✅ Procedura creata!');
      await loadData();
      navigate(`/procedures/${data.id}/edit`);
    } catch (error: any) {
      console.error('❌ Error creating procedure:', error);
      toast.error('Errore: ' + error.message);
    }
  };

  const handleSelectProcedureTemplate = async (template: any) => {
    try {
      console.log('📋 Creating procedure from detailed template:', template.procedure_name || template.name);

      if (!orgId) {
        toast.error('Organizzazione non trovata');
        return;
      }

      // Get organization name for template replacement
      const { data: org } = await supabase
        .from('organization')
        .select('name')
        .eq('id', orgId)
        .single();

      const orgName = org?.name || 'Organization';

      const { data, error } = await supabase
        .from('procedures')
        .insert({
          organization_id: orgId,
          title: template.procedure_name || template.name,
          category: template.category === 'mandatory' ? 'mandatory' : template.category,
          iso_reference: template.iso_reference,
          purpose: template.purpose_template?.replace(/{{organization_name}}/g, orgName) || '',
          scope: template.scope_template?.replace(/{{organization_name}}/g, orgName) || '',
          responsibilities: template.responsibilities_template?.replace(/{{organization_name}}/g, orgName) || '',
          procedure_steps: template.steps_template?.replace(/{{organization_name}}/g, orgName) || '',
          status: 'draft',
          version: '1.0'
        })
        .select()
        .single();

      if (error) throw error;

      console.log('✅ Procedure created from template:', data.procedure_id);
      toast.success('✅ Procedura creata da template!');
      await loadData();
      navigate(`/procedures/${data.id}/edit`);
    } catch (error: any) {
      console.error('❌ Error creating procedure from template:', error);
      toast.error('Errore: ' + error.message);
    }
  };

  const createCustomProcedure = async () => {
    try {
      console.log('✨ Creating custom procedure...');

      if (!orgId) {
        toast.error('Organizzazione non trovata');
        return;
      }

      const { data, error } = await supabase
        .from('procedures')
        .insert({
          organization_id: orgId,
          title: 'Nuova Procedura Personalizzata',
          category: 'custom',
          purpose: 'Definire lo scopo della procedura...',
          scope: 'Definire l\'ambito di applicazione...',
          procedure_steps: 'Elencare i passaggi della procedura...',
          status: 'draft',
          version: '1.0'
        })
        .select()
        .single();

      if (error) throw error;

      console.log('✅ Custom procedure created:', data.procedure_id);
      toast.success('✅ Procedura personalizzata creata!');
      await loadData();
      navigate(`/procedures/${data.id}/edit`);
    } catch (error: any) {
      console.error('❌ Error creating custom procedure:', error);
      toast.error('Errore: ' + error.message);
    }
  };

  const mandatoryTemplates = templates.filter(t => t.category === 'mandatory');
  const recommendedTemplates = templates.filter(t => t.category === 'recommended');
  const mandatoryCount = mandatoryTemplates.length;
  const mandatoryCompleted = procedures.filter(p => 
    mandatoryTemplates.some(t => t.name === p.title) && p.status === 'approved'
  ).length;

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Caricamento procedure...</p>
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
          <span>Procedure Management</span>
        </div>

        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <ClipboardList className="h-8 w-8" />
              Procedure Management
            </h1>
            <p className="text-muted-foreground mt-1">
              Gestisci procedure operative ISO 27001:2022
            </p>
          </div>
          <div className="flex gap-2">
            <ProcedureTemplateSelector onSelectTemplate={handleSelectProcedureTemplate} />
            <PermissionGuard resource="procedures" action="create">
              <Button onClick={createCustomProcedure}>
                <Plus className="h-4 w-4 mr-2" />
                Procedura Personalizzata
              </Button>
            </PermissionGuard>
          </div>
        </div>

        {/* Progress */}
        <Card className="border-2">
          <CardHeader>
            <CardTitle>Progresso Procedure Obbligatorie</CardTitle>
            <CardDescription>
              {mandatoryCompleted} di {mandatoryCount} procedure obbligatorie approvate
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="h-4 bg-secondary rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary transition-all"
                    style={{ width: `${mandatoryCount > 0 ? (mandatoryCompleted / mandatoryCount) * 100 : 0}%` }}
                  />
                </div>
              </div>
              <Badge variant={mandatoryCompleted === mandatoryCount ? 'default' : 'secondary'}>
                {mandatoryCount > 0 ? Math.round((mandatoryCompleted / mandatoryCount) * 100) : 0}%
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="mandatory">
          <TabsList>
            <TabsTrigger value="mandatory">
              📋 Obbligatorie ({mandatoryTemplates.length})
            </TabsTrigger>
            <TabsTrigger value="recommended">
              🟦 Raccomandate ({recommendedTemplates.length})
            </TabsTrigger>
            <TabsTrigger value="my-procedures">
              📄 Le Mie Procedure ({procedures.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="mandatory" className="space-y-4">
            <div className="grid gap-4">
              {mandatoryTemplates.map((template) => {
                const existing = procedures.find(p => p.title === template.name);
                
                return (
                  <Card key={template.id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <CardTitle className="flex items-center gap-2">
                            {template.name}
                            {existing?.status === 'approved' && (
                              <CheckCircle className="h-5 w-5 text-green-500" />
                            )}
                          </CardTitle>
                          <CardDescription className="mt-2">
                            {template.purpose_template?.substring(0, 150)}...
                          </CardDescription>
                          <div className="flex gap-2 mt-3">
                            {template.iso_reference?.map((ref: string) => (
                              <Badge key={ref} variant="outline">ISO 27001:{ref}</Badge>
                            ))}
                            {template.related_policy && (
                              <Badge variant="outline" className="bg-blue-50">
                                🔗 {template.related_policy}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {existing ? (
                            <>
                              <Button size="sm" variant="outline" onClick={() => navigate(`/procedures/${existing.id}`)}>
                                <Eye className="h-4 w-4 mr-1" />
                                Vedi
                              </Button>
                              <Button size="sm" onClick={() => navigate(`/procedures/${existing.id}/edit`)}>
                                <Edit className="h-4 w-4 mr-1" />
                                Modifica
                              </Button>
                            </>
                          ) : (
                            <Button onClick={() => createFromTemplate(template)}>
                              <Plus className="h-4 w-4 mr-1" />
                              Crea da Template
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="recommended" className="space-y-4">
            <div className="grid gap-4">
              {recommendedTemplates.map((template) => {
                const existing = procedures.find(p => p.title === template.name);
                
                return (
                  <Card key={template.id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <CardTitle>{template.name}</CardTitle>
                          <CardDescription className="mt-2">
                            {template.purpose_template?.substring(0, 150)}...
                          </CardDescription>
                          <div className="flex gap-2 mt-3">
                            {template.iso_reference?.map((ref: string) => (
                              <Badge key={ref} variant="outline">ISO 27001:{ref}</Badge>
                            ))}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {existing ? (
                            <>
                              <Button size="sm" variant="outline" onClick={() => navigate(`/procedures/${existing.id}`)}>
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button size="sm" onClick={() => navigate(`/procedures/${existing.id}/edit`)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                            </>
                          ) : (
                            <Button onClick={() => createFromTemplate(template)} variant="outline">
                              <Plus className="h-4 w-4 mr-1" />
                              Crea
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="my-procedures">
            {procedures.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground mb-4">
                    Nessuna procedura creata. Inizia dai template o crea una procedura personalizzata!
                  </p>
                  <Button onClick={createCustomProcedure}>
                    <Plus className="h-4 w-4 mr-2" />
                    Crea Procedura Personalizzata
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {procedures.map((proc) => (
                  <Card key={proc.id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline">{proc.procedure_id}</Badge>
                            <Badge variant={
                              proc.status === 'approved' ? 'default' :
                              proc.status === 'review' ? 'secondary' : 'outline'
                            }>
                              {proc.status === 'approved' ? '✅ Approvata' :
                               proc.status === 'review' ? '👁️ In Revisione' : '📝 Bozza'}
                            </Badge>
                            <span className="text-sm text-muted-foreground">v{proc.version}</span>
                            {proc.category === 'custom' && (
                              <Badge variant="outline" className="bg-purple-50">
                                ✨ Personalizzata
                              </Badge>
                            )}
                          </div>
                          <CardTitle>{proc.title}</CardTitle>
                          <CardDescription className="mt-2">
                            {proc.purpose?.substring(0, 120)}...
                          </CardDescription>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => navigate(`/procedures/${proc.id}`)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => navigate(`/procedures/${proc.id}/edit`)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
