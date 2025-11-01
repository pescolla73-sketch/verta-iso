import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileText, CheckCircle, AlertTriangle, Sparkles } from "lucide-react";
import { POLICY_TEMPLATES, EMPTY_POLICY_TEMPLATE, PolicyTemplate } from "@/data/policyTemplates";
import { useState } from "react";

interface PolicyTemplateLibraryProps {
  onSelectTemplate: (template: PolicyTemplate) => void;
  onClose: () => void;
}

export const PolicyTemplateLibrary = ({ onSelectTemplate, onClose }: PolicyTemplateLibraryProps) => {
  const [selectedTab, setSelectedTab] = useState<'mandatory' | 'recommended' | 'custom'>('mandatory');

  const mandatoryTemplates = POLICY_TEMPLATES.filter(t => t.category === 'mandatory');
  const recommendedTemplates = POLICY_TEMPLATES.filter(t => t.category === 'recommended');

  const renderTemplateCard = (template: PolicyTemplate) => (
    <Card 
      key={template.id} 
      className="hover:border-primary transition-colors cursor-pointer"
      onClick={() => onSelectTemplate(template)}
    >
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4" />
              {template.name}
            </CardTitle>
            <CardDescription className="mt-2">{template.description}</CardDescription>
          </div>
          {template.category === 'mandatory' && (
            <Badge variant="destructive" className="ml-2">
              <AlertTriangle className="h-3 w-3 mr-1" />
              Obbligatoria
            </Badge>
          )}
          {template.category === 'recommended' && (
            <Badge variant="default" className="ml-2">
              <CheckCircle className="h-3 w-3 mr-1" />
              Raccomandata
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {template.iso_reference.map((ref) => (
            <Badge key={ref} variant="outline" className="text-xs">
              ISO 27001:{ref}
            </Badge>
          ))}
          {template.nis2_reference?.map((ref) => (
            <Badge key={ref} variant="outline" className="text-xs bg-blue-50 dark:bg-blue-950">
              NIS2 {ref}
            </Badge>
          ))}
        </div>
        <Button className="w-full mt-4" size="sm">
          Usa Template
        </Button>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Libreria Template Policy</h2>
          <p className="text-muted-foreground">
            Seleziona un template per iniziare o crea una policy personalizzata
          </p>
        </div>
        <Button variant="ghost" onClick={onClose}>Chiudi</Button>
      </div>

      <Tabs value={selectedTab} onValueChange={(v) => setSelectedTab(v as any)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="mandatory" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Obbligatorie ISO ({mandatoryTemplates.length})
          </TabsTrigger>
          <TabsTrigger value="recommended" className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Raccomandate NIS2 ({recommendedTemplates.length})
          </TabsTrigger>
          <TabsTrigger value="custom" className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            Personalizzata
          </TabsTrigger>
        </TabsList>

        <TabsContent value="mandatory" className="mt-4">
          <ScrollArea className="h-[600px] pr-4">
            <div className="grid gap-4 md:grid-cols-2">
              {mandatoryTemplates.map(renderTemplateCard)}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="recommended" className="mt-4">
          <ScrollArea className="h-[600px] pr-4">
            <div className="grid gap-4 md:grid-cols-2">
              {recommendedTemplates.map(renderTemplateCard)}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="custom" className="mt-4">
          <div className="grid gap-4">
            <Card 
              className="hover:border-primary transition-colors cursor-pointer"
              onClick={() => onSelectTemplate(EMPTY_POLICY_TEMPLATE)}
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  Crea Policy da Zero
                </CardTitle>
                <CardDescription>
                  Inizia con un template vuoto e crea una policy completamente personalizzata
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full">
                  Inizia da Zero
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
