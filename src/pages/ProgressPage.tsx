import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  calculateProgress, 
  ISO27001_SECTIONS, 
  getSectionStatus,
  getNextSection,
  ProgressSection 
} from '@/lib/progressTracking';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle2, 
  Circle, 
  Clock, 
  ArrowRight,
  Lightbulb,
  AlertCircle,
  TrendingUp
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';

export default function ProgressPage() {
  const [progress, setProgress] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadProgress();
  }, []);

  const loadProgress = async () => {
    try {
      const prog = await calculateProgress();
      setProgress(prog);
    } catch (error) {
      console.error('Error loading progress:', error);
    } finally {
      setLoading(false);
    }
  };

  const nextSection = getNextSection(progress);
  const completedCount = ISO27001_SECTIONS.filter(
    s => getSectionStatus(s.id, progress) === 'completed'
  ).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Caricamento progresso...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-4xl font-bold">🎯 Percorso Certificazione ISO 27001</h1>
        <p className="text-muted-foreground text-lg">
          Segui il percorso per completare l'implementazione del tuo ISMS
        </p>
      </div>

      {/* Overall Progress Card */}
      <Card className="border-2">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-2xl">
            <TrendingUp className="h-6 w-6" />
            Progresso Complessivo
          </CardTitle>
          <CardDescription>
            Avanzamento verso la certificazione ISO 27001:2022
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-6xl font-bold text-primary">
                {progress.overall || 0}%
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                {completedCount} di {ISO27001_SECTIONS.length} sezioni completate
              </p>
            </div>
            <Badge 
              variant={progress.overall === 100 ? 'default' : 'secondary'} 
              className="text-xl px-6 py-3"
            >
              {progress.overall === 100 ? '✅ Pronto per certificazione' : '⏳ In corso'}
            </Badge>
          </div>
          <Progress value={progress.overall || 0} className="h-4" />
        </CardContent>
      </Card>

      {/* Next Action Card */}
      {nextSection && progress.overall < 100 && (
        <Card className="border-primary border-2 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <ArrowRight className="h-6 w-6 text-primary" />
              Prossima Azione Suggerita
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="text-5xl">{nextSection.icon}</div>
              <div className="flex-1">
                <h3 className="text-2xl font-bold mb-2">{nextSection.title}</h3>
                <p className="text-muted-foreground text-lg mb-4">
                  {nextSection.description}
                </p>
                <div className="flex items-center gap-4 flex-wrap">
                  <Badge variant="outline" className="text-sm py-1 px-3">
                    <Clock className="h-4 w-4 mr-2" />
                    {nextSection.estimatedTime}
                  </Badge>
                  {nextSection.dependencies && nextSection.dependencies.length > 0 && (
                    <Badge variant="outline" className="text-sm py-1 px-3">
                      <AlertCircle className="h-4 w-4 mr-2" />
                      Dipende da {nextSection.dependencies.length} sezione/i
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            <Button 
              size="lg" 
              className="w-full sm:w-auto text-lg"
              onClick={() => navigate(nextSection.route)}
            >
              Inizia Ora
              <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Certification Ready Message */}
      {progress.overall === 100 && (
        <Card className="border-green-500 border-2 bg-green-50 dark:bg-green-950">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl text-green-700 dark:text-green-300">
              <CheckCircle2 className="h-8 w-8" />
              Sistema Pronto per Certificazione!
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-lg">
              Hai completato tutte le sezioni necessarie. Il tuo ISMS è pronto per l'audit di certificazione.
            </p>
            <div className="flex gap-4 flex-wrap">
              <Button size="lg" onClick={() => navigate('/soa')}>
                📄 Scarica Documentazione Completa
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate('/audits')}>
                📋 Verifica Checklist Finale
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Separator />

      {/* Sections List */}
      <div className="space-y-4">
        <h2 className="text-3xl font-bold">Sezioni ISO 27001:2022</h2>
        <p className="text-muted-foreground">
          Completa le sezioni seguenti per implementare il tuo Sistema di Gestione della Sicurezza delle Informazioni
        </p>
        
        <div className="grid gap-4">
          {ISO27001_SECTIONS.map((section) => {
            const status = getSectionStatus(section.id, progress);
            const sectionProgress = progress[section.id] || 0;
            const isBlocked = section.dependencies?.some(
              depId => getSectionStatus(depId, progress) !== 'completed'
            );

            return (
              <Card 
                key={section.id}
                className={`cursor-pointer transition-all hover:shadow-lg ${
                  status === 'completed' ? 'border-green-500 border-2' :
                  status === 'in-progress' ? 'border-blue-500 border-2' :
                  isBlocked ? 'opacity-60' :
                  ''
                }`}
                onClick={() => !isBlocked && navigate(section.route)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="text-5xl flex-shrink-0">{section.icon}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                          <CardTitle className="text-xl">{section.title}</CardTitle>
                          {status === 'completed' && (
                            <CheckCircle2 className="h-6 w-6 text-green-500 flex-shrink-0" />
                          )}
                          {status === 'in-progress' && (
                            <Circle className="h-6 w-6 text-blue-500 animate-pulse flex-shrink-0" />
                          )}
                        </div>
                        <CardDescription className="text-base">
                          {section.description}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <Badge variant={
                        status === 'completed' ? 'default' :
                        status === 'in-progress' ? 'secondary' :
                        'outline'
                      } className="mb-2">
                        {status === 'completed' ? '✅ Completato' :
                         status === 'in-progress' ? '⏳ In Corso' :
                         '⭕ Da Fare'}
                      </Badge>
                      <p className="text-sm text-muted-foreground flex items-center justify-end gap-1">
                        <Clock className="h-3 w-3" />
                        {section.estimatedTime}
                      </p>
                    </div>
                  </div>
                </CardHeader>

                {/* Progress Bar for In-Progress Sections */}
                {sectionProgress > 0 && sectionProgress < 100 && (
                  <CardContent className="pt-0 pb-4">
                    <div className="space-y-2">
                      <Progress value={sectionProgress} className="h-2" />
                      <p className="text-sm text-muted-foreground">
                        {sectionProgress}% completato
                      </p>
                    </div>
                  </CardContent>
                )}

                {/* Tips for Incomplete Sections */}
                {status !== 'completed' && section.tips.length > 0 && (
                  <CardContent className="pt-0 pb-4">
                    <div className="bg-amber-50 dark:bg-amber-950 p-4 rounded-lg border border-amber-200 dark:border-amber-800">
                      <div className="flex items-start gap-3">
                        <Lightbulb className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold mb-2 text-amber-900 dark:text-amber-100">
                            Suggerimenti:
                          </p>
                          <ul className="text-sm space-y-1 text-amber-800 dark:text-amber-200">
                            {section.tips.map((tip, i) => (
                              <li key={i} className="flex gap-2">
                                <span className="flex-shrink-0">•</span>
                                <span>{tip}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                )}

                {/* Dependency Warning */}
                {isBlocked && section.dependencies && (
                  <CardContent className="pt-0 pb-4">
                    <div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950 p-3 rounded-lg border border-amber-200 dark:border-amber-800">
                      <AlertCircle className="h-4 w-4 flex-shrink-0" />
                      <span>
                        Completa prima:{' '}
                        {section.dependencies
                          .map(depId => ISO27001_SECTIONS.find(s => s.id === depId)?.title)
                          .filter(Boolean)
                          .join(', ')}
                      </span>
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
