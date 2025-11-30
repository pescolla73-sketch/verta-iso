import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, FileText, Clock, CheckCircle, AlertCircle, Archive } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format, isPast } from 'date-fns';
import { it } from 'date-fns/locale';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function DocumentControlPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    draft: 0,
    review: 0,
    obsolete: 0,
    dueReview: 0,
    policy: 0,
    procedure: 0,
    other: 0
  });

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
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

      const { data: docsData, error: docsError } = await supabase
        .from('controlled_documents')
        .select('*')
        .eq('organization_id', org.id)
        .order('document_code', { ascending: true });

      if (docsError) throw docsError;

      setDocuments(docsData || []);

      // Calculate stats
      const total = docsData?.length || 0;
      const active = docsData?.filter(d => d.status === 'active').length || 0;
      const draft = docsData?.filter(d => d.status === 'draft').length || 0;
      const review = docsData?.filter(d => d.status === 'review').length || 0;
      const obsolete = docsData?.filter(d => d.status === 'obsolete' || d.status === 'archived').length || 0;
      
      const today = new Date();
      const dueReview = docsData?.filter(d => 
        d.next_review_date && new Date(d.next_review_date) <= today && d.status === 'active'
      ).length || 0;

      const policy = docsData?.filter(d => d.document_type === 'policy').length || 0;
      const procedure = docsData?.filter(d => d.document_type === 'procedure').length || 0;
      const other = total - policy - procedure;

      setStats({ total, active, draft, review, obsolete, dueReview, policy, procedure, other });

    } catch (error: any) {
      console.error('Error loading documents:', error);
      toast({
        title: 'Errore',
        description: 'Impossibile caricare i documenti',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredDocuments = documents.filter(doc => {
    if (filterType !== 'all' && doc.document_type !== filterType) return false;
    if (filterStatus !== 'all' && doc.status !== filterStatus) return false;
    return true;
  });

  const getTypeBadge = (type: string) => {
    const configs: Record<string, { variant: any; label: string }> = {
      policy: { variant: 'default', label: 'Policy' },
      procedure: { variant: 'secondary', label: 'Procedura' },
      instruction: { variant: 'outline', label: 'Istruzione' },
      form: { variant: 'outline', label: 'Modulo' },
      plan: { variant: 'default', label: 'Piano' },
      report: { variant: 'secondary', label: 'Report' },
      other: { variant: 'outline', label: 'Altro' }
    };
    const config = configs[type] || configs.other;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getStatusBadge = (status: string) => {
    const configs: Record<string, { variant: any; label: string; icon: any }> = {
      draft: { variant: 'outline', label: 'Bozza', icon: FileText },
      review: { variant: 'secondary', label: 'In Review', icon: Clock },
      approved: { variant: 'default', label: 'Approvato', icon: CheckCircle },
      active: { variant: 'default', label: 'Attivo', icon: CheckCircle },
      obsolete: { variant: 'destructive', label: 'Obsoleto', icon: AlertCircle },
      archived: { variant: 'outline', label: 'Archiviato', icon: Archive }
    };
    const config = configs[status] || configs.draft;
    const Icon = config.icon;
    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const isReviewDue = (reviewDate: string | null, status: string) => {
    if (!reviewDate || status !== 'active') return false;
    return isPast(new Date(reviewDate));
  };

  if (loading) {
    return <div className="flex items-center justify-center p-8">Caricamento...</div>;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Controllo Documenti</h1>
          <p className="text-muted-foreground">ISO 27001:2022 - Clausola 7.5</p>
        </div>
        <Button onClick={() => navigate('/documents/new')}>
          <Plus className="h-4 w-4 mr-2" />
          Nuovo Documento
        </Button>
      </div>

      {/* KPI Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-8 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Totali
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-green-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-700">
              Attivi
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Bozze
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">{stats.draft}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              In Review
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.review}</div>
          </CardContent>
        </Card>

        <Card className="border-red-200 bg-red-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-red-700">
              Da Revisionare
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.dueReview}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Policy
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.policy}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Procedure
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{stats.procedure}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Altri
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">{stats.other}</div>
          </CardContent>
        </Card>
      </div>

      {/* Documents Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <CardTitle>Registro Documenti Controllati</CardTitle>
            
            <div className="flex flex-wrap gap-2">
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tutti i tipi</SelectItem>
                  <SelectItem value="policy">Policy</SelectItem>
                  <SelectItem value="procedure">Procedure</SelectItem>
                  <SelectItem value="instruction">Istruzioni</SelectItem>
                  <SelectItem value="form">Moduli</SelectItem>
                  <SelectItem value="plan">Piani</SelectItem>
                  <SelectItem value="report">Report</SelectItem>
                  <SelectItem value="other">Altro</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Stato" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tutti gli stati</SelectItem>
                  <SelectItem value="draft">Bozze</SelectItem>
                  <SelectItem value="review">In Review</SelectItem>
                  <SelectItem value="approved">Approvati</SelectItem>
                  <SelectItem value="active">Attivi</SelectItem>
                  <SelectItem value="obsolete">Obsoleti</SelectItem>
                  <SelectItem value="archived">Archiviati</SelectItem>
                </SelectContent>
              </Select>

              {(filterType !== 'all' || filterStatus !== 'all') && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setFilterType('all');
                    setFilterStatus('all');
                  }}
                >
                  Reset
                </Button>
              )}
            </div>
          </div>

          {filteredDocuments.length !== documents.length && (
            <p className="text-sm text-muted-foreground mt-2">
              Mostrati {filteredDocuments.length} di {documents.length} documenti
            </p>
          )}
        </CardHeader>
        <CardContent>
          {filteredDocuments.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Nessun Documento Controllato</h3>
              <p className="text-muted-foreground mb-4">
                Inizia registrando il primo documento nel sistema di controllo
              </p>
              <Button onClick={() => navigate('/documents/new')}>
                <Plus className="h-4 w-4 mr-2" />
                Crea Primo Documento
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Codice</TableHead>
                  <TableHead>Titolo</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Versione</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Prossima Review</TableHead>
                  <TableHead>Stato</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDocuments.map((doc) => (
                  <TableRow
                    key={doc.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => navigate(`/documents/${doc.id}`)}
                  >
                    <TableCell className="font-medium">{doc.document_code}</TableCell>
                    <TableCell className="max-w-xs truncate">{doc.document_title}</TableCell>
                    <TableCell>{getTypeBadge(doc.document_type)}</TableCell>
                    <TableCell>{doc.current_version}</TableCell>
                    <TableCell>{doc.document_owner || '-'}</TableCell>
                    <TableCell>
                      {doc.next_review_date ? (
                        <span className={isReviewDue(doc.next_review_date, doc.status) ? 'text-red-600 font-semibold' : ''}>
                          {format(new Date(doc.next_review_date), 'dd MMM yyyy', { locale: it })}
                          {isReviewDue(doc.next_review_date, doc.status) && (
                            <Clock className="inline h-3 w-3 ml-1" />
                          )}
                        </span>
                      ) : '-'}
                    </TableCell>
                    <TableCell>{getStatusBadge(doc.status)}</TableCell>
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
