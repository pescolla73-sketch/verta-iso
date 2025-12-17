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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sparkles, FileText, Shield, Lock, Server, Wifi, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface PolicyTemplate {
  id: string;
  name: string;
  template_code: string;
  category: string;
  policy_number: string;
  purpose_template: string;
  scope_template: string;
  policy_statement_template: string;
  responsibilities_template: string;
  related_controls: string[];
  related_clauses: string[];
  is_mandatory: boolean;
  iso_reference: string[];
}

interface PolicyTemplateSelectorProps {
  onSelectTemplate: (template: PolicyTemplate) => void;
  trigger?: React.ReactNode;
}

export function PolicyTemplateSelector({ onSelectTemplate, trigger }: PolicyTemplateSelectorProps) {
  const { toast } = useToast();
  const [templates, setTemplates] = useState<PolicyTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<PolicyTemplate | null>(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (open) {
      loadTemplates();
    }
  }, [open]);

  const loadTemplates = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('policy_templates')
        .select('*')
        .not('template_code', 'is', null)
        .order('is_mandatory', { ascending: false })
        .order('name');

      if (error) throw error;
      setTemplates(data || []);
    } catch (error: any) {
      console.error('Error loading templates:', error);
      toast({
        title: 'Errore',
        description: 'Impossibile caricare i template',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'mandatory': return <Shield className="h-4 w-4 text-red-500" />;
      case 'recommended': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'security': return <Shield className="h-4 w-4 text-blue-500" />;
      case 'access': return <Lock className="h-4 w-4 text-purple-500" />;
      case 'operations': return <Server className="h-4 w-4 text-green-500" />;
      default: return <FileText className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const handleUseTemplate = () => {
    if (selectedTemplate) {
      onSelectTemplate(selectedTemplate);
      setOpen(false);
      setSelectedTemplate(null);
      toast({
        title: 'Template Applicato',
        description: `Policy "${selectedTemplate.name}" caricata. Personalizza i dettagli.`
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Sparkles className="h-4 w-4 mr-2" />
            Usa Template
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-5xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Template Policy ISO 27001
          </DialogTitle>
          <DialogDescription>
            Seleziona un template pre-compilato da personalizzare per la tua organizzazione
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4 mt-4">
          {/* Lista Template */}
          <div className="space-y-3">
            <h3 className="font-medium text-sm text-muted-foreground">
              Template Disponibili
            </h3>

            <ScrollArea className="h-[500px] pr-4">
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">
                  Caricamento template...
                </div>
              ) : templates.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Nessun template disponibile
                </div>
              ) : (
                <div className="space-y-2">
                  {templates.map((template) => (
                    <Card
                      key={template.id}
                      className={`cursor-pointer transition-all hover:border-primary ${
                        selectedTemplate?.id === template.id 
                          ? 'border-primary bg-primary/5' 
                          : ''
                      }`}
                      onClick={() => setSelectedTemplate(template)}
                    >
                      <CardHeader className="p-3 pb-2">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            {getCategoryIcon(template.category)}
                            <div>
                              <CardTitle className="text-sm">
                                {template.name}
                              </CardTitle>
                              <p className="text-xs text-muted-foreground">
                                {template.policy_number}
                              </p>
                            </div>
                          </div>
                          {template.is_mandatory && (
                            <Badge variant="destructive" className="text-xs">
                              Obbligatoria
                            </Badge>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="p-3 pt-0">
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {template.purpose_template}
                        </p>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {template.related_clauses?.slice(0, 3).map((clause, i) => (
                            <Badge key={i} variant="outline" className="text-xs">
                              {clause}
                            </Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>

          {/* Anteprima Template */}
          <div className="space-y-3">
            <h3 className="font-medium text-sm text-muted-foreground">
              Anteprima
            </h3>

            {selectedTemplate ? (
              <ScrollArea className="h-[500px] pr-4">
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    {getCategoryIcon(selectedTemplate.category)}
                    <span className="font-medium">{selectedTemplate.name}</span>
                  </div>
                  
                  <p className="text-sm text-muted-foreground">
                    {selectedTemplate.purpose_template}
                  </p>

                  <div className="space-y-3">
                    <div>
                      <h4 className="text-sm font-medium mb-1">Ambito:</h4>
                      <p className="text-sm text-muted-foreground">
                        {selectedTemplate.scope_template}
                      </p>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium mb-1">Contenuto Policy:</h4>
                      <pre className="text-xs text-muted-foreground whitespace-pre-wrap bg-muted/50 p-3 rounded-md">
                        {selectedTemplate.policy_statement_template}
                      </pre>
                    </div>

                    {selectedTemplate.responsibilities_template && (
                      <div>
                        <h4 className="text-sm font-medium mb-1">Responsabilità:</h4>
                        <pre className="text-xs text-muted-foreground whitespace-pre-wrap bg-muted/50 p-3 rounded-md">
                          {selectedTemplate.responsibilities_template}
                        </pre>
                      </div>
                    )}

                    <div>
                      <h4 className="text-sm font-medium mb-1">Controlli Correlati:</h4>
                      <div className="flex flex-wrap gap-1">
                        {selectedTemplate.related_controls?.map((control, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">
                            {control}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium mb-1">Clausole ISO:</h4>
                      <div className="flex flex-wrap gap-1">
                        {selectedTemplate.related_clauses?.map((clause, i) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            Clausola {clause}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>

                  <Button 
                    className="w-full mt-4" 
                    onClick={handleUseTemplate}
                  >
                    Usa Questo Template
                  </Button>
                </div>
              </ScrollArea>
            ) : (
              <div className="h-[500px] flex items-center justify-center text-muted-foreground">
                Seleziona un template per vedere l'anteprima
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
