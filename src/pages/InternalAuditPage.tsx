import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ClipboardCheck, Plus, Calendar, FileCheck, CheckCircle, TrendingUp, AlertTriangle, FileSpreadsheet, Download } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import * as XLSX from 'xlsx';

export default function InternalAuditPage() {
  const navigate = useNavigate();
  const [audits, setAudits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterYear, setFilterYear] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [stats, setStats] = useState({
    total: 0,
    planned: 0,
    completed: 0,
    conforming: 0
  });
  const [analytics, setAnalytics] = useState({
    monthlyTrend: [] as any[],
    controlHeatmap: [] as any[],
    categoryDistribution: [] as any[]
  });

  useEffect(() => {
    loadAudits();
  }, []);

  const loadAudits = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('internal_audits')
        .select('*')
        .order('audit_date', { ascending: false });

      if (error) throw error;

      setAudits(data || []);
      
      // Calculate stats
      const total = data?.length || 0;
      const planned = data?.filter(a => a.status === 'planned').length || 0;
      const completed = data?.filter(a => a.status === 'completed').length || 0;
      const conforming = data?.filter(a => a.overall_result === 'conforming').length || 0;
      
      setStats({ total, planned, completed, conforming });

      // Load analytics data
      await loadAnalytics(data || []);
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

  const loadAnalytics = async (auditsData: any[]) => {
    try {
      // 1. Monthly Trend - Conformità per mese
      const monthlyData: Record<string, { month: string; conforming: number; nonConforming: number; partial: number }> = {};
      
      auditsData.forEach(audit => {
        if (audit.status === 'completed' && audit.overall_result) {
          const date = new Date(audit.audit_date);
          const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          
          if (!monthlyData[monthKey]) {
            monthlyData[monthKey] = { month: monthKey, conforming: 0, nonConforming: 0, partial: 0 };
          }
          
          if (audit.overall_result === 'conforming') monthlyData[monthKey].conforming++;
          else if (audit.overall_result === 'non_conforming') monthlyData[monthKey].nonConforming++;
          else if (audit.overall_result === 'partial') monthlyData[monthKey].partial++;
        }
      });

      const monthlyTrend = Object.values(monthlyData).sort((a, b) => a.month.localeCompare(b.month));

      // 2. Control Heatmap - Controlli con più findings
      const auditIds = auditsData.map(a => a.id);
      
      if (auditIds.length > 0) {
        const { data: findingsData } = await supabase
          .from('audit_findings')
          .select('control_reference, severity')
          .in('audit_id', auditIds);

        const controlMap: Record<string, { control: string; critical: number; major: number; minor: number; total: number }> = {};
        
        findingsData?.forEach(finding => {
          const control = finding.control_reference || 'Sconosciuto';
          if (!controlMap[control]) {
            controlMap[control] = { control, critical: 0, major: 0, minor: 0, total: 0 };
          }
          controlMap[control].total++;
          if (finding.severity === 'critical') controlMap[control].critical++;
          else if (finding.severity === 'major') controlMap[control].major++;
          else if (finding.severity === 'minor') controlMap[control].minor++;
        });

        const controlHeatmap = Object.values(controlMap)
          .sort((a, b) => b.total - a.total)
          .slice(0, 10);

        // 3. Category Distribution - Findings per categoria ISO
        const categoryMap: Record<string, number> = {
          'A.5': 0,
          'A.6': 0,
          'A.7': 0,
          'A.8': 0,
          'Altri': 0
        };

        findingsData?.forEach(finding => {
          const ref = finding.control_reference || '';
          const category = ref.split('.')[0];
          if (categoryMap[category] !== undefined) {
            categoryMap[category]++;
          } else {
            categoryMap['Altri']++;
          }
        });

        const categoryDistribution = Object.entries(categoryMap)
          .map(([category, count]) => ({ category, count }))
          .filter(item => item.count > 0);

        setAnalytics({ monthlyTrend, controlHeatmap, categoryDistribution });
      }
    } catch (error) {
      console.error('Error loading analytics:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      planned: { variant: 'secondary', label: 'Pianificato' },
      in_progress: { variant: 'default', label: 'In Corso' },
      completed: { variant: 'outline', label: 'Completato' },
      cancelled: { variant: 'destructive', label: 'Annullato' }
    };
    const config = variants[status] || variants.planned;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getResultBadge = (result: string) => {
    if (!result) return <Badge variant="outline">-</Badge>;
    const variants: Record<string, any> = {
      conforming: { variant: 'default', label: 'Conforme', className: 'bg-green-500' },
      non_conforming: { variant: 'destructive', label: 'Non Conforme' },
      partial: { variant: 'secondary', label: 'Parziale', className: 'bg-orange-500' }
    };
    const config = variants[result] || variants.partial;
    return <Badge variant={config.variant} className={config.className}>{config.label}</Badge>;
  };

  const filteredAudits = audits.filter(audit => {
    const year = new Date(audit.audit_date).getFullYear().toString();
    const matchYear = filterYear === 'all' || year === filterYear;
    const matchStatus = filterStatus === 'all' || audit.status === filterStatus;
    return matchYear && matchStatus;
  });

  const years = Array.from(new Set(audits.map(a => new Date(a.audit_date).getFullYear().toString())));

  const exportToExcel = async () => {
    try {
      const workbook = XLSX.utils.book_new();

      // 1. Statistiche Generali
      const statsData = [
        ['Statistiche Audit Interni'],
        [''],
        ['Metrica', 'Valore'],
        ['Audit Totali', stats.total],
        ['Audit Pianificati', stats.planned],
        ['Audit Completati', stats.completed],
        ['Audit Conformi', stats.conforming],
        ['Percentuale Conformità', stats.completed > 0 ? `${Math.round((stats.conforming / stats.completed) * 100)}%` : '0%']
      ];
      const statsSheet = XLSX.utils.aoa_to_sheet(statsData);
      XLSX.utils.book_append_sheet(workbook, statsSheet, 'Statistiche');

      // 2. Trend Mensile
      if (analytics.monthlyTrend.length > 0) {
        const trendData = [
          ['Trend Conformità Mensile'],
          [''],
          ['Mese', 'Conformi', 'Non Conformi', 'Parziali', 'Totale']
        ];
        
        analytics.monthlyTrend.forEach(month => {
          const total = month.conforming + month.nonConforming + month.partial;
          trendData.push([
            month.month,
            month.conforming,
            month.nonConforming,
            month.partial,
            total
          ]);
        });
        
        const trendSheet = XLSX.utils.aoa_to_sheet(trendData);
        XLSX.utils.book_append_sheet(workbook, trendSheet, 'Trend Mensile');
      }

      // 3. Controlli Critici
      if (analytics.controlHeatmap.length > 0) {
        const heatmapData = [
          ['Controlli più Critici'],
          [''],
          ['Controllo', 'Findings Critici', 'Findings Maggiori', 'Findings Minori', 'Totale Findings']
        ];
        
        analytics.controlHeatmap.forEach(control => {
          heatmapData.push([
            control.control,
            control.critical,
            control.major,
            control.minor,
            control.total
          ]);
        });
        
        const heatmapSheet = XLSX.utils.aoa_to_sheet(heatmapData);
        XLSX.utils.book_append_sheet(workbook, heatmapSheet, 'Controlli Critici');
      }

      // 4. Lista Audit
      const auditData = [
        ['Lista Completa Audit'],
        [''],
        ['Codice', 'Data', 'Ambito', 'Auditor', 'Stato', 'Risultato', 'Conclusione']
      ];
      
      audits.forEach(audit => {
        auditData.push([
          audit.audit_code,
          new Date(audit.audit_date).toLocaleDateString('it-IT'),
          audit.audit_scope,
          audit.auditor_name,
          audit.status === 'planned' ? 'Pianificato' : audit.status === 'completed' ? 'Completato' : audit.status,
          audit.overall_result === 'conforming' ? 'Conforme' : audit.overall_result === 'non_conforming' ? 'Non Conforme' : audit.overall_result === 'partial' ? 'Parziale' : '-',
          audit.conclusion || '-'
        ]);
      });
      
      const auditSheet = XLSX.utils.aoa_to_sheet(auditData);
      XLSX.utils.book_append_sheet(workbook, auditSheet, 'Audit');

      // 5. Findings Completi
      const auditIds = audits.map(a => a.id);
      if (auditIds.length > 0) {
        const { data: findingsData } = await supabase
          .from('audit_findings')
          .select('*, internal_audits(audit_code)')
          .in('audit_id', auditIds)
          .order('created_at', { ascending: false });

        if (findingsData && findingsData.length > 0) {
          const findingsExport = [
            ['Lista Completa Findings'],
            [''],
            ['Audit', 'Data', 'Titolo', 'Descrizione', 'Severità', 'Controllo', 'Stato', 'Azione Raccomandata']
          ];
          
          findingsData.forEach(finding => {
            findingsExport.push([
              (finding.internal_audits as any)?.audit_code || '-',
              new Date(finding.created_at).toLocaleDateString('it-IT'),
              finding.title,
              finding.description || '-',
              finding.severity === 'critical' ? 'Critico' : finding.severity === 'major' ? 'Maggiore' : finding.severity === 'minor' ? 'Minore' : 'Osservazione',
              finding.control_reference || '-',
              finding.status === 'open' ? 'Aperto' : 'Chiuso',
              finding.recommended_action || '-'
            ]);
          });
          
          const findingsSheet = XLSX.utils.aoa_to_sheet(findingsExport);
          XLSX.utils.book_append_sheet(workbook, findingsSheet, 'Findings');
        }
      }

      // 6. Distribuzione per Categoria
      if (analytics.categoryDistribution.length > 0) {
        const categoryData = [
          ['Distribuzione Findings per Categoria ISO'],
          [''],
          ['Categoria', 'Numero Findings']
        ];
        
        analytics.categoryDistribution.forEach(cat => {
          categoryData.push([cat.category, cat.count]);
        });
        
        const categorySheet = XLSX.utils.aoa_to_sheet(categoryData);
        XLSX.utils.book_append_sheet(workbook, categorySheet, 'Categorie ISO');
      }

      // Generate file
      const timestamp = new Date().toISOString().split('T')[0];
      XLSX.writeFile(workbook, `audit-analytics-${timestamp}.xlsx`);
      
      toast({
        title: 'Successo',
        description: 'Report Excel generato con successo'
      });
    } catch (error: any) {
      console.error('Export error:', error);
      toast({
        title: 'Errore',
        description: 'Impossibile generare il report',
        variant: 'destructive'
      });
    }
  };

  const exportToCSV = async () => {
    try {
      const auditIds = audits.map(a => a.id);
      const { data: findingsData } = await supabase
        .from('audit_findings')
        .select('*, internal_audits(audit_code)')
        .in('audit_id', auditIds)
        .order('created_at', { ascending: false });

      let csv = 'Audit,Data,Titolo,Descrizione,Severità,Controllo,Stato,Azione Raccomandata\n';
      
      findingsData?.forEach(finding => {
        const row = [
          (finding.internal_audits as any)?.audit_code || '-',
          new Date(finding.created_at).toLocaleDateString('it-IT'),
          finding.title,
          (finding.description || '-').replace(/,/g, ';'),
          finding.severity === 'critical' ? 'Critico' : finding.severity === 'major' ? 'Maggiore' : finding.severity === 'minor' ? 'Minore' : 'Osservazione',
          finding.control_reference || '-',
          finding.status === 'open' ? 'Aperto' : 'Chiuso',
          (finding.recommended_action || '-').replace(/,/g, ';')
        ];
        csv += row.join(',') + '\n';
      });

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `audit-findings-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: 'Successo',
        description: 'File CSV generato con successo'
      });
    } catch (error: any) {
      console.error('Export error:', error);
      toast({
        title: 'Errore',
        description: 'Impossibile generare il CSV',
        variant: 'destructive'
      });
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Caricamento audit...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <ClipboardCheck className="h-8 w-8" />
            Audit Interni
          </h1>
          <p className="text-muted-foreground mt-1">Gestione audit interni ISO 27001:2022</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportToCSV}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
          <Button variant="outline" onClick={exportToExcel}>
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            Export Excel
          </Button>
          <Button onClick={() => navigate('/audit-interni/piano')}>
            <Plus className="mr-2 h-4 w-4" />
            Nuovo Audit
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Audit Totali</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-3xl font-bold">{stats.total}</span>
              <ClipboardCheck className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pianificati</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-3xl font-bold">{stats.planned}</span>
              <Calendar className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Completati</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-3xl font-bold">{stats.completed}</span>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Conformi</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-3xl font-bold">{stats.conforming}</span>
              <FileCheck className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Trend Conformità Mensile
            </CardTitle>
          </CardHeader>
          <CardContent>
            {analytics.monthlyTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={analytics.monthlyTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="conforming" stroke="hsl(var(--primary))" name="Conforme" strokeWidth={2} />
                  <Line type="monotone" dataKey="nonConforming" stroke="hsl(var(--destructive))" name="Non Conforme" strokeWidth={2} />
                  <Line type="monotone" dataKey="partial" stroke="hsl(var(--warning))" name="Parziale" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                Nessun dato disponibile
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Distribuzione Findings per Categoria ISO
            </CardTitle>
          </CardHeader>
          <CardContent>
            {analytics.categoryDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analytics.categoryDistribution}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="category" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="count" name="Findings" fill="hsl(var(--primary))">
                    {analytics.categoryDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={`hsl(var(--chart-${(index % 5) + 1}))`} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                Nessun dato disponibile
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            Controlli più Critici (Top 10)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {analytics.controlHeatmap.length > 0 ? (
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={analytics.controlHeatmap} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="control" type="category" width={80} />
                <Tooltip />
                <Legend />
                <Bar dataKey="critical" stackId="a" fill="hsl(var(--destructive))" name="Critici" />
                <Bar dataKey="major" stackId="a" fill="hsl(var(--warning))" name="Maggiori" />
                <Bar dataKey="minor" stackId="a" fill="hsl(var(--muted))" name="Minori" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[400px] text-muted-foreground">
              Nessun dato disponibile
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Elenco Audit</CardTitle>
            <div className="flex gap-2">
              <Select value={filterYear} onValueChange={setFilterYear}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Anno" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tutti</SelectItem>
                  {years.map(year => (
                    <SelectItem key={year} value={year}>{year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Stato" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tutti</SelectItem>
                  <SelectItem value="planned">Pianificato</SelectItem>
                  <SelectItem value="in_progress">In Corso</SelectItem>
                  <SelectItem value="completed">Completato</SelectItem>
                  <SelectItem value="cancelled">Annullato</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredAudits.length === 0 ? (
            <div className="text-center py-12">
              <ClipboardCheck className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Nessun audit trovato</p>
              <Button variant="outline" className="mt-4" onClick={() => navigate('/audit-interni/piano')}>
                Pianifica il primo audit
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Codice</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Ambito</TableHead>
                  <TableHead>Auditor</TableHead>
                  <TableHead>Stato</TableHead>
                  <TableHead>Risultato</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAudits.map(audit => (
                  <TableRow 
                    key={audit.id} 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => navigate(`/audit-interni/${audit.id}`)}
                  >
                    <TableCell className="font-medium">{audit.audit_code}</TableCell>
                    <TableCell>{new Date(audit.audit_date).toLocaleDateString('it-IT')}</TableCell>
                    <TableCell>{audit.audit_scope}</TableCell>
                    <TableCell>{audit.auditor_name}</TableCell>
                    <TableCell>{getStatusBadge(audit.status)}</TableCell>
                    <TableCell>{getResultBadge(audit.overall_result)}</TableCell>
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
