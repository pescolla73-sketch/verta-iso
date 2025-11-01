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
      in_review: { label: 'In Revisione', variant: 'secondary' },
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
            {policy.purpose && (
              <div>
                <h3 className="text-lg font-semibold mb-2">1. Purpose (Scopo)</h3>
                <p className="whitespace-pre-wrap text-muted-foreground">{policy.purpose}</p>
              </div>
            )}

            {policy.scope && (
              <>
                <Separator />
                <div>
                  <h3 className="text-lg font-semibold mb-2">2. Scope (Ambito)</h3>
                  <p className="whitespace-pre-wrap text-muted-foreground">{policy.scope}</p>
                </div>
              </>
            )}

            {policy.policy_statement && (
              <>
                <Separator />
                <div>
                  <h3 className="text-lg font-semibold mb-2">3. Policy Statement (Dichiarazione)</h3>
                  <p className="whitespace-pre-wrap text-muted-foreground">{policy.policy_statement}</p>
                </div>
              </>
            )}

            {policy.roles_responsibilities && (
              <>
                <Separator />
                <div>
                  <h3 className="text-lg font-semibold mb-2">4. Roles & Responsibilities</h3>
                  <p className="whitespace-pre-wrap text-muted-foreground">{policy.roles_responsibilities}</p>
                </div>
              </>
            )}

            {policy.compliance_requirements && (
              <>
                <Separator />
                <div>
                  <h3 className="text-lg font-semibold mb-2">5. Compliance Requirements</h3>
                  <p className="whitespace-pre-wrap text-muted-foreground">{policy.compliance_requirements}</p>
                </div>
              </>
            )}

            {policy.review_requirements && (
              <>
                <Separator />
                <div>
                  <h3 className="text-lg font-semibold mb-2">6. Policy Review</h3>
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
