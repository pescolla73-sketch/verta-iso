import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  Calendar, CheckCircle, Clock, AlertTriangle, 
  PlayCircle, FileText, Zap, AlertCircle, Sparkles
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format, isPast, differenceInDays } from 'date-fns';
import { it } from 'date-fns/locale';

interface RecurringTask {
  id: string;
  task_name: string;
  task_description: string | null;
  category: string;
  due_date: string;
  status: string | null;
  priority: string | null;
  frequency_days: number | null;
  completion_notes: string | null;
  completed_date: string | null;
}

export default function ComplianceCalendarPage() {
  const { toast } = useToast();
  const [tasks, setTasks] = useState<RecurringTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [organizationId, setOrganizationId] = useState('');
  const [selectedTask, setSelectedTask] = useState<RecurringTask | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [completionNotes, setCompletionNotes] = useState('');
  const [completing, setCompleting] = useState(false);

  useEffect(() => {
    loadOrganization();
  }, []);

  const loadOrganization = async () => {
    try {
      const { data: org } = await supabase
        .from('organization')
        .select('id')
        .limit(1)
        .maybeSingle();

      if (org) {
        setOrganizationId(org.id);
        await checkAndGenerateTasks(org.id);
        loadTasks(org.id);
      }
    } catch (error) {
      console.error('Error loading organization:', error);
    }
  };

  const checkAndGenerateTasks = async (orgId: string) => {
    try {
      const { data: existingTasks } = await supabase
        .from('recurring_tasks')
        .select('id')
        .eq('organization_id', orgId)
        .limit(1);

      if (!existingTasks || existingTasks.length === 0) {
        const { data, error } = await supabase.rpc('generate_initial_recurring_tasks', {
          p_organization_id: orgId,
          p_start_date: new Date().toISOString().split('T')[0]
        });

        if (error) throw error;

        toast({
          title: '✅ Task Generati',
          description: `${data} task ricorrenti creati per la tua organizzazione`,
          duration: 5000
        });
      }

      await supabase.rpc('update_overdue_tasks');

    } catch (error: any) {
      console.error('Error generating tasks:', error);
    }
  };

  const loadTasks = async (orgId: string) => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('recurring_tasks')
        .select('*')
        .eq('organization_id', orgId)
        .order('due_date', { ascending: true });

      if (error) throw error;
      setTasks(data || []);

    } catch (error: any) {
      console.error('Error loading tasks:', error);
      toast({
        title: 'Errore',
        description: 'Impossibile caricare i task',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'testing': return <PlayCircle className="h-5 w-5 text-purple-600" />;
      case 'review': return <FileText className="h-5 w-5 text-blue-600" />;
      case 'training': return <Sparkles className="h-5 w-5 text-green-600" />;
      case 'audit': return <AlertCircle className="h-5 w-5 text-red-600" />;
      case 'maintenance': return <Zap className="h-5 w-5 text-orange-600" />;
      default: return <Calendar className="h-5 w-5 text-gray-600" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'testing': return 'bg-purple-50 border-purple-200';
      case 'review': return 'bg-blue-50 border-blue-200';
      case 'training': return 'bg-green-50 border-green-200';
      case 'audit': return 'bg-red-50 border-red-200';
      case 'maintenance': return 'bg-orange-50 border-orange-200';
      default: return 'bg-muted border-border';
    }
  };

  const getPriorityBadge = (priority: string | null) => {
    switch (priority) {
      case 'critical':
        return <Badge variant="destructive">🔴 CRITICO</Badge>;
      case 'high':
        return <Badge className="bg-orange-500 hover:bg-orange-600">🟠 ALTO</Badge>;
      case 'medium':
        return <Badge className="bg-blue-500 hover:bg-blue-600">🔵 MEDIO</Badge>;
      case 'low':
        return <Badge variant="secondary">⚪ BASSO</Badge>;
      default:
        return <Badge variant="outline">{priority}</Badge>;
    }
  };

  const getStatusBadge = (task: RecurringTask) => {
    if (task.status === 'completed') {
      return <Badge className="bg-green-500 hover:bg-green-600">✅ Completato</Badge>;
    }
    if (task.status === 'overdue') {
      return <Badge variant="destructive">⏰ SCADUTO</Badge>;
    }
    if (task.status === 'in_progress') {
      return <Badge className="bg-blue-500 hover:bg-blue-600">🔄 In Corso</Badge>;
    }

    const daysRemaining = differenceInDays(new Date(task.due_date), new Date());
    
    if (daysRemaining < 0) {
      return <Badge variant="destructive">⏰ SCADUTO</Badge>;
    } else if (daysRemaining <= 7) {
      return <Badge className="bg-yellow-500 hover:bg-yellow-600">⚠️ Scade tra {daysRemaining}gg</Badge>;
    } else {
      return <Badge variant="outline">📅 Tra {daysRemaining} giorni</Badge>;
    }
  };

  const getFrequencyLabel = (days: number | null) => {
    if (!days) return 'N/A';
    if (days === 30) return 'Mensile';
    if (days === 90) return 'Trimestrale';
    if (days === 180) return 'Semestrale';
    if (days === 365) return 'Annuale';
    return `Ogni ${days} giorni`;
  };

  const handleCompleteTask = async () => {
    if (!selectedTask) return;

    try {
      setCompleting(true);

      const { error } = await supabase
        .from('recurring_tasks')
        .update({
          status: 'completed',
          completed_date: new Date().toISOString(),
          completion_notes: completionNotes,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedTask.id);

      if (error) throw error;

      toast({
        title: '✅ Task Completato!',
        description: `"${selectedTask.task_name}" completato. Prossima occorrenza generata automaticamente.`,
        duration: 5000
      });

      setDialogOpen(false);
      setSelectedTask(null);
      setCompletionNotes('');
      loadTasks(organizationId);

    } catch (error: any) {
      console.error('Error completing task:', error);
      toast({
        title: 'Errore',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setCompleting(false);
    }
  };

  const openTaskDetails = (task: RecurringTask) => {
    setSelectedTask(task);
    setCompletionNotes('');
    setDialogOpen(true);
  };

  const overdueTasks = tasks.filter(t => t.status === 'overdue' || 
    (t.status === 'pending' && isPast(new Date(t.due_date))));
  const upcomingTasks = tasks.filter(t => 
    t.status === 'pending' && !isPast(new Date(t.due_date)));
  const completedTasks = tasks.filter(t => t.status === 'completed');

  const urgentTasks = upcomingTasks.filter(t => 
    differenceInDays(new Date(t.due_date), new Date()) <= 7);
  const soonTasks = upcomingTasks.filter(t => {
    const days = differenceInDays(new Date(t.due_date), new Date());
    return days > 7 && days <= 30;
  });
  const laterTasks = upcomingTasks.filter(t => 
    differenceInDays(new Date(t.due_date), new Date()) > 30);

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            📅 Calendario Compliance
          </h1>
          <p className="text-muted-foreground mt-1">
            Task ricorrenti per mantenere la certificazione ISO 27001
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-red-200 bg-red-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-red-900">
              ⏰ Scaduti/Urgenti
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">
              {overdueTasks.length + urgentTasks.length}
            </div>
            <p className="text-xs text-red-700 mt-1">
              Richiedono attenzione immediata
            </p>
          </CardContent>
        </Card>

        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-yellow-900">
              📆 Prossimi 30 giorni
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-600">
              {soonTasks.length}
            </div>
            <p className="text-xs text-yellow-700 mt-1">
              Da programmare presto
            </p>
          </CardContent>
        </Card>

        <Card className="border-blue-200 bg-blue-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-900">
              📋 Totale Attivi
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">
              {upcomingTasks.length}
            </div>
            <p className="text-xs text-blue-700 mt-1">
              Task in calendario
            </p>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-green-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-900">
              ✅ Completati
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {completedTasks.length}
            </div>
            <p className="text-xs text-green-700 mt-1">
              Quest'anno
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overdue" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overdue" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Scaduti ({overdueTasks.length})
          </TabsTrigger>
          <TabsTrigger value="upcoming" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            In Programma ({upcomingTasks.length})
          </TabsTrigger>
          <TabsTrigger value="completed" className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Completati ({completedTasks.length})
          </TabsTrigger>
          <TabsTrigger value="all" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Tutti ({tasks.length})
          </TabsTrigger>
        </TabsList>

        {/* OVERDUE TASKS */}
        <TabsContent value="overdue" className="space-y-4">
          {overdueTasks.length === 0 ? (
            <Card className="border-green-200 bg-green-50">
              <CardContent className="py-12 text-center">
                <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-4" />
                <h3 className="text-lg font-semibold text-green-900">
                  🎉 Nessun Task Scaduto!
                </h3>
                <p className="text-sm text-green-700 mt-2">
                  Ottimo lavoro! Sei in regola con tutte le scadenze.
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>⚠️ Attenzione: Task Scaduti</AlertTitle>
                <AlertDescription>
                  Hai {overdueTasks.length} task scaduti che richiedono attenzione immediata.
                  Completa questi task per rimanere conforme ISO 27001.
                </AlertDescription>
              </Alert>

              {overdueTasks.map((task) => (
                <Card key={task.id} className={`${getCategoryColor(task.category)} border-2`}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        {getCategoryIcon(task.category)}
                        <div>
                          <CardTitle className="text-lg">
                            {task.task_name}
                          </CardTitle>
                          <CardDescription className="mt-1">
                            {task.task_description}
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {getPriorityBadge(task.priority)}
                        {getStatusBadge(task)}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="flex gap-4 text-sm text-muted-foreground">
                        <span>
                          <strong>Scadenza:</strong>{' '}
                          <span className="text-red-600 font-semibold">
                            {format(new Date(task.due_date), 'dd MMMM yyyy', { locale: it })}
                            <span className="ml-1">
                              ({Math.abs(differenceInDays(new Date(task.due_date), new Date()))} giorni fa)
                            </span>
                          </span>
                        </span>
                        <span>
                          <strong>Frequenza:</strong>{' '}
                          <span>{getFrequencyLabel(task.frequency_days)}</span>
                        </span>
                      </div>
                      <Button 
                        variant="destructive"
                        onClick={() => openTaskDetails(task)}
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Completa Task
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </>
          )}
        </TabsContent>

        {/* UPCOMING TASKS */}
        <TabsContent value="upcoming" className="space-y-6">
          {urgentTasks.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-red-700 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                ⚠️ URGENTI - Prossimi 7 giorni ({urgentTasks.length})
              </h3>
              <div className="grid gap-3">
                {urgentTasks.map((task) => (
                  <Card key={task.id} className={`${getCategoryColor(task.category)} border-2`}>
                    <CardContent className="py-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {getCategoryIcon(task.category)}
                          <div>
                            <h4 className="font-semibold">{task.task_name}</h4>
                            <p className="text-sm text-muted-foreground">{task.task_description}</p>
                            <div className="flex gap-4 mt-1 text-xs text-muted-foreground">
                              <span>📅 {format(new Date(task.due_date), 'dd MMM yyyy', { locale: it })}</span>
                              <span>🔁 {getFrequencyLabel(task.frequency_days)}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {getPriorityBadge(task.priority)}
                          {getStatusBadge(task)}
                          <Button size="sm" onClick={() => openTaskDetails(task)}>
                            Vedi
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {soonTasks.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-yellow-700 flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                📆 Prossimi 8-30 giorni ({soonTasks.length})
              </h3>
              <div className="grid gap-3">
                {soonTasks.map((task) => (
                  <Card key={task.id} className="border">
                    <CardContent className="py-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {getCategoryIcon(task.category)}
                          <div>
                            <h4 className="font-semibold">{task.task_name}</h4>
                            <p className="text-sm text-muted-foreground">
                              📅 {format(new Date(task.due_date), 'dd MMM yyyy', { locale: it })}
                              <span className="ml-2">• 🔁 {getFrequencyLabel(task.frequency_days)}</span>
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {getPriorityBadge(task.priority)}
                          <Button size="sm" variant="outline" onClick={() => openTaskDetails(task)}>
                            Dettagli
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {laterTasks.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-muted-foreground flex items-center gap-2">
                <Clock className="h-5 w-5" />
                📋 Oltre 30 giorni ({laterTasks.length})
              </h3>
              <div className="grid gap-2">
                {laterTasks.map((task) => (
                  <Card 
                    key={task.id} 
                    className="border cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => openTaskDetails(task)}
                  >
                    <CardContent className="py-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {getCategoryIcon(task.category)}
                          <div>
                            <h4 className="font-medium">{task.task_name}</h4>
                            <p className="text-sm text-muted-foreground">
                              {format(new Date(task.due_date), 'dd MMM yyyy', { locale: it })}
                            </p>
                          </div>
                        </div>
                        {getPriorityBadge(task.priority)}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </TabsContent>

        {/* COMPLETED TASKS */}
        <TabsContent value="completed" className="space-y-4">
          {completedTasks.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-12 text-center">
                <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  Nessun task completato ancora. Completa il primo task per vedere qui!
                </p>
              </CardContent>
            </Card>
          ) : (
            completedTasks.map((task) => (
              <Card key={task.id} className="border-green-200 bg-green-50/50">
                <CardContent className="py-4">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <div className="flex-1">
                      <h4 className="font-semibold">{task.task_name}</h4>
                      <p className="text-sm text-muted-foreground">
                        ✅ Completato il {task.completed_date && format(new Date(task.completed_date), 'dd MMM yyyy', { locale: it })}
                      </p>
                      {task.completion_notes && (
                        <p className="text-sm mt-1 text-muted-foreground">
                          📝 {task.completion_notes}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* ALL TASKS */}
        <TabsContent value="all" className="space-y-2">
          {tasks.map((task) => (
            <Card 
              key={task.id} 
              className="border cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => openTaskDetails(task)}
            >
              <CardContent className="py-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getCategoryIcon(task.category)}
                    <div>
                      <h4 className="font-medium">{task.task_name}</h4>
                      <p className="text-sm text-muted-foreground">
                        📅 {format(new Date(task.due_date), 'dd MMM yyyy', { locale: it })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getPriorityBadge(task.priority)}
                    {getStatusBadge(task)}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>

      {/* Task Details Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedTask && (
            <>
              <DialogHeader>
                <div className="flex items-start gap-3">
                  {getCategoryIcon(selectedTask.category)}
                  <div className="flex-1">
                    <DialogTitle className="text-xl">
                      {selectedTask.task_name}
                    </DialogTitle>
                    <DialogDescription className="mt-1">
                      {selectedTask.task_description}
                    </DialogDescription>
                  </div>
                  <div className="flex gap-2">
                    {getPriorityBadge(selectedTask.priority)}
                    {getStatusBadge(selectedTask)}
                  </div>
                </div>
              </DialogHeader>

              <div className="space-y-6 mt-4">
                {/* Info */}
                <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Scadenza</p>
                    <p className="text-lg font-semibold">
                      {format(new Date(selectedTask.due_date), 'dd MMMM yyyy', { locale: it })}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Frequenza</p>
                    <p className="text-lg font-semibold">
                      {getFrequencyLabel(selectedTask.frequency_days)}
                    </p>
                  </div>
                </div>

                {/* Completion Form */}
                {selectedTask.status !== 'completed' && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="completion-notes">
                        Note Completamento (opzionale)
                      </Label>
                      <Textarea
                        id="completion-notes"
                        value={completionNotes}
                        onChange={(e) => setCompletionNotes(e.target.value)}
                        placeholder="Descrivi cosa hai fatto, eventuali problemi riscontrati, risultati..."
                        rows={4}
                      />
                      <p className="text-xs text-muted-foreground">
                        💡 Documenta i risultati per facilitare audit e review futuri
                      </p>
                    </div>

                    <Alert className="bg-green-50 border-green-200">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <AlertTitle className="text-green-900">
                        Cosa succede dopo?
                      </AlertTitle>
                      <AlertDescription className="text-green-800 text-sm">
                        Marcando questo task come completato, il sistema genererà automaticamente 
                        il prossimo task con scadenza tra {getFrequencyLabel(selectedTask.frequency_days)?.toLowerCase()}.
                      </AlertDescription>
                    </Alert>

                    <Button 
                      onClick={handleCompleteTask}
                      disabled={completing}
                      className="w-full bg-green-600 hover:bg-green-700"
                      size="lg"
                    >
                      {completing ? (
                        'Completamento...'
                      ) : (
                        <>
                          <CheckCircle className="h-5 w-5 mr-2" />
                          Marca come Completato
                        </>
                      )}
                    </Button>
                  </div>
                )}

                {selectedTask.status === 'completed' && (
                  <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <h4 className="font-semibold text-sm mb-2 text-green-900">
                      ✅ Task Completato
                    </h4>
                    <p className="text-sm text-green-800">
                      Completato il {selectedTask.completed_date && format(new Date(selectedTask.completed_date), 'dd MMMM yyyy', { locale: it })}
                    </p>
                    {selectedTask.completion_notes && (
                      <div className="mt-2 text-sm text-foreground">
                        <strong>Note:</strong>
                        <p className="mt-1 whitespace-pre-line">{selectedTask.completion_notes}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
