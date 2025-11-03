import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Plus, Eye, Edit, Home, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { toast } from 'sonner';

export default function ManagementReview() {
  const navigate = useNavigate();
  console.log('🔍 ManagementReview mounted, navigate:', typeof navigate);
  
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState({
    totalReviews: 0,
    completedReviews: 0,
    overdueActions: 0,
    openActions: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const orgData = localStorage.getItem('selectedOrganization');
      if (!orgData) return;
      const org = JSON.parse(orgData);

      // Load reviews
      const { data: reviewsData, error: reviewsError } = await supabase
        .from('management_reviews')
        .select('*, review_action_items(*)')
        .order('meeting_date', { ascending: false }) as any;

      if (reviewsError) throw reviewsError;

      setReviews(reviewsData || []);

      // Calculate stats
      const total = reviewsData?.length || 0;
      const completed = reviewsData?.filter(r => r.status === 'minutes_approved').length || 0;
      
      const allActions = reviewsData?.flatMap(r => r.review_action_items || []) || [];
      const openActions = allActions.filter(a => a.status === 'open' || a.status === 'in_progress').length;
      const overdueActions = allActions.filter(a => {
        if (a.status === 'completed') return false;
        return new Date(a.due_date) < new Date();
      }).length;

      setStats({
        totalReviews: total,
        completedReviews: completed,
        overdueActions,
        openActions
      });

    } catch (error) {
      console.error('Error loading:', error);
      toast.error('Errore caricamento');
    } finally {
      setLoading(false);
    }
  };

  const createNewReview = async () => {
    console.log('🔍 [1] Create button clicked');
    try {
      const orgData = localStorage.getItem('selectedOrganization');
      console.log('🔍 [2] Org data:', orgData);
      
      if (!orgData) {
        console.log('❌ No organization data');
        toast.error('Nessuna organizzazione selezionata');
        return;
      }
      const org = JSON.parse(orgData);
      console.log('🔍 [3] Organization:', org.id);

      const { data: { user } } = await supabase.auth.getUser();
      console.log('🔍 [4] User:', user?.email);

      // Default to next quarter review date
      const nextQuarter = new Date();
      nextQuarter.setMonth(nextQuarter.getMonth() + 3);

      const { data, error } = await supabase
        .from('management_reviews')
        .insert({
          organization_id: org.id,
          meeting_date: nextQuarter.toISOString().split('T')[0],
          status: 'scheduled',
          created_by: user?.id
        } as any)
        .select()
        .single();

      if (error) {
        console.error('❌ [5] Insert error:', error);
        throw error;
      }

      console.log('✅ [6] Review created:', data);
      toast.success('✅ Management Review creato!');
      
      console.log('🔍 [7] Navigating to:', `/management-review/${data.id}/edit`);
      navigate(`/management-review/${data.id}/edit`);
    } catch (error) {
      console.error('💥 Exception:', error);
      toast.error('Errore creazione review');
    }
  };

  const getStatusBadge = (status) => {
    const variants = {
      'scheduled': { variant: 'outline', label: '📅 Pianificato' },
      'completed': { variant: 'secondary', label: '✅ Completato' },
      'minutes_draft': { variant: 'secondary', label: '📝 Bozza Verbale' },
      'minutes_approved': { variant: 'default', label: '✅ Approvato' }
    };
    const config = variants[status] || variants['scheduled'];
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <div className="space-y-6 p-6">
      {/* Navigation */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
          <Home className="h-4 w-4 mr-1" />
          Home
        </Button>
        <span>/</span>
        <span>Management Review</span>
      </div>

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <TrendingUp className="h-8 w-8" />
            Management Review
          </h1>
          <p className="text-muted-foreground mt-1">
            Riunione direzione ISO 27001:2022 Clause 9.3
          </p>
        </div>
        <Button onClick={createNewReview}>
          <Plus className="h-4 w-4 mr-2" />
          Nuova Riunione
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Riunioni Totali
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalReviews}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Completate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.completedReviews}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Azioni Aperte
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.openActions}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Azioni In Ritardo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.overdueActions}</div>
          </CardContent>
        </Card>
      </div>

      {/* ISO 27001 Requirements Info */}
      <Card className="border-2 border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="text-base">📋 Requisiti ISO 27001:2022 - Clause 9.3</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm mb-3">
            La direzione deve riesaminare il sistema di gestione della sicurezza delle informazioni a intervalli pianificati (tipicamente trimestrale o semestrale).
          </p>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="font-semibold mb-2">Input richiesti:</p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>Status azioni precedenti</li>
                <li>Cambiamenti rilevanti</li>
                <li>Feedback su performance ISMS</li>
                <li>Risultati audit</li>
                <li>Non-conformità</li>
                <li>Risultati monitoraggio</li>
                <li>Opportunità miglioramento</li>
              </ul>
            </div>
            <div>
              <p className="font-semibold mb-2">Output richiesti:</p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>Decisioni su miglioramento continuo</li>
                <li>Modifiche necessarie all'ISMS</li>
                <li>Necessità di risorse</li>
                <li>Action items con responsabili</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reviews List */}
      <Card>
        <CardHeader>
          <CardTitle>Riunioni Management Review</CardTitle>
          <CardDescription>
            {reviews.length} riunioni registrate
          </CardDescription>
        </CardHeader>
        <CardContent>
          {reviews.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">
                Nessuna riunione pianificata. Crea la prima Management Review!
              </p>
              <Button onClick={createNewReview}>
                <Plus className="h-4 w-4 mr-2" />
                Crea Prima Riunione
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {reviews.map((review) => {
                const openActions = review.review_action_items?.filter(
                  a => a.status === 'open' || a.status === 'in_progress'
                ).length || 0;

                return (
                  <Card key={review.id} className="border">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <Badge variant="outline">{review.review_id}</Badge>
                            {getStatusBadge(review.status)}
                            {review.meeting_date && (
                              <span className="text-sm text-muted-foreground">
                                📅 {format(new Date(review.meeting_date), 'dd MMMM yyyy', { locale: it })}
                              </span>
                            )}
                          </div>
                          <CardTitle className="text-lg">
                            Management Review - {format(new Date(review.meeting_date), 'MMMM yyyy', { locale: it })}
                          </CardTitle>
                          {review.chairman && (
                            <p className="text-sm text-muted-foreground mt-1">
                              Presidente: {review.chairman}
                            </p>
                          )}
                          {openActions > 0 && (
                            <Badge variant="secondary" className="mt-2">
                              {openActions} azioni aperte
                            </Badge>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              console.log('🔍 Navigating to view:', review.id);
                              navigate(`/management-review/${review.id}`);
                            }}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Vedi
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              console.log('🔍 Navigating to edit:', review.id);
                              navigate(`/management-review/${review.id}/edit`);
                            }}
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Modifica
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
