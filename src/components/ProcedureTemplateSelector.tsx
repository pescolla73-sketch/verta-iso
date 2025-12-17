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
import { Sparkles, FileText, Lock, Server, Shield, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ProcedureTemplate {
  id: string;
  template_name: string;
  template_code: string;
  name: string;
  category: string;
  procedure_name: string;
  procedure_number: string;
  purpose_template: string;
  scope_template: string;
  steps_template: string;
  responsibilities_template: string;
  iso_reference: string[];
  tools_required: string;
  frequency: string;
  is_mandatory: boolean;
}

interface ProcedureTemplateSelectorProps {
  onSelectTemplate: (template: ProcedureTemplate) => void;
  trigger?: React.ReactNode;
}

export function ProcedureTemplateSelector({ onSelectTemplate, trigger }: ProcedureTemplateSelectorProps) {
  const { toast } = useToast();
  const [templates, setTemplates] = useState<ProcedureTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<ProcedureTemplate | null>(null);
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
        .from('procedure_templates')
        .select('*')
        .not('template_code', 'is', null)
        .order('is_mandatory', { ascending: false })
        .order('name');

      if (error) throw error;
      setTemplates(data || []);
    } catch (error: any) {
      console.error('Error loading procedure templates:', error);
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
      case 'security': return <Shield className="h-5 w-5 text-blue-600" />;
      case 'access': return <Lock className="h-5 w-5 text-purple-600" />;
      case 'operations': return <Server className="h-5 w-5 text-green-600" />;
      case 'mandatory': return <AlertTriangle className="h-5 w-5 text-amber-600" />;
      default: return <FileText className="h-5 w-5 text-gray-600" />;
    }
  };

  const handleUseTemplate = () => {
    if (selectedTemplate) {
      onSelectTemplate(selectedTemplate);
      setOpen(false);
      toast({
        title: 'Template Applicato',
        description: `Procedura "${selectedTemplate.procedure_name || selectedTemplate.name}" caricata.`
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className="gap-2">
            <Sparkles className="h-4 w-4" />
            Usa Template
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-5xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Template Procedure ISO 27001
          </DialogTitle>
          <DialogDescription>
            Seleziona un template di procedura operativa pre-compilata
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4 mt-4">
          <div className="space-y-2">
            <h3 className="font-semibold text-sm text-muted-foreground">
              Template Disponibili ({templates.length})
            </h3>
            <ScrollArea className="h-[55vh] pr-4">
              {loading ? (
                <div className="flex items-center justify-center h-40">
                  <p className="text-muted-foreground">Caricamento template...</p>
                </div>
              ) : templates.length === 0 ? (
                <div className="flex items-center justify-center h-40">
                  <p className="text-muted-foreground">Nessun template disponibile</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {templates.map((template) => (
                    <Card 
                      key={template.id}
                      className={`cursor-pointer transition-all hover:border-primary ${
                        selectedTemplate?.id === template.id ? 'border-primary bg-primary/5' : ''
                      }`}
                      onClick={() => setSelectedTemplate(template)}
                    >
                      <CardHeader className="p-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-start gap-2">
                            {getCategoryIcon(template.category)}
                            <div>
                              <CardTitle className="text-sm font-medium">
                                {template.procedure_name || template.name}
                              </CardTitle>
                              <p className="text-xs text-muted-foreground mt-1">
                                {template.procedure_number} • {template.frequency}
                              </p>
                            </div>
                          </div>
                          {template.is_mandatory && (
                            <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-200">
                              Obbligatoria
                            </Badge>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="p-3 pt-0">
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {template.purpose_template}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>

          <div className="border-l pl-4">
            <h3 className="font-semibold text-sm text-muted-foreground mb-2">
              Anteprima
            </h3>
            <ScrollArea className="h-[55vh]">
              {selectedTemplate ? (
                <div className="space-y-4 pr-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      {getCategoryIcon(selectedTemplate.category)}
                      <h4 className="font-semibold">{selectedTemplate.procedure_name || selectedTemplate.name}</h4>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {selectedTemplate.purpose_template}
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <h5 className="text-sm font-medium mb-1">Ambito:</h5>
                      <p className="text-sm text-muted-foreground">{selectedTemplate.scope_template}</p>
                    </div>

                    {selectedTemplate.frequency && (
                      <div>
                        <h5 className="text-sm font-medium mb-1">Frequenza:</h5>
                        <Badge variant="outline">{selectedTemplate.frequency}</Badge>
                      </div>
                    )}

                    {selectedTemplate.iso_reference && selectedTemplate.iso_reference.length > 0 && (
                      <div>
                        <h5 className="text-sm font-medium mb-1">Controlli ISO 27001:</h5>
                        <div className="flex flex-wrap gap-1">
                          {selectedTemplate.iso_reference.map((ref) => (
                            <Badge key={ref} variant="secondary" className="text-xs">
                              {ref}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {selectedTemplate.tools_required && (
                      <div>
                        <h5 className="text-sm font-medium mb-1">Strumenti Richiesti:</h5>
                        <p className="text-sm text-muted-foreground">{selectedTemplate.tools_required}</p>
                      </div>
                    )}

                    <div>
                      <h5 className="text-sm font-medium mb-1">Step Procedura:</h5>
                      <div className="text-sm text-muted-foreground whitespace-pre-wrap bg-muted/50 p-3 rounded-md max-h-40 overflow-y-auto">
                        {selectedTemplate.steps_template?.substring(0, 800)}...
                      </div>
                    </div>
                  </div>

                  <Button onClick={handleUseTemplate} className="w-full mt-4">
                    <Sparkles className="h-4 w-4 mr-2" />
                    Usa Questo Template
                  </Button>
                </div>
              ) : (
                <div className="flex items-center justify-center h-40">
                  <p className="text-muted-foreground text-sm">
                    Seleziona un template per vedere l'anteprima
                  </p>
                </div>
              )}
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
