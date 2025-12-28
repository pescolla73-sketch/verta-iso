import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Sparkles, Shield, AlertTriangle, Building2, 
  Scale, CheckCircle, Library
} from 'lucide-react';
import { toast } from 'sonner';

interface RiskTemplate {
  id: string;
  template_code: string;
  risk_name: string;
  category: string;
  description: string;
  threat_description: string;
  vulnerability_description: string | null;
  potential_impact: string;
  likelihood_default: number | null;
  impact_default: number | null;
  risk_score_default: number | null;
  applicable_to: string[] | null;
  recommended_treatments: string[] | null;
  related_controls: string[] | null;
  examples: string | null;
}

interface RiskTemplateSelectorProps {
  organizationId: string;
  onRisksAdded: () => void;
}

export function RiskTemplateSelector({ organizationId, onRisksAdded }: RiskTemplateSelectorProps) {
  const [templates, setTemplates] = useState<RiskTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);
  const [selectedTemplates, setSelectedTemplates] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    if (open) {
      loadTemplates();
    }
  }, [open]);

  const loadTemplates = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('risk_templates')
        .select('*')
        .order('risk_score_default', { ascending: false });

      if (error) throw error;
      setTemplates(data || []);
    } catch (error: any) {
      console.error('Error loading risk templates:', error);
      toast.error('Impossibile caricare i template di rischio');
    } finally {
      setLoading(false);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'cyber': return <Shield className="h-4 w-4 text-red-500" />;
      case 'operational': return <Building2 className="h-4 w-4 text-orange-500" />;
      case 'physical': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'compliance': return <Scale className="h-4 w-4 text-blue-500" />;
      default: return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'cyber': return 'bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-800';
      case 'operational': return 'bg-orange-50 border-orange-200 dark:bg-orange-950/20 dark:border-orange-800';
      case 'physical': return 'bg-yellow-50 border-yellow-200 dark:bg-yellow-950/20 dark:border-yellow-800';
      case 'compliance': return 'bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-800';
      default: return 'bg-muted border-border';
    }
  };

  const getRiskLevelBadge = (score: number | null) => {
    if (!score) return <Badge variant="outline">N/A</Badge>;
    if (score >= 15) {
      return <Badge variant="destructive">🔴 CRITICO</Badge>;
    } else if (score >= 10) {
      return <Badge className="bg-orange-500">🟠 ALTO</Badge>;
    } else if (score >= 6) {
      return <Badge className="bg-yellow-500 text-black">🟡 MEDIO</Badge>;
    } else {
      return <Badge variant="secondary">⚪ BASSO</Badge>;
    }
  };

  const getLikelihoodLabel = (value: number | null) => {
    if (!value) return 'N/A';
    const labels = ['', 'Molto Bassa', 'Bassa', 'Media', 'Alta', 'Molto Alta'];
    return labels[value] || '';
  };

  const getImpactLabel = (value: number | null) => {
    if (!value) return 'N/A';
    const labels = ['', 'Trascurabile', 'Basso', 'Medio', 'Alto', 'Critico'];
    return labels[value] || '';
  };

  const toggleTemplate = (templateId: string) => {
    const newSet = new Set(selectedTemplates);
    if (newSet.has(templateId)) {
      newSet.delete(templateId);
    } else {
      newSet.add(templateId);
    }
    setSelectedTemplates(newSet);
  };

  const selectAllCritical = () => {
    const criticalIds = templates
      .filter(t => (t.risk_score_default || 0) >= 15)
      .map(t => t.id);
    setSelectedTemplates(new Set(criticalIds));
  };

  const selectAllRecommended = () => {
    const recommendedIds = templates
      .filter(t => (t.risk_score_default || 0) >= 10)
      .map(t => t.id);
    setSelectedTemplates(new Set(recommendedIds));
  };

  const generateRiskId = () => {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `RISK-${timestamp}-${random}`;
  };

  const handleAddSelected = async () => {
    const selected = templates.filter(t => selectedTemplates.has(t.id));
    if (selected.length === 0) return;

    setSaving(true);
    try {
      const risksToInsert = selected.map(template => ({
        organization_id: organizationId,
        risk_id: generateRiskId(),
        name: template.risk_name,
        description: template.description,
        inherent_probability: getLikelihoodLabel(template.likelihood_default),
        inherent_impact: getImpactLabel(template.impact_default),
        inherent_risk_score: template.risk_score_default,
        inherent_risk_level: (template.risk_score_default || 0) >= 15 ? 'Critico' : 
                             (template.risk_score_default || 0) >= 10 ? 'Alto' :
                             (template.risk_score_default || 0) >= 6 ? 'Medio' : 'Basso',
        treatment_description: template.recommended_treatments?.join('\n• ') || '',
        treatment_strategy: 'Mitigate',
        status: 'Identificato',
        risk_type: 'scenario',
        related_controls: template.related_controls,
        notes: `Importato da catalogo: ${template.template_code}\n\nMinaccia: ${template.threat_description}\n\nImpatto potenziale: ${template.potential_impact}${template.examples ? '\n\nEsempi reali: ' + template.examples : ''}`
      }));

      const { error } = await supabase
        .from('risks')
        .insert(risksToInsert);

      if (error) throw error;

      toast.success(`${selected.length} rischi aggiunti con successo`);
      onRisksAdded();
      setOpen(false);
      setSelectedTemplates(new Set());

    } catch (error: any) {
      console.error('Error adding risks from templates:', error);
      toast.error('Errore: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const filteredTemplates = filter === 'all' 
    ? templates 
    : templates.filter(t => t.category === filter);

  const criticalCount = templates.filter(t => (t.risk_score_default || 0) >= 15).length;
  const highCount = templates.filter(t => (t.risk_score_default || 0) >= 10 && (t.risk_score_default || 0) < 15).length;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="default" className="gap-2">
          <Library className="h-4 w-4" />
          Usa Catalogo Rischi
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-5xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Catalogo Rischi Comuni IT
          </DialogTitle>
          <DialogDescription>
            20 rischi tipici per aziende come la tua. Seleziona quelli applicabili.
          </DialogDescription>
        </DialogHeader>

        {/* Quick Actions */}
        <div className="flex items-center justify-between border-b pb-4">
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" size="sm" onClick={selectAllCritical}>
              Seleziona tutti i CRITICI ({criticalCount})
            </Button>
            <Button variant="outline" size="sm" onClick={selectAllRecommended}>
              Seleziona CRITICI + ALTI ({criticalCount + highCount})
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setSelectedTemplates(new Set())}>
              Deseleziona Tutto
            </Button>
          </div>
          <Badge variant="secondary" className="text-sm">
            {selectedTemplates.size} rischi selezionati
          </Badge>
        </div>

        {/* Category Filter */}
        <div className="flex gap-2 flex-wrap">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('all')}
          >
            Tutti ({templates.length})
          </Button>
          <Button
            variant={filter === 'cyber' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('cyber')}
            className="gap-1"
          >
            <Shield className="h-3 w-3" />
            Cyber ({templates.filter(t => t.category === 'cyber').length})
          </Button>
          <Button
            variant={filter === 'operational' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('operational')}
            className="gap-1"
          >
            <Building2 className="h-3 w-3" />
            Operativi ({templates.filter(t => t.category === 'operational').length})
          </Button>
          <Button
            variant={filter === 'physical' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('physical')}
            className="gap-1"
          >
            <AlertTriangle className="h-3 w-3" />
            Fisici ({templates.filter(t => t.category === 'physical').length})
          </Button>
          <Button
            variant={filter === 'compliance' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('compliance')}
            className="gap-1"
          >
            <Scale className="h-3 w-3" />
            Compliance ({templates.filter(t => t.category === 'compliance').length})
          </Button>
        </div>

        {/* Risk Cards Grid */}
        <ScrollArea className="flex-1 pr-4">
          <div className="grid gap-4 py-4">
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">
                Caricamento rischi...
              </div>
            ) : filteredTemplates.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nessun rischio in questa categoria
              </div>
            ) : (
              filteredTemplates.map((template) => (
                <Card
                  key={template.id}
                  className={`cursor-pointer transition-all ${getCategoryColor(template.category)} ${
                    selectedTemplates.has(template.id) ? 'ring-2 ring-primary' : ''
                  }`}
                  onClick={() => toggleTemplate(template.id)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <Checkbox
                          checked={selectedTemplates.has(template.id)}
                          onCheckedChange={() => toggleTemplate(template.id)}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            {getCategoryIcon(template.category)}
                            <CardTitle className="text-base">
                              {template.risk_name}
                            </CardTitle>
                          </div>
                          <CardDescription className="text-sm">
                            {template.description}
                          </CardDescription>
                        </div>
                      </div>
                      {getRiskLevelBadge(template.risk_score_default)}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {/* Risk Score */}
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Probabilità</p>
                        <p className="font-medium">
                          {getLikelihoodLabel(template.likelihood_default)}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Impatto</p>
                        <p className="font-medium">
                          {getImpactLabel(template.impact_default)}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Score</p>
                        <p className="font-bold text-lg">
                          {template.risk_score_default || 'N/A'}
                        </p>
                      </div>
                    </div>

                    {/* Threat */}
                    <div className="text-sm">
                      <p className="font-medium">🎯 Minaccia:</p>
                      <p className="text-muted-foreground line-clamp-2">
                        {template.threat_description}
                      </p>
                    </div>

                    {/* Treatments */}
                    {template.recommended_treatments && template.recommended_treatments.length > 0 && (
                      <div className="text-sm">
                        <p className="font-medium mb-1">
                          ✅ Trattamenti Consigliati:
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {template.recommended_treatments.slice(0, 3).map((treatment, i) => (
                            <Badge key={i} variant="outline" className="text-xs">
                              {treatment}
                            </Badge>
                          ))}
                          {template.recommended_treatments.length > 3 && (
                            <Badge variant="secondary" className="text-xs">
                              +{template.recommended_treatments.length - 3}
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Examples */}
                    {template.examples && (
                      <div className="text-sm">
                        <p className="font-medium">📰 Esempi Reali:</p>
                        <p className="text-muted-foreground text-xs line-clamp-2">
                          {template.examples}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="flex items-center justify-between border-t pt-4">
          <p className="text-sm text-muted-foreground">
            💡 Tip: Puoi modificare probabilità e impatto dopo averli aggiunti
          </p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Annulla
            </Button>
            <Button 
              onClick={handleAddSelected} 
              disabled={selectedTemplates.size === 0 || saving}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              {saving ? 'Aggiungendo...' : `Aggiungi ${selectedTemplates.size} Rischi`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
