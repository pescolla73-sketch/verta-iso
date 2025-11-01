import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Plus, Edit, CheckCircle, Home, Loader2, Eye, Download } from 'lucide-react';
import { toast } from 'sonner';
import { AppLayout } from '@/components/layout/AppLayout';
import { useNavigate } from 'react-router-dom';
import { PolicyNavigation } from '@/components/PolicyNavigation';

export default function PolicyManagementPage() {
  const [templates, setTemplates] = useState<any[]>([]);
  const [policies, setPolicies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [organization, setOrganization] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Load organization
      const { data: orgData } = await supabase
        .from('organization')
        .select('*')
        .single();

      setOrganization(orgData);

      // Load templates
      const { data: templatesData } = await supabase
        .from('policy_templates')
        .select('*')
        .eq('is_active', true)
        .order('order_index');

      // Load existing policies
      const { data: policiesData } = await supabase
        .from('policies')
        .select('*')
        .order('policy_id');

      setTemplates(templatesData || []);
      setPolicies(policiesData || []);
    } catch (error) {
      console.error('Error loading:', error);
      toast.error('Errore caricamento');
    } finally {
      setLoading(false);
    }
  };

  const createFromTemplate = async (template: any) => {
    console.log('🔍 [1] Creating policy from template:', template.name);
    setCreating(true);
    
    try {
      if (!organization) {
        console.error('❌ No organization');
        toast.error('Nessuna organizzazione selezionata');
        return;
      }
      console.log('🔍 [2] Organization:', organization.id);

      // Check if already exists
      const existing = policies.find(p => p.policy_name === template.name);
      if (existing) {
        console.log('⚠️ Policy already exists');
        toast.error('Policy già esistente');
        return;
      }

      // Prepare policy data - use 'custom' as fallback for policy_type
      const policyData = {
        organization_id: organization.id,
        policy_name: template.name,
        policy_type: 'custom', // Use 'custom' instead of category
        category: template.category,
        iso_reference: template.iso_reference,
        nis2_reference: template.nis2_reference,
        purpose: template.purpose_template?.replace(/{{organization_name}}/g, organization.name) || '',
        scope: template.scope_template?.replace(/{{organization_name}}/g, organization.name) || '',
        policy_statement: template.policy_statement_template?.replace(/{{organization_name}}/g, organization.name) || '',
        review_requirements: 'This policy shall be reviewed annually.',
        status: 'draft',
        version: '1.0'
      };

      console.log('🔍 [3] Policy data:', policyData);

      // Create policy from template
      const { data, error } = await supabase
        .from('policies')
        .insert(policyData)
        .select()
        .single();

      if (error) {
        console.error('❌ [4] Insert error:', error);
        console.error('Error code:', error.code);
        console.error('Error message:', error.message);
        throw error;
      }

      console.log('✅ [5] Policy created:', data);
      toast.success('✅ Policy creata da template!');
      
      await loadData();
      
      // Open editor
      navigate(`/policy-editor/${data.id}`);
    } catch (error: any) {
      console.error('❌ Exception:', error);
      toast.error('Errore: ' + (error.message || 'Errore creazione policy'));
    } finally {
      setCreating(false);
    }
  };

  const mandatoryTemplates = templates.filter(t => t.category === 'mandatory');
  const recommendedTemplates = templates.filter(t => t.category === 'recommended');

  const mandatoryCount = mandatoryTemplates.length;
  const mandatoryCompleted = policies.filter(p => 
    mandatoryTemplates.some(t => t.name === p.policy_name) && p.status === 'approved'
  ).length;

  if (loading) {
    return (
      <AppLayout>
        <div className="p-6">Caricamento...</div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <PolicyNavigation />

        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <FileText className="h-8 w-8" />
              Policy Management
            </h1>
            <p className="text-muted-foreground mt-1">
              Gestisci policy ISO 27001:2022 + NIS2
            </p>
          </div>
          <Button onClick={() => navigate('/policy-editor/new')}>
            <Plus className="h-4 w-4 mr-2" />
            Policy Personalizzata
          </Button>
        </div>

        {/* Progress */}
        <Card className="border-2">
          <CardHeader>
            <CardTitle>Progresso Policy Obbligatorie</CardTitle>
            <CardDescription>
              {mandatoryCompleted} di {mandatoryCount} policy obbligatorie approvate
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="h-4 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary transition-all"
                    style={{ width: `${(mandatoryCompleted / mandatoryCount) * 100}%` }}
                  />
                </div>
              </div>
              <Badge variant={mandatoryCompleted === mandatoryCount ? 'default' : 'secondary'}>
                {Math.round((mandatoryCompleted / mandatoryCount) * 100)}%
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="mandatory">
          <TabsList>
            <TabsTrigger value="mandatory">
              📋 Obbligatorie ISO ({mandatoryTemplates.length})
            </TabsTrigger>
            <TabsTrigger value="recommended">
              🟦 Raccomandate NIS2 ({recommendedTemplates.length})
            </TabsTrigger>
            <TabsTrigger value="my-policies">
              📄 Le Mie Policy ({policies.length})
            </TabsTrigger>
          </TabsList>

          {/* Mandatory Templates */}
          <TabsContent value="mandatory" className="space-y-4">
            <div className="grid gap-4">
              {mandatoryTemplates.map((template) => {
                const existingPolicy = policies.find(p => p.policy_name === template.name);
                
                return (
                  <Card key={template.id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <CardTitle className="flex items-center gap-2">
                            {template.name}
                            {existingPolicy?.status === 'approved' && (
                              <CheckCircle className="h-5 w-5 text-green-500" />
                            )}
                          </CardTitle>
                          <CardDescription className="mt-2">
                            {template.purpose_template?.substring(0, 150)}...
                          </CardDescription>
                          <div className="flex gap-2 mt-3">
                            {template.iso_reference?.map((ref: string) => (
                              <Badge key={ref} variant="outline">ISO {ref}</Badge>
                            ))}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {existingPolicy ? (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  console.log('👁️ Viewing policy:', existingPolicy.id);
                                  navigate(`/policies/${existingPolicy.id}`);
                                }}
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                Vedi
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => {
                                  console.log('✏️ Editing policy:', existingPolicy.id);
                                  navigate(`/policy-editor/${existingPolicy.id}`);
                                }}
                              >
                                <Edit className="h-4 w-4 mr-1" />
                                Modifica
                              </Button>
                            </>
                          ) : (
                            <Button 
                              onClick={() => createFromTemplate(template)}
                              disabled={creating}
                            >
                              {creating ? (
                                <>
                                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                                  Creazione...
                                </>
                              ) : (
                                <>
                                  <Plus className="h-4 w-4 mr-1" />
                                  Crea da Template
                                </>
                              )}
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

          {/* Recommended Templates */}
          <TabsContent value="recommended" className="space-y-4">
            <div className="grid gap-4">
              {recommendedTemplates.map((template) => {
                const existingPolicy = policies.find(p => p.policy_name === template.name);
                
                return (
                  <Card key={template.id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <CardTitle className="flex items-center gap-2">
                            {template.name}
                            {existingPolicy?.status === 'approved' && (
                              <CheckCircle className="h-5 w-5 text-green-500" />
                            )}
                          </CardTitle>
                          <CardDescription className="mt-2">
                            {template.purpose_template?.substring(0, 150)}...
                          </CardDescription>
                          <div className="flex gap-2 mt-3">
                            {template.iso_reference?.map((ref: string) => (
                              <Badge key={ref} variant="outline">ISO {ref}</Badge>
                            ))}
                            {template.nis2_reference?.map((ref: string) => (
                              <Badge key={ref} variant="outline" className="bg-blue-50">
                                NIS2 {ref}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {existingPolicy ? (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  console.log('👁️ Viewing policy:', existingPolicy.id);
                                  navigate(`/policies/${existingPolicy.id}`);
                                }}
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                Vedi
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => {
                                  console.log('✏️ Editing policy:', existingPolicy.id);
                                  navigate(`/policy-editor/${existingPolicy.id}`);
                                }}
                              >
                                <Edit className="h-4 w-4 mr-1" />
                                Modifica
                              </Button>
                            </>
                          ) : (
                            <Button 
                              onClick={() => createFromTemplate(template)} 
                              variant="outline"
                              disabled={creating}
                            >
                              {creating ? (
                                <>
                                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                                  Creazione...
                                </>
                              ) : (
                                <>
                                  <Plus className="h-4 w-4 mr-1" />
                                  Crea da Template
                                </>
                              )}
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

          {/* My Policies */}
          <TabsContent value="my-policies" className="space-y-4">
            {policies.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    Nessuna policy creata. Inizia dai template obbligatori!
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {policies.map((policy) => (
                  <Card key={policy.id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline">{policy.policy_id || 'POL-XXX'}</Badge>
                            <Badge variant={
                              policy.status === 'approved' ? 'default' :
                              policy.status === 'in_review' ? 'secondary' :
                              'outline'
                            }>
                              {policy.status === 'approved' ? '✅ Approvata' :
                               policy.status === 'in_review' ? '👁️ In Revisione' :
                               '📝 Bozza'}
                            </Badge>
                            <span className="text-sm text-muted-foreground">v{policy.version}</span>
                          </div>
                          <CardTitle>{policy.policy_name}</CardTitle>
                          <CardDescription className="mt-2">
                            {policy.purpose?.substring(0, 150) || policy.content?.substring(0, 150)}...
                          </CardDescription>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              console.log('👁️ Viewing policy:', policy.id);
                              navigate(`/policies/${policy.id}`);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              console.log('✏️ Editing policy:', policy.id);
                              navigate(`/policy-editor/${policy.id}`);
                            }}
                          >
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
