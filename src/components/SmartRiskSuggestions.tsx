import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  Sparkles, CheckCircle, AlertTriangle, Info,
  Shield, MapPin, Building2, Database, Zap
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SmartSuggestion {
  template_id: string;
  risk_name: string;
  relevance_score: number;
  reason: string;
}

interface SmartRiskSuggestionsProps {
  open: boolean;
  onClose: () => void;
  suggestions: SmartSuggestion[];
  organizationId: string;
  onRisksAdded: () => void;
}

export function SmartRiskSuggestions({ 
  open, 
  onClose, 
  suggestions,
  organizationId,
  onRisksAdded 
}: SmartRiskSuggestionsProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [selectedSuggestions, setSelectedSuggestions] = useState<Set<string>>(
    new Set(suggestions.map(s => s.template_id))
  );

  const criticalSuggestions = suggestions.filter(s => s.relevance_score >= 85);
  const highSuggestions = suggestions.filter(s => s.relevance_score >= 65 && s.relevance_score < 85);
  const mediumSuggestions = suggestions.filter(s => s.relevance_score < 65);

  const toggleSuggestion = (templateId: string) => {
    const newSet = new Set(selectedSuggestions);
    if (newSet.has(templateId)) {
      newSet.delete(templateId);
    } else {
      newSet.add(templateId);
    }
    setSelectedSuggestions(newSet);
  };

  const selectAll = () => {
    setSelectedSuggestions(new Set(suggestions.map(s => s.template_id)));
  };

  const selectOnlyCritical = () => {
    setSelectedSuggestions(new Set(criticalSuggestions.map(s => s.template_id)));
  };

  const handleAddSelected = async () => {
    try {
      setLoading(true);

      const { data: templates, error: templatesError } = await supabase
        .from('risk_templates')
        .select('*')
        .in('id', Array.from(selectedSuggestions));

      if (templatesError) throw templatesError;

      const risksToInsert = templates.map(template => ({
        organization_id: organizationId,
        risk_id: `RISK-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: template.risk_name,
        description: template.description,
        inherent_probability: template.likelihood_default <= 2 ? 'low' : template.likelihood_default <= 3 ? 'medium' : 'high',
        inherent_impact: template.impact_default <= 2 ? 'low' : template.impact_default <= 3 ? 'medium' : 'high',
        inherent_risk_score: template.risk_score_default,
        treatment_strategy: 'mitigate',
        treatment_description: template.recommended_treatments?.join(', ') || '',
        status: 'identified',
        related_controls: template.related_controls || [],
      }));

      const { error: insertError } = await supabase
        .from('risks')
        .insert(risksToInsert);

      if (insertError) throw insertError;

      toast({
        title: '✅ Rischi Aggiunti!',
        description: `${risksToInsert.length} rischi rilevanti aggiunti al tuo Risk Assessment`,
        duration: 5000
      });

      onRisksAdded();
      onClose();

    } catch (error: any) {
      console.error('Error adding smart suggestions:', error);
      toast({
        title: 'Errore',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const getRelevanceBadge = (score: number) => {
    if (score >= 85) {
      return <Badge className="bg-red-500 hover:bg-red-600">🔴 MOLTO RILEVANTE</Badge>;
    } else if (score >= 65) {
      return <Badge className="bg-orange-500 hover:bg-orange-600">🟠 RILEVANTE</Badge>;
    } else {
      return <Badge className="bg-yellow-500 hover:bg-yellow-600 text-black">🟡 DA VALUTARE</Badge>;
    }
  };

  const getReasonIcon = (reason: string) => {
    if (reason.includes('Zona sismica') || reason.includes('idrogeologico')) {
      return <MapPin className="h-4 w-4 text-orange-500" />;
    }
    if (reason.includes('Settore')) {
      return <Building2 className="h-4 w-4 text-blue-500" />;
    }
    if (reason.includes('cloud') || reason.includes('on-premise')) {
      return <Database className="h-4 w-4 text-purple-500" />;
    }
    if (reason.includes('dati')) {
      return <Shield className="h-4 w-4 text-green-500" />;
    }
    return <Zap className="h-4 w-4 text-yellow-500" />;
  };

  const renderSuggestionGroup = (groupSuggestions: SmartSuggestion[], title: string, icon: string) => {
    if (groupSuggestions.length === 0) return null;
    
    return (
      <div className="space-y-3">
        <h4 className="font-semibold text-sm text-muted-foreground flex items-center gap-2">
          <span>{icon}</span>
          {title} ({groupSuggestions.length})
        </h4>
        <div className="space-y-2">
          {groupSuggestions.map((suggestion) => (
            <Card 
              key={suggestion.template_id}
              className={`cursor-pointer transition-all ${
                selectedSuggestions.has(suggestion.template_id) 
                  ? 'ring-2 ring-primary bg-primary/5' 
                  : 'hover:bg-muted/50'
              }`}
              onClick={() => toggleSuggestion(suggestion.template_id)}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Checkbox
                    checked={selectedSuggestions.has(suggestion.template_id)}
                    onCheckedChange={() => toggleSuggestion(suggestion.template_id)}
                    onClick={(e) => e.stopPropagation()}
                    className="mt-1"
                  />
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-foreground">
                        {suggestion.risk_name}
                      </span>
                      {getRelevanceBadge(suggestion.relevance_score)}
                    </div>
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      {getReasonIcon(suggestion.reason)}
                      <span className="font-medium">Perché rilevante:</span>
                      {suggestion.reason}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Sparkles className="h-6 w-6 text-primary" />
            🧠 Rischi Rilevanti per la Tua Azienda
          </DialogTitle>
          <DialogDescription>
            Abbiamo analizzato il tuo setup e identificato i rischi più probabili per te
          </DialogDescription>
        </DialogHeader>

        <Alert className="border-primary/20 bg-primary/5">
          <Info className="h-4 w-4" />
          <AlertTitle>Analisi Completata!</AlertTitle>
          <AlertDescription>
            Trovati {suggestions.length} rischi rilevanti basandoci su:
            ubicazione, settore, infrastruttura e dati trattati.
            <div className="flex gap-4 mt-2 text-sm">
              <span>🔴 {criticalSuggestions.length} Molto rilevanti</span>
              <span>🟠 {highSuggestions.length} Rilevanti</span>
              <span>🟡 {mediumSuggestions.length} Da valutare</span>
            </div>
          </AlertDescription>
        </Alert>

        <div className="flex items-center justify-between py-2">
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={selectAll}>
              Seleziona Tutti ({suggestions.length})
            </Button>
            <Button variant="outline" size="sm" onClick={selectOnlyCritical}>
              Solo Molto Rilevanti ({criticalSuggestions.length})
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setSelectedSuggestions(new Set())}
            >
              Deseleziona Tutto
            </Button>
          </div>
          <Badge variant="secondary">
            {selectedSuggestions.size} selezionati
          </Badge>
        </div>

        <div className="flex-1 overflow-y-auto space-y-6 pr-2">
          {renderSuggestionGroup(criticalSuggestions, 'MOLTO RILEVANTI', '🔴')}
          {renderSuggestionGroup(highSuggestions, 'RILEVANTI', '🟠')}
          {renderSuggestionGroup(mediumSuggestions, 'DA VALUTARE', '🟡')}
        </div>

        <div className="flex items-center justify-between pt-4 border-t">
          <p className="text-sm text-muted-foreground">
            💡 Potrai sempre aggiungere o rimuovere rischi in seguito
          </p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Salta per Ora
            </Button>
            <Button onClick={handleAddSelected} disabled={loading || selectedSuggestions.size === 0}>
              {loading ? (
                'Aggiunta in corso...'
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Aggiungi {selectedSuggestions.size} Rischi
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
