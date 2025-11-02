import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Edit, ArrowLeft, Home, ClipboardList } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export default function ProcedureView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [procedure, setProcedure] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadProcedure();
    }
  }, [id]);

  const loadProcedure = async () => {
    try {
      const { data, error } = await supabase
        .from('procedures')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setProcedure(data);
    } catch (error) {
      console.error('Error loading procedure:', error);
      toast.error('Errore nel caricamento della procedura');
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

    const config = statusConfig[procedure?.status] || statusConfig.draft;

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

  if (!procedure) {
    return (
      <AppLayout>
        <div className="p-6">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
            <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
              <Home className="h-4 w-4 mr-1" />
            </Button>
            <span>/</span>
            <Button variant="ghost" size="sm" onClick={() => navigate('/procedures')}>
              Procedure
            </Button>
          </div>
          <p>Procedura non trovata</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6 max-w-5xl mx-auto">
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
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline">{procedure.procedure_id || 'PROC-XXX'}</Badge>
              {getStatusBadge()}
              <span className="text-sm text-muted-foreground">v{procedure.version}</span>
            </div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <ClipboardList className="h-8 w-8" />
              {procedure.title}
            </h1>
            {procedure.iso_reference && procedure.iso_reference.length > 0 && (
              <div className="flex gap-2 mt-2">
                {procedure.iso_reference.map((ref: string) => (
                  <Badge key={ref} variant="outline">ISO 27001:{ref}</Badge>
                ))}
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => navigate('/procedures')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Indietro
            </Button>
            <Button
              onClick={() => navigate(`/procedures/${id}/edit`)}
            >
              <Edit className="h-4 w-4 mr-2" />
              Modifica
            </Button>
          </div>
        </div>

        {/* Procedure Content */}
        <Card>
          <CardHeader>
            <CardTitle>Contenuto Procedura</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 prose prose-sm max-w-none">
            {procedure.purpose && (
              <div>
                <h3 className="text-lg font-semibold mb-2">1. Purpose (Scopo)</h3>
                <p className="whitespace-pre-wrap text-muted-foreground">{procedure.purpose}</p>
              </div>
            )}

            {procedure.scope && (
              <>
                <Separator />
                <div>
                  <h3 className="text-lg font-semibold mb-2">2. Scope (Ambito)</h3>
                  <p className="whitespace-pre-wrap text-muted-foreground">{procedure.scope}</p>
                </div>
              </>
            )}

            {procedure.responsibilities && (
              <>
                <Separator />
                <div>
                  <h3 className="text-lg font-semibold mb-2">3. Responsibilities (Responsabilità)</h3>
                  <p className="whitespace-pre-wrap text-muted-foreground">{procedure.responsibilities}</p>
                </div>
              </>
            )}

            {procedure.procedure_steps && (
              <>
                <Separator />
                <div>
                  <h3 className="text-lg font-semibold mb-2">4. Procedure Steps (Passi Operativi)</h3>
                  <p className="whitespace-pre-wrap text-muted-foreground">{procedure.procedure_steps}</p>
                </div>
              </>
            )}

            {procedure.records && (
              <>
                <Separator />
                <div>
                  <h3 className="text-lg font-semibold mb-2">5. Records (Registrazioni)</h3>
                  <p className="whitespace-pre-wrap text-muted-foreground">{procedure.records}</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Metadata */}
        {(procedure.approved_by || procedure.approval_date || procedure.next_review_date) && (
          <Card>
            <CardHeader>
              <CardTitle>Document Control</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-3 gap-4 text-sm">
              {procedure.approved_by && (
                <div>
                  <p className="text-muted-foreground">Approved By</p>
                  <p className="font-medium">{procedure.approved_by}</p>
                </div>
              )}
              {procedure.approval_date && (
                <div>
                  <p className="text-muted-foreground">Approval Date</p>
                  <p className="font-medium">{new Date(procedure.approval_date).toLocaleDateString()}</p>
                </div>
              )}
              {procedure.next_review_date && (
                <div>
                  <p className="text-muted-foreground">Next Review</p>
                  <p className="font-medium">{new Date(procedure.next_review_date).toLocaleDateString()}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
