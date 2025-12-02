import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Award, AlertCircle, CheckCircle, Calendar } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

export default function CertificationAuditPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [audits, setAudits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    scheduled: 0,
    completed: 0,
    majorFindings: 0,
    minorFindings: 0,
    certificateValid: false,
    certificateExpiry: null as Date | null
  });

  useEffect(() => {
    loadAudits();
  }, []);

  const loadAudits = async () => {
    try {
      setLoading(true);

      const { data: org, error: orgError } = await supabase
        .from('organization')
        .select('id')
        .limit(1)
        .maybeSingle();
      
      if (orgError || !org) {
        toast({
          title: "Errore",
          description: "Organizzazione non trovata",
          variant: "destructive"
        });
        return;
      }

      const { data: auditsData, error: auditsError } = await supabase
        .from('certification_audits')
        .select('*')
        .eq('organization_id', org.id)
        .order('audit_date', { ascending: false });

      if (auditsError) throw auditsError;

      setAudits(auditsData || []);

      // Calculate stats
      const total = auditsData?.length || 0;
      const scheduled = auditsData?.filter(a => a.status === 'scheduled').length || 0;
      const completed = auditsData?.filter(a => a.status === 'completed' || a.status === 'certificate_issued').length || 0;
      const majorFindings = auditsData?.reduce((sum, a) => sum + (a.major_findings_count || 0), 0) || 0;
      const minorFindings = auditsData?.reduce((sum, a) => sum + (a.minor_findings_count || 0), 0) || 0;
      
      // Find active certificate
      const activeCert = auditsData?.find(a => 
        a.certificate_expiry_date && 
        new Date(a.certificate_expiry_date) > new Date()
      );

      setStats({
        total,
        scheduled,
        completed,
        majorFindings,
        minorFindings,
        certificateValid: !!activeCert,
        certificateExpiry: activeCert?.certificate_expiry_date ? new Date(activeCert.certificate_expiry_date) : null
      });

    } catch (error: any) {
      console.error('Error loading audits:', error);
      toast({
        title: 'Errore',
        description: 'Impossibile caricare gli audit',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const getAuditTypeBadge = (type: string) => {
    const configs: Record<string, { variant: any; label: string }> = {
      stage1: { variant: 'outline', label: 'Stage 1' },
      stage2: { variant: 'default', label: 'Stage 2' },
      surveillance: { variant: 'secondary', label: 'Sorveglianza' },
      recertification: { variant: 'default', label: 'Ricertificazione' },
      special: { variant: 'outline', label: 'Speciale' }
    };
    const config = configs[type] || configs.special;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getStatusBadge = (status: string) => {
    const configs: Record<string, { variant: any; label: string }> = {
      scheduled: { variant: 'outline', label: 'Pianificato' },
      in_progress: { variant: 'default', label: 'In Corso' },
      completed: { variant: 'secondary', label: 'Completato' },
      certificate_issued: { variant: 'default', label: 'Certificato Emesso' }
    };
    const config = configs[status] || configs.scheduled;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getResultBadge = (result: string | null) => {
    if (!result) return <Badge variant="outline">Pendente</Badge>;
    
    const configs: Record<string, { variant: any; label: string; icon: any }> = {
      passed: { variant: 'default', label: 'Superato', icon: CheckCircle },
      passed_with_nc: { variant: 'secondary', label: 'Superato con NC', icon: AlertCircle },
      failed: { variant: 'destructive', label: 'Non Superato', icon: AlertCircle },
      pending: { variant: 'outline', label: 'Pendente', icon: Calendar }
    };
    const config = configs[result] || configs.pending;
    const Icon = config.icon;
    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  if (loading) {
    return <div className="flex items-center justify-center p-8">Caricamento...</div>;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Audit Certificazione</h1>
          <p className="text-muted-foreground">Gestione audit ente certificatore</p>
        </div>
        <PermissionGuard resource="certification_audits" action="create">
          <Button onClick={() => navigate('/certification-audit/new')}>
            <Plus className="h-4 w-4 mr-2" />
            Nuovo Audit
          </Button>
        </PermissionGuard>
      </div>

      {/* KPI Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <Card className={stats.certificateValid ? 'border-green-500 bg-green-50' : 'border-gray-300'}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Award className="h-4 w-4" />
              Certificato
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${stats.certificateValid ? 'text-green-600' : 'text-gray-600'}`}>
              {stats.certificateValid ? 'VALIDO' : 'Non Attivo'}
            </div>
            {stats.certificateExpiry && (
              <p className="text-xs text-muted-foreground mt-1">
                Scade: {format(stats.certificateExpiry, 'dd/MM/yyyy')}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Audit Totali
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pianificati
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.scheduled}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Completati
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
          </CardContent>
        </Card>

        <Card className="border-red-200 bg-red-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-red-700">
              NC Maggiori
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.majorFindings}</div>
          </CardContent>
        </Card>

        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-yellow-700">
              NC Minori
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.minorFindings}</div>
          </CardContent>
        </Card>
      </div>

      {/* Audits Table */}
      <Card>
        <CardHeader>
          <CardTitle>Storico Audit</CardTitle>
        </CardHeader>
        <CardContent>
          {audits.length === 0 ? (
            <div className="text-center py-12">
              <Award className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Nessun Audit Registrato</h3>
              <p className="text-muted-foreground mb-4">
                Inizia registrando il primo audit di certificazione
              </p>
              <Button onClick={() => navigate('/certification-audit/new')}>
                <Plus className="h-4 w-4 mr-2" />
                Registra Primo Audit
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Codice</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Ente</TableHead>
                  <TableHead>Lead Auditor</TableHead>
                  <TableHead>Stato</TableHead>
                  <TableHead>Risultato</TableHead>
                  <TableHead>Finding</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {audits.map((audit) => (
                  <TableRow
                    key={audit.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => navigate(`/certification-audit/${audit.id}`)}
                  >
                    <TableCell className="font-medium">{audit.audit_code}</TableCell>
                    <TableCell>{getAuditTypeBadge(audit.audit_type)}</TableCell>
                    <TableCell>
                      {format(new Date(audit.audit_date), 'dd MMM yyyy', { locale: it })}
                    </TableCell>
                    <TableCell>{audit.certification_body}</TableCell>
                    <TableCell>{audit.lead_auditor || '-'}</TableCell>
                    <TableCell>{getStatusBadge(audit.status)}</TableCell>
                    <TableCell>{getResultBadge(audit.audit_result)}</TableCell>
                    <TableCell>
                      {audit.major_findings_count > 0 && (
                        <span className="text-red-600 font-semibold">
                          {audit.major_findings_count} Maggiori
                        </span>
                      )}
                      {audit.major_findings_count > 0 && audit.minor_findings_count > 0 && ', '}
                      {audit.minor_findings_count > 0 && (
                        <span className="text-yellow-600">
                          {audit.minor_findings_count} Minori
                        </span>
                      )}
                      {audit.major_findings_count === 0 && audit.minor_findings_count === 0 && '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
