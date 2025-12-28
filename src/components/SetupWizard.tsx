import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowRight, ArrowLeft, CheckCircle, Building2, 
  MapPin, Users, Database, Shield, FileText 
} from 'lucide-react';

export interface WizardData {
  companyName: string;
  industry: string;
  employeeCount: string;
  locations: string[];
  hasMultipleSites: boolean;
  hasInternational: boolean;
  dataTypes: string[];
  hasPersonalData: boolean;
  hasHealthData: boolean;
  hasFinancialData: boolean;
  hasIPData: boolean;
  infrastructure: string[];
  hasOnPremise: boolean;
  hasCloud: boolean;
  cloudProviders: string[];
  hasDevelopment: boolean;
  hasCriticalSuppliers: boolean;
  criticalSuppliers: string;
  hasOutsourcing: boolean;
  outsourcingServices: string;
  certificationGoals: string[];
  businessDrivers: string;
}

export interface GeneratedDocuments {
  scope: string;
  context: string;
  objectives: string;
}

export interface SmartRiskSuggestion {
  template_id: string;
  risk_name: string;
  relevance_score: number;
  reason: string;
}

interface SetupWizardProps {
  onComplete: (data: WizardData, generatedDocuments: GeneratedDocuments, smartSuggestions: SmartRiskSuggestion[]) => void;
  onCancel: () => void;
}

