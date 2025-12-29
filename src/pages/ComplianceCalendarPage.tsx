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
  PlayCircle, FileText, Zap, AlertCircle, Users,
  RefreshCw, Info
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
    debugDatabase();
    loadOrganization();
  }, []);

  const debugDatabase = async () => {
    try {
      const { data: templates, error: templatesError } = await supabase
        .from('recurring_task_templates')
        .select('*');
      console.log('Templates in DB:', templates?.length || 0);
      if (templatesError) console.error('Templates error:', templatesError);

      const { data: allTasks, error: tasksError } = await supabase
        .from('recurring_tasks')
        .select('*');
      console.log('Tasks in DB:', allTasks?.length || 0);
      if (tasksError) console.error('Tasks error:', tasksError);
    } catch (error) {
      console.error('Debug error:', error);
    }
  };

  const loadOrganization = async () => {
    try {
      const { data: org } = await supabase
        .from('organization')
        .select('id')
        .limit(1)
        .maybeSingle();

      console.log('Organization loaded:', org?.id);

      if (org) {
        setOrganizationId(org.id);
        await checkAndGenerateTasks(org.id);
        loadTasks(org.id);
      } else {
        console.warn('No organization found');
        setLoading(false);
      }
    } catch (error) {
      console.error('Error loading organization:', error);
      setLoading(false);
    }
  };

  const generateTasksManually = async (orgId: string) => {
    try {
      console.log('Manual task generation fallback...');
      const { data: templates, error: templatesError } = await supabase
        .from('recurring_task_templates')
        .select('*');

      if (templatesError) throw templatesError;

      if (!templates || templates.length === 0) {
        console.error('No templates found in database!');
        toast({
          title: 'Errore Configurazione',
          description: 'Template task non trovati. Contatta supporto.',
          variant: 'destructive'
        });
        return 0;
      }

      console.log(`Found ${templates.length} templates`);

      const tasksToInsert = templates.map(template => ({
        organization_id: orgId,
        template_id: template.id,
        task_name: template.task_name,
        task_description: template.task_description,
        category: template.category,
        due_date: new Date(Date.now() + (template.frequency_days || 30) * 24 * 60 * 60 * 1000)
          .toISOString().split('T')[0],
        priority: template.priority,
        frequency_days: template.frequency_days,
        status: 'pending'
      }));

      const { error: insertError } = await supabase
        .from('recurring_tasks')
        .insert(tasksToInsert);

      if (insertError) throw insertError;

      console.log(`${tasksToInsert.length} tasks generated manually`);
      return tasksToInsert.length;
    } catch (error: any) {
      console.error('Manual generation error:', error);
      throw error;
    }
  };

  const checkAndGenerateTasks = async (orgId: string) => {
    try {
      console.log('Checking tasks for org:', orgId);
      const { data: existingTasks, error: checkError } = await supabase
        .from('recurring_tasks')
        .select('id')
        .eq('organization_id', orgId)
        .limit(1);

      if (checkError) {
        console.error('Error checking existing tasks:', checkError);
        throw checkError;
      }

      console.log('Existing tasks:', existingTasks?.length || 0);

      if (!existingTasks || existingTasks.length === 0) {
        console.log('Generating initial tasks...');
        try {
          const { data, error } = await supabase.rpc('generate_initial_recurring_tasks', {
            p_organization_id: orgId,
            p_start_date: new Date().toISOString().split('T')[0]
          });

          if (error) {
            console.warn('RPC failed, using manual generation:', error);
            const count = await generateTasksManually(orgId);
            if (count && count > 0) {
              toast({
                title: 'Task Generati',
                description: `${count} task ricorrenti creati`,
                duration: 5000
              });
            }
          } else {
            console.log('Tasks generated via RPC:', data);
            if (data && data > 0) {
              toast({
                title: 'Task Generati',
                description: `${data} task ricorrenti creati automaticamente`,
                duration: 5000
              });
            }
          }
        } catch (rpcError) {
          console.warn('RPC not available, using manual generation');
          const count = await generateTasksManually(orgId);
          if (count && count > 0) {
            toast({
              title: 'Task Generati',
              description: `${count} task ricorrenti creati`,
              duration: 5000
            });
          }
        }
      } else {
        console.log('Tasks already exist, skipping generation');
      }

      console.log('Updating overdue tasks...');
      try {
        const { data: overdueCount, error: overdueError } = await supabase.rpc('update_overdue_tasks');
        if (overdueError) {
          console.warn('Update overdue failed (non-critical):', overdueError);
        } else {
          console.log('Overdue tasks updated:', overdueCount);
        }
      } catch (overdueError) {
        console.warn('Update overdue RPC not available');
      }

    } catch (error: any) {
      console.error('Error in checkAndGenerateTasks:', error);
      toast({
        title: 'Errore Task',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const loadTasks = async (orgId: string) => {
    try {
      setLoading(true);
      console.log('Loading tasks for org:', orgId);

      const { data, error } = await supabase
        .from('recurring_tasks')
        .select('*')
        .eq('organization_id', orgId)
        .order('due_date', { ascending: true });

      if (error) {
        console.error('Error loading tasks:', error);
        throw error;
      }

      console.log('Tasks loaded:', data?.length || 0, 'tasks');
      setTasks(data || []);

    } catch (error: any) {
      console.error('Error in loadTasks:', error);
      toast({
        title: 'Errore',
        description: 'Impossibile caricare i task: ' + error.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'testing': return <PlayCircle className="h-5 w-5 text-purple-600" />;
      case 'review': return <FileText className="h-5 w-5 text-primary" />;
      case 'training': return <Users className="h-5 w-5 text-green-600" />;
      case 'audit': return <AlertCircle className="h-5 w-5 text-destructive" />;
      case 'maintenance': return <Zap className="h-5 w-5 text-orange-600" />;
      default: return <Calendar className="h-5 w-5 text-muted-foreground" />;
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
        return <Badge variant="destructive">CRITICO</Badge>;
      case 'high':
        return <Badge className="bg-orange-500 hover:bg-orange-600">ALTO</Badge>;
      case 'medium':
        return <Badge className="bg-primary hover:bg-primary/90">MEDIO</Badge>;
      case 'low':
        return <Badge variant="secondary">BASSO</Badge>;
      default:
        return <Badge variant="outline">{priority}</Badge>;
    }
  };

  const getStatusBadge = (task: RecurringTask) => {
    if (task.status === 'completed') {
      return <Badge className="bg-green-600 hover:bg-green-700">Completato</Badge>;
    }
    if (task.status === 'overdue') {
      return <Badge variant="destructive">SCADUTO</Badge>;
    }
    if (task.status === 'in_progress') {
      return <Badge className="bg-primary hover:bg-primary/90">In Corso</Badge>;
    }

    const daysRemaining = differenceInDays(new Date(task.due_date), new Date());
    
    if (daysRemaining < 0) {
      return <Badge variant="destructive">SCADUTO</Badge>;
    } else if (daysRemaining <= 7) {
      return <Badge className="bg-yellow-500 hover:bg-yellow-600 text-foreground">Scade tra {daysRemaining}gg</Badge>;
    } else {
      return <Badge variant="outline">Tra {daysRemaining} giorni</Badge>;
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
        title: 'Task Completato',
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
      <div className="bg-card border-b border-border p-6 -m-6 mb-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">
              Calendario Compliance
            </h1>
            <p className="text-muted-foreground mt-1">
              Task ricorrenti per il mantenimento della certificazione ISO 27001
            </p>
          </div>
          <Badge variant="outline" className="text-sm">
            <Calendar className="h-4 w-4 mr-2" />
            {format(new Date(), 'dd MMMM yyyy', { locale: it })}
          </Badge>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-destructive">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Scaduti/Urgenti
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-destructive">
              {overdueTasks.length + urgentTasks.length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Richiedono attenzione immediata
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-yellow-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Prossimi 30 giorni
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-600">
              {soonTasks.length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Da programmare
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-primary">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Totale Attivi
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">
              {upcomingTasks.length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Task in calendario
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-600">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Completati
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {completedTasks.length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
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
            <Card className="border-green-200 bg-green-50/50">
              <CardContent className="py-12 text-center">
                <CheckCircle className="h-12 w-12 mx-auto text-green-600 mb-4" />
                <h3 className="text-lg font-semibold text-green-900">
                  Nessun Task Scaduto
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
                <AlertTitle>Attenzione: Task Scaduti</AlertTitle>
                <AlertDescription>
                  Hai {overdueTasks.length} task scaduti che richiedono attenzione immediata.
                  Completa questi task per rimanere conforme ISO 27001.
                </AlertDescription>
              </Alert>

              {overdueTasks.map((task) => (
                <Card key={task.id} className={`${getCategoryColor(task.category)} border`}>
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
                          <span className="text-destructive font-semibold">
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
              <h3 className="text-lg font-semibold text-destructive flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                URGENTI - Prossimi 7 giorni ({urgentTasks.length})
              </h3>
              <div className="grid gap-3">
                {urgentTasks.map((task) => (
                  <Card key={task.id} className={`${getCategoryColor(task.category)} border`}>
                    <CardContent className="py-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {getCategoryIcon(task.category)}
                          <div>
                            <h4 className="font-semibold">{task.task_name}</h4>
                            <p className="text-sm text-muted-foreground">{task.task_description}</p>
                            <div className="flex gap-4 mt-1 text-xs text-muted-foreground">
                              <span>{format(new Date(task.due_date), 'dd MMM yyyy', { locale: it })}</span>
                              <span>{getFrequencyLabel(task.frequency_days)}</span>
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
                Prossimi 8-30 giorni ({soonTasks.length})
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
                              {format(new Date(task.due_date), 'dd MMM yyyy', { locale: it })}
                              <span className="ml-2">• {getFrequencyLabel(task.frequency_days)}</span>
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
                Oltre 30 giorni ({laterTasks.length})
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
                        Completato il {task.completed_date && format(new Date(task.completed_date), 'dd MMM yyyy', { locale: it })}
                      </p>
                      {task.completion_notes && (
                        <p className="text-sm mt-1 text-muted-foreground">
                          Note: {task.completion_notes}
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
                        {format(new Date(task.due_date), 'dd MMM yyyy', { locale: it })}
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
                        Documenta i risultati per facilitare audit e review futuri
                      </p>
                    </div>

                    <Alert className="bg-green-50 border-green-200">
                      <Info className="h-4 w-4 text-green-600" />
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
                        <>
                          <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                          Completamento...
                        </>
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
                    <h4 className="font-semibold text-sm mb-2 text-green-900 flex items-center gap-2">
                      <CheckCircle className="h-4 w-4" />
                      Task Completato
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