export function SetupWizard({ onComplete, onCancel }: SetupWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 6;
  
  const [wizardData, setWizardData] = useState<WizardData>({
    companyName: '',
    industry: '',
    employeeCount: '',
    locations: [],
    hasMultipleSites: false,
    hasInternational: false,
    dataTypes: [],
    hasPersonalData: false,
    hasHealthData: false,
    hasFinancialData: false,
    hasIPData: false,
    infrastructure: [],
    hasOnPremise: false,
    hasCloud: false,
    cloudProviders: [],
    hasDevelopment: false,
    hasCriticalSuppliers: false,
    criticalSuppliers: '',
    hasOutsourcing: false,
    outsourcingServices: '',
    certificationGoals: [],
    businessDrivers: ''
  });

  const updateData = (field: string, value: any) => {
    setWizardData(prev => ({ ...prev, [field]: value }));
  };

  const toggleArrayItem = (field: keyof WizardData, item: string) => {
    const currentArray = wizardData[field] as string[];
    if (currentArray.includes(item)) {
      updateData(field, currentArray.filter(i => i !== item));
    } else {
      updateData(field, [...currentArray, item]);
    }
  };

  const generateDocuments = (): GeneratedDocuments => {
    const scopeParts = [];
    
    scopeParts.push(`L'ambito del Sistema di Gestione della Sicurezza delle Informazioni (ISMS) di ${wizardData.companyName || 'l\'organizzazione'} copre:`);
    
    if (wizardData.hasMultipleSites) {
      scopeParts.push(`\n• Tutte le sedi operative in ${wizardData.hasInternational ? 'Italia e all\'estero' : 'Italia'}`);
    } else {
      scopeParts.push(`\n• La sede unica di ${wizardData.locations[0] || '[Città]'}`);
    }
    
    const dataTypesList = [];
    if (wizardData.hasPersonalData) dataTypesList.push('dati personali');
    if (wizardData.hasHealthData) dataTypesList.push('dati sanitari');
    if (wizardData.hasFinancialData) dataTypesList.push('dati finanziari');
    if (wizardData.hasIPData) dataTypesList.push('proprietà intellettuale');
    
    if (dataTypesList.length > 0) {
      scopeParts.push(`\n• Il trattamento di: ${dataTypesList.join(', ')}`);
    }
    
    const infraList = [];
    if (wizardData.hasOnPremise) infraList.push('infrastruttura on-premise');
    if (wizardData.hasCloud) {
      const providers = wizardData.cloudProviders.length > 0 
        ? ` (${wizardData.cloudProviders.join(', ')})` 
        : '';
      infraList.push(`servizi cloud${providers}`);
    }
    
    if (infraList.length > 0) {
      scopeParts.push(`\n• ${infraList.join(' e ')}`);
    }
    
    scopeParts.push(`\n• ${wizardData.employeeCount || '[N]'} dipendenti e collaboratori`);
    
    const scope = scopeParts.join('');
    
    const contextParts = [];
    
    contextParts.push('FATTORI ESTERNI:\n');
    contextParts.push(`• Settore: ${wizardData.industry || '[Settore]'}\n`);
    
    if (wizardData.hasPersonalData) {
      contextParts.push('• Conformità GDPR obbligatoria per trattamento dati personali\n');
    }
    
    if (wizardData.hasCriticalSuppliers) {
      contextParts.push('• Dipendenza da fornitori critici per la continuità operativa\n');
    }
    
    contextParts.push('\nFATTORI INTERNI:\n');
    contextParts.push(`• Dimensione organizzativa: ${wizardData.employeeCount || '[N]'} persone\n`);
    
    if (wizardData.hasCloud) {
      contextParts.push('• Dipendenza da provider cloud per servizi critici\n');
    }
    
    if (wizardData.hasDevelopment) {
      contextParts.push('• Sviluppo software interno richiede controlli su SDLC\n');
    }
    
    const context = contextParts.join('');
    
    const objectivesParts = [];
    objectivesParts.push('Gli obiettivi del ISMS sono:\n\n');
    
    wizardData.certificationGoals.forEach(goal => {
      switch(goal) {
        case 'compliance':
          objectivesParts.push('• Garantire conformità a normative e regolamenti (GDPR, NIS2, ecc.)\n');
          break;
        case 'customer':
          objectivesParts.push('• Rispondere a requisiti contrattuali dei clienti\n');
          break;
        case 'reputation':
          objectivesParts.push('• Rafforzare la reputazione aziendale e la fiducia del mercato\n');
          break;
        case 'risk':
          objectivesParts.push('• Ridurre i rischi cyber e proteggere asset informativi critici\n');
          break;
        case 'growth':
          objectivesParts.push('• Abilitare crescita business e accesso a nuovi mercati\n');
          break;
      }
    });
    
    if (wizardData.businessDrivers) {
      objectivesParts.push(`\n${wizardData.businessDrivers}`);
    }
    
    const objectives = objectivesParts.join('');
    
    return { scope, context, objectives };
  };

  const getSmartRiskSuggestions = async (): Promise<SmartRiskSuggestion[]> => {
    try {
      // Map industry to expected format
      const industryMap: Record<string, string> = {
        'IT / Software / Tech': 'tech',
        'Finanza / Assicurazioni': 'finance',
        'Sanità / Farmaceutico': 'health',
        'Manifatturiero / Industria': 'manufacturing',
        'Servizi professionali': 'services',
        'Altro': 'other'
      };

      // Map employee count
      const employeeMap: Record<string, string> = {
        '1-10 persone': '1-10',
        '11-50 persone': '11-50',
        '51-250 persone': '51-250',
        '251-1000 persone': '251-1000',
        'Più di 1000 persone': '1000+'
      };

      const { data, error } = await supabase.rpc('get_recommended_risk_templates', {
        p_locations: wizardData.locations.filter(l => l.trim() !== ''),
        p_industry: industryMap[wizardData.industry] || 'other',
        p_has_cloud: wizardData.hasCloud,
        p_has_onpremise: wizardData.hasOnPremise,
        p_has_development: wizardData.hasDevelopment,
        p_has_personal_data: wizardData.hasPersonalData,
        p_has_health_data: wizardData.hasHealthData,
        p_has_financial_data: wizardData.hasFinancialData,
        p_employee_count: employeeMap[wizardData.employeeCount] || '1-10'
      });

      if (error) {
        console.error('Error getting smart suggestions:', error);
        return [];
      }

      // Deduplicate by template_id, keeping highest relevance_score
      const uniqueSuggestions = new Map<string, SmartRiskSuggestion>();
      (data || []).forEach((item: SmartRiskSuggestion) => {
        const existing = uniqueSuggestions.get(item.template_id);
        if (!existing || item.relevance_score > existing.relevance_score) {
          uniqueSuggestions.set(item.template_id, item);
        }
      });

      return Array.from(uniqueSuggestions.values());
    } catch (error) {
      console.error('Error getting smart suggestions:', error);
      return [];
    }
  };

  const handleComplete = async () => {
    const documents = generateDocuments();
    const smartSuggestions = await getSmartRiskSuggestions();
    onComplete(wizardData, documents, smartSuggestions);
  };

  const canProceed = () => {
    switch(currentStep) {
      case 1:
        return wizardData.companyName && wizardData.industry && wizardData.employeeCount;
      case 2:
        return wizardData.locations.length > 0 || !wizardData.hasMultipleSites;
      case 3:
        return wizardData.dataTypes.length > 0 || wizardData.hasPersonalData || wizardData.hasHealthData || wizardData.hasFinancialData || wizardData.hasIPData;
      case 4:
        return wizardData.infrastructure.length > 0 || wizardData.hasOnPremise || wizardData.hasCloud;
      case 5:
        return true;
      case 6:
        return wizardData.certificationGoals.length > 0;
      default:
        return true;
    }
  };

  const progressPercentage = (currentStep / totalSteps) * 100;

  return (
    <div className="space-y-6">
      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="text-lg">🧭</span>
            <span className="font-semibold text-foreground">Configurazione Guidata ISMS</span>
          </div>
          <Badge variant="secondary">
            Step {currentStep} di {totalSteps}
          </Badge>
        </div>
        <Progress value={progressPercentage} className="h-2" />
      </div>

      {/* Step Content */}
      <Card>
        <CardHeader>
          {currentStep === 1 && (
            <>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                Parlaci della tua azienda
              </CardTitle>
              <CardDescription>
                Informazioni base sulla tua organizzazione
              </CardDescription>
            </>
          )}
          
          {currentStep === 2 && (
            <>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                Dove operate?
              </CardTitle>
              <CardDescription>
                Sedi e ubicazioni dell'organizzazione
              </CardDescription>
            </>
          )}
          
          {currentStep === 3 && (
            <>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5 text-primary" />
                Che dati trattate?
              </CardTitle>
              <CardDescription>
                Tipologie di informazioni gestite
              </CardDescription>
            </>
          )}
          
          {currentStep === 4 && (
            <>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                Che sistemi usate?
              </CardTitle>
              <CardDescription>
                Infrastruttura IT e tecnologie
              </CardDescription>
            </>
          )}
          
          {currentStep === 5 && (
            <>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Fornitori e partner
              </CardTitle>
              <CardDescription>
                Dipendenze esterne critiche (opzionale)
              </CardDescription>
            </>
          )}
          
          {currentStep === 6 && (
            <>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Perché volete certificarvi?
              </CardTitle>
              <CardDescription>
                Obiettivi e motivazioni
              </CardDescription>
            </>
          )}
        </CardHeader>
        
        <CardContent>
          {/* STEP 1: Informazioni Base */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="companyName">Nome azienda *</Label>
                <Input
                  id="companyName"
                  value={wizardData.companyName}
                  onChange={(e) => updateData('companyName', e.target.value)}
                  placeholder="Es: Acme SRL"
                />
              </div>

              <div className="space-y-2">
                <Label>In che settore operate? *</Label>
                <RadioGroup
                  value={wizardData.industry}
                  onValueChange={(value) => updateData('industry', value)}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="IT / Software / Tech" id="it" />
                    <Label htmlFor="it" className="font-normal">IT / Software / Tech</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Finanza / Assicurazioni" id="finance" />
                    <Label htmlFor="finance" className="font-normal">Finanza / Assicurazioni</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Sanità / Farmaceutico" id="health" />
                    <Label htmlFor="health" className="font-normal">Sanità / Farmaceutico</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Manifatturiero / Industria" id="manufacturing" />
                    <Label htmlFor="manufacturing" className="font-normal">Manifatturiero / Industria</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Servizi professionali" id="services" />
                    <Label htmlFor="services" className="font-normal">Servizi professionali</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Altro" id="other" />
                    <Label htmlFor="other" className="font-normal">Altro</Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-2">
                <Label>Quanti dipendenti avete? *</Label>
                <RadioGroup
                  value={wizardData.employeeCount}
                  onValueChange={(value) => updateData('employeeCount', value)}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="1-10 persone" id="emp-1" />
                    <Label htmlFor="emp-1" className="font-normal">1-10 persone</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="11-50 persone" id="emp-2" />
                    <Label htmlFor="emp-2" className="font-normal">11-50 persone</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="51-250 persone" id="emp-3" />
                    <Label htmlFor="emp-3" className="font-normal">51-250 persone</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="251-1000 persone" id="emp-4" />
                    <Label htmlFor="emp-4" className="font-normal">251-1000 persone</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Più di 1000 persone" id="emp-5" />
                    <Label htmlFor="emp-5" className="font-normal">Più di 1000 persone</Label>
                  </div>
                </RadioGroup>
              </div>
            </div>
          )}

          {/* STEP 2: Ubicazione */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Quante sedi avete? *</Label>
                <RadioGroup
                  value={wizardData.hasMultipleSites ? 'multiple' : 'single'}
                  onValueChange={(value) => updateData('hasMultipleSites', value === 'multiple')}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="single" id="single-site" />
                    <Label htmlFor="single-site" className="font-normal">Una sede unica</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="multiple" id="multiple-sites" />
                    <Label htmlFor="multiple-sites" className="font-normal">Più sedi</Label>
                  </div>
                </RadioGroup>
              </div>

              {!wizardData.hasMultipleSites && (
                <div className="space-y-2">
                  <Label htmlFor="location">In che città? *</Label>
                  <Input
                    id="location"
                    value={wizardData.locations[0] || ''}
                    onChange={(e) => updateData('locations', [e.target.value])}
                    placeholder="Es: Milano"
                  />
                </div>
              )}

              {wizardData.hasMultipleSites && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="locations">Elenca le città principali *</Label>
                    <Textarea
                      id="locations"
                      value={wizardData.locations.join(', ')}
                      onChange={(e) => updateData('locations', e.target.value.split(',').map(s => s.trim()))}
                      placeholder="Es: Milano, Roma, Torino"
                      rows={2}
                    />
                    <p className="text-xs text-muted-foreground">
                      Separa le città con una virgola
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Avete sedi all'estero?</Label>
                    <RadioGroup
                      value={wizardData.hasInternational ? 'yes' : 'no'}
                      onValueChange={(value) => updateData('hasInternational', value === 'yes')}
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="no" id="no-intl" />
                        <Label htmlFor="no-intl" className="font-normal">No, solo Italia</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="yes" id="yes-intl" />
                        <Label htmlFor="yes-intl" className="font-normal">Sì, anche all'estero</Label>
                      </div>
                    </RadioGroup>
                  </div>
                </>
              )}
            </div>
          )}

          {/* STEP 3: Dati */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div className="space-y-3">
                <Label>Che tipo di dati trattate? * (seleziona tutti quelli applicabili)</Label>
                
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="personal"
                      checked={wizardData.hasPersonalData}
                      onCheckedChange={(checked) => {
                        updateData('hasPersonalData', checked);
                        if (checked && !wizardData.dataTypes.includes('personal')) {
                          toggleArrayItem('dataTypes', 'personal');
                        }
                      }}
                    />
                    <Label htmlFor="personal" className="font-normal">
                      Dati personali (nome, email, telefono clienti/dipendenti)
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="health-data"
                      checked={wizardData.hasHealthData}
                      onCheckedChange={(checked) => {
                        updateData('hasHealthData', checked);
                        if (checked && !wizardData.dataTypes.includes('health')) {
                          toggleArrayItem('dataTypes', 'health');
                        }
                      }}
                    />
                    <Label htmlFor="health-data" className="font-normal">
                      Dati sanitari (cartelle cliniche, diagnosi, ecc.)
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="financial"
                      checked={wizardData.hasFinancialData}
                      onCheckedChange={(checked) => {
                        updateData('hasFinancialData', checked);
                        if (checked && !wizardData.dataTypes.includes('financial')) {
                          toggleArrayItem('dataTypes', 'financial');
                        }
                      }}
                    />
                    <Label htmlFor="financial" className="font-normal">
                      Dati finanziari (carte di credito, conti bancari, transazioni)
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="ip"
                      checked={wizardData.hasIPData}
                      onCheckedChange={(checked) => {
                        updateData('hasIPData', checked);
                        if (checked && !wizardData.dataTypes.includes('ip')) {
                          toggleArrayItem('dataTypes', 'ip');
                        }
                      }}
                    />
                    <Label htmlFor="ip" className="font-normal">
                      Proprietà intellettuale (codice sorgente, brevetti, segreti commerciali)
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="business"
                      checked={wizardData.dataTypes.includes('business')}
                      onCheckedChange={() => toggleArrayItem('dataTypes', 'business')}
                    />
                    <Label htmlFor="business" className="font-normal">
                      Dati aziendali generici (documenti, email, report)
                    </Label>
                  </div>
                </div>
              </div>

              {wizardData.hasPersonalData && (
                <div className="bg-blue-50 dark:bg-blue-950/30 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    ℹ️ Trattando dati personali, dovrai garantire conformità al GDPR. 
                    ISO 27001 ti aiuterà con i controlli tecnici e organizzativi richiesti.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* STEP 4: Sistemi */}
          {currentStep === 4 && (
            <div className="space-y-4">
              <div className="space-y-3">
                <Label>Che infrastruttura IT usate? * (seleziona tutti quelli applicabili)</Label>
                
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="onpremise"
                      checked={wizardData.hasOnPremise}
                      onCheckedChange={(checked) => {
                        updateData('hasOnPremise', checked);
                        if (checked && !wizardData.infrastructure.includes('onpremise')) {
                          toggleArrayItem('infrastructure', 'onpremise');
                        }
                      }}
                    />
                    <Label htmlFor="onpremise" className="font-normal">
                      Server on-premise (server fisici nella vostra sede)
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="cloud"
                      checked={wizardData.hasCloud}
                      onCheckedChange={(checked) => {
                        updateData('hasCloud', checked);
                        if (checked && !wizardData.infrastructure.includes('cloud')) {
                          toggleArrayItem('infrastructure', 'cloud');
                        }
                      }}
                    />
                    <Label htmlFor="cloud" className="font-normal">
                      Servizi cloud (AWS, Azure, Google Cloud, SaaS)
                    </Label>
                  </div>

                  {wizardData.hasCloud && (
                    <div className="ml-6 space-y-2">
                      <Label className="text-sm">Quali provider cloud? (opzionale)</Label>
                      <div className="grid grid-cols-2 gap-2">
                        {['AWS', 'Azure', 'Google Cloud', 'Altro'].map(provider => (
                          <div key={provider} className="flex items-center space-x-2">
                            <Checkbox
                              id={provider}
                              checked={wizardData.cloudProviders.includes(provider)}
                              onCheckedChange={() => {
                                const current = wizardData.cloudProviders;
                                if (current.includes(provider)) {
                                  updateData('cloudProviders', current.filter(p => p !== provider));
                                } else {
                                  updateData('cloudProviders', [...current, provider]);
                                }
                              }}
                            />
                            <Label htmlFor={provider} className="font-normal text-sm">
                              {provider}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="development"
                      checked={wizardData.hasDevelopment}
                      onCheckedChange={(checked) => {
                        updateData('hasDevelopment', checked);
                        if (checked && !wizardData.infrastructure.includes('development')) {
                          toggleArrayItem('infrastructure', 'development');
                        }
                      }}
                    />
                    <Label htmlFor="development" className="font-normal">
                      Sviluppate software internamente
                    </Label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: Fornitori (Optional) */}
          {currentStep === 5 && (
            <div className="space-y-4">
              <div className="bg-yellow-50 dark:bg-yellow-950/30 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800 mb-4">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  ℹ️ Questo step è opzionale ma consigliato se dipendete da fornitori critici
                </p>
              </div>

              <div className="space-y-2">
                <Label>Avete fornitori critici per le vostre operazioni?</Label>
                <RadioGroup
                  value={wizardData.hasCriticalSuppliers ? 'yes' : 'no'}
                  onValueChange={(value) => updateData('hasCriticalSuppliers', value === 'yes')}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="no" id="no-suppliers" />
                    <Label htmlFor="no-suppliers" className="font-normal">No</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="yes" id="yes-suppliers" />
                    <Label htmlFor="yes-suppliers" className="font-normal">Sì</Label>
                  </div>
                </RadioGroup>
              </div>

              {wizardData.hasCriticalSuppliers && (
                <div className="space-y-2">
                  <Label htmlFor="suppliers">Quali? (opzionale)</Label>
                  <Textarea
                    id="suppliers"
                    value={wizardData.criticalSuppliers}
                    onChange={(e) => updateData('criticalSuppliers', e.target.value)}
                    placeholder="Es: Provider hosting, Software gestionale, Servizio email"
                    rows={3}
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label>Avete servizi in outsourcing?</Label>
                <RadioGroup
                  value={wizardData.hasOutsourcing ? 'yes' : 'no'}
                  onValueChange={(value) => updateData('hasOutsourcing', value === 'yes')}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="no" id="no-outsourcing" />
                    <Label htmlFor="no-outsourcing" className="font-normal">No</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="yes" id="yes-outsourcing" />
                    <Label htmlFor="yes-outsourcing" className="font-normal">Sì</Label>
                  </div>
                </RadioGroup>
              </div>

              {wizardData.hasOutsourcing && (
                <div className="space-y-2">
                  <Label htmlFor="outsourcing">Quali servizi? (opzionale)</Label>
                  <Textarea
                    id="outsourcing"
                    value={wizardData.outsourcingServices}
                    onChange={(e) => updateData('outsourcingServices', e.target.value)}
                    placeholder="Es: Help desk, Data center, Sviluppo software"
                    rows={3}
                  />
                </div>
              )}
            </div>
          )}

          {/* STEP 6: Obiettivi */}
          {currentStep === 6 && (
            <div className="space-y-4">
              <div className="space-y-3">
                <Label>Perché volete certificarvi ISO 27001? * (seleziona tutti quelli applicabili)</Label>
                
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="compliance"
                      checked={wizardData.certificationGoals.includes('compliance')}
                      onCheckedChange={() => toggleArrayItem('certificationGoals', 'compliance')}
                    />
                    <Label htmlFor="compliance" className="font-normal">
                      Conformità normativa (GDPR, NIS2, settore specifico)
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="customer"
                      checked={wizardData.certificationGoals.includes('customer')}
                      onCheckedChange={() => toggleArrayItem('certificationGoals', 'customer')}
                    />
                    <Label htmlFor="customer" className="font-normal">
                      Richiesta contrattuale di clienti
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="reputation"
                      checked={wizardData.certificationGoals.includes('reputation')}
                      onCheckedChange={() => toggleArrayItem('certificationGoals', 'reputation')}
                    />
                    <Label htmlFor="reputation" className="font-normal">
                      Migliorare reputazione e fiducia del mercato
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="risk"
                      checked={wizardData.certificationGoals.includes('risk')}
                      onCheckedChange={() => toggleArrayItem('certificationGoals', 'risk')}
                    />
                    <Label htmlFor="risk" className="font-normal">
                      Ridurre rischi cyber e proteggere dati critici
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="growth"
                      checked={wizardData.certificationGoals.includes('growth')}
                      onCheckedChange={() => toggleArrayItem('certificationGoals', 'growth')}
                    />
                    <Label htmlFor="growth" className="font-normal">
                      Accedere a nuovi mercati o gare d'appalto
                    </Label>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="drivers">Altri obiettivi o note? (opzionale)</Label>
                <Textarea
                  id="drivers"
                  value={wizardData.businessDrivers}
                  onChange={(e) => updateData('businessDrivers', e.target.value)}
                  placeholder="Descrivi eventuali altri obiettivi specifici..."
                  rows={4}
                />
              </div>

              <div className="bg-green-50 dark:bg-green-950/30 p-4 rounded-lg border border-green-200 dark:border-green-800">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-green-900 dark:text-green-100">Quasi fatto!</p>
                    <p className="text-sm text-green-800 dark:text-green-200 mt-1">
                      Cliccando "Completa", genereremo automaticamente i documenti "Ambito ISMS", 
                      "Contesto Organizzazione" e "Obiettivi Sicurezza" basati sulle tue risposte.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <div>
          {currentStep > 1 && (
            <Button
              variant="outline"
              onClick={() => setCurrentStep(currentStep - 1)}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Indietro
            </Button>
          )}
          {currentStep === 1 && (
            <Button variant="ghost" onClick={onCancel}>
              Annulla
            </Button>
          )}
        </div>

        <div className="flex gap-2">
          {currentStep < totalSteps ? (
            <Button
              onClick={() => setCurrentStep(currentStep + 1)}
              disabled={!canProceed()}
            >
              Avanti
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleComplete}
              disabled={!canProceed()}
              className="bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Completa e Genera Documenti
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
