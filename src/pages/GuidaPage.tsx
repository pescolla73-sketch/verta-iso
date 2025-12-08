import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { 
  BookOpen, Search, HelpCircle, Lightbulb, 
  Target, Shield, FileText, AlertTriangle,
  Package, CheckCircle, TrendingUp, Award,
  PlayCircle, Sparkles
} from 'lucide-react';

export default function GuidaPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const categories = [
    {
      id: 'introduzione',
      title: 'Introduzione',
      icon: BookOpen,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      articles: [
        { title: "Cos'è ISO 27001", path: '/guida/intro-iso27001' },
        { title: 'Perché Certificarsi', path: '/guida/perche-certificarsi' },
        { title: 'Percorso Certificazione', path: '/guida/percorso' },
        { title: 'Ruoli e Responsabilità', path: '/guida/ruoli' }
      ]
    },
    {
      id: 'setup',
      title: 'Setup Iniziale',
      icon: Target,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
      articles: [
        { title: "Definire l'Ambito ISMS", path: '/guida/ambito' },
        { title: 'Analisi del Contesto', path: '/guida/contesto' },
        { title: 'Identificare Stakeholder', path: '/guida/stakeholder' },
        { title: 'Policy di Sicurezza', path: '/guida/policy-base' }
      ]
    },
    {
      id: 'risks',
      title: 'Risk Assessment',
      icon: AlertTriangle,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200',
      articles: [
        { title: 'Guida Risk Assessment', path: '/guida/risk-assessment' },
        { title: 'Come Valutare Probabilità', path: '/guida/probabilita' },
        { title: 'Come Valutare Impatto', path: '/guida/impatto' },
        { title: 'Trattamenti del Rischio', path: '/guida/trattamenti' },
        { title: 'Rischi Comuni IT', path: '/guida/rischi-comuni' }
      ]
    },
    {
      id: 'controls',
      title: 'Controlli Annex A',
      icon: Shield,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      articles: [
        { title: 'I 93 Controlli Spiegati', path: '/guida/93-controlli' },
        { title: 'Controlli Obbligatori', path: '/guida/controlli-obbligatori' },
        { title: 'Come Implementare Controlli', path: '/guida/implementazione' },
        { title: 'Documentare Evidenze', path: '/guida/evidenze' }
      ]
    },
    {
      id: 'docs',
      title: 'Documentazione',
      icon: FileText,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      borderColor: 'border-indigo-200',
      articles: [
        { title: 'Documenti Obbligatori', path: '/guida/documenti-obbligatori' },
        { title: 'Scrivere Policy', path: '/guida/scrivere-policy' },
        { title: 'Scrivere Procedure', path: '/guida/scrivere-procedure' },
        { title: 'Statement of Applicability', path: '/guida/soa' }
      ]
    },
    {
      id: 'audit',
      title: 'Audit e Certificazione',
      icon: Award,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
      articles: [
        { title: 'Preparare Audit Interno', path: '/guida/audit-interno' },
        { title: 'Gestire Non Conformità', path: '/guida/nc' },
        { title: 'Management Review', path: '/guida/management-review' },
        { title: 'Audit di Certificazione', path: '/guida/audit-certificazione' }
      ]
    }
  ];

  const faqs = [
    {
      question: 'Quanto tempo serve per certificarsi ISO 27001?',
      answer: 'In media 6-12 mesi, dipende da: dimensione azienda, maturità sicurezza attuale, risorse dedicate. Piccole aziende con buone basi possono certificarsi in 4-6 mesi.'
    },
    {
      question: 'Quali documenti sono obbligatori?',
      answer: 'Documenti obbligatori ISO 27001:\n• Policy sicurezza informazioni\n• Ambito ISMS\n• Risk assessment e trattamento rischi\n• Statement of Applicability (SoA)\n• Obiettivi sicurezza\n• Evidenze competenze e formazione\n• Risultati monitoraggio e audit\n• Non conformità e azioni correttive'
    },
    {
      question: 'Devo implementare tutti i 93 controlli?',
      answer: "No. Devi valutare ogni controllo e decidere se è applicabile al tuo contesto. Nel SoA documenti quali includi (con giustificazione) e quali escludi (con motivazione). In media si implementano 60-80 controlli."
    },
    {
      question: 'Posso certificarmi se sono in cloud?',
      answer: "Sì! Molte aziende cloud-only ottengono ISO 27001. Alcuni controlli fisici (es. datacenter) saranno \"non applicabili\" e coprirai con certificazioni del cloud provider (es. AWS, Azure, Google Cloud hanno ISO 27001)."
    },
    {
      question: 'Quanto costa la certificazione?',
      answer: 'Costi principali:\n• Ente certificatore: 3.000-15.000€ (dipende da dimensioni)\n• Consulenza (opzionale): 5.000-30.000€\n• Tools e software: 0-5.000€\n• Tempo interno personale\n• Certificato valido 3 anni con audit annuali'
    },
    {
      question: "Cosa succede se non passo l'audit?",
      answer: "L'auditor rileverà \"non conformità\" (NC). Hai tempo per correggerle (30-90 giorni). Dopo la correzione, l'auditor verifica e se ok rilascia certificato. È normale avere qualche NC minore al primo audit."
    },
    {
      question: 'Devo avere un CISO dedicato?',
      answer: "Non obbligatorio. Serve qualcuno che gestisce l'ISMS (può essere part-time o multi-ruolo). Per piccole aziende, anche il titolare o responsabile IT può ricoprire il ruolo con formazione adeguata."
    },
    {
      question: 'ISO 27001 copre anche GDPR?',
      answer: "ISO 27001 e GDPR si complementano. ISO 27001 è più ampio (tutta la sicurezza informazioni), GDPR specifico per dati personali. Avere ISO 27001 aiuta molto per conformità GDPR, ma non sostituisce completamente."
    }
  ];

  const glossary = [
    { term: 'ISMS', definition: 'Information Security Management System - Sistema di Gestione della Sicurezza delle Informazioni' },
    { term: 'Asset', definition: "Qualsiasi risorsa di valore per l'organizzazione (dati, sistemi, persone, edifici)" },
    { term: 'Rischio', definition: "Combinazione di probabilità che una minaccia sfrutti una vulnerabilità e l'impatto risultante" },
    { term: 'Controllo', definition: 'Misura che modifica o riduce il rischio (tecnica, organizzativa o fisica)' },
    { term: 'SoA', definition: 'Statement of Applicability - Documento che dichiara quali controlli Annex A si applicano' },
    { term: 'Non Conformità (NC)', definition: 'Mancato rispetto di un requisito ISO 27001 o di una policy interna' },
    { term: 'Audit', definition: "Verifica sistematica e indipendente dell'efficacia dell'ISMS" },
    { term: 'Trattamento Rischio', definition: 'Azione per gestire il rischio: mitigare, trasferire, evitare o accettare' },
    { term: 'Confidenzialità', definition: "Proprietà che l'informazione non sia resa disponibile o divulgata a persone non autorizzate" },
    { term: 'Integrità', definition: "Proprietà di accuratezza e completezza dell'informazione" },
    { term: 'Disponibilità', definition: 'Proprietà di essere accessibile e utilizzabile su richiesta da entità autorizzata' },
    { term: 'CIA Triad', definition: 'Confidenzialità, Integrità, Disponibilità - i tre pilastri della sicurezza informazioni' }
  ];

  const quickTips = [
    { icon: Target, tip: 'Inizia con ambito piccolo e realistico, espandi dopo', bgColor: 'bg-blue-50', borderColor: 'border-blue-200', iconColor: 'text-blue-600' },
    { icon: FileText, tip: 'Documenta mentre implementi, non alla fine', bgColor: 'bg-purple-50', borderColor: 'border-purple-200', iconColor: 'text-purple-600' },
    { icon: AlertTriangle, tip: 'Focus sui rischi reali, non teorici', bgColor: 'bg-orange-50', borderColor: 'border-orange-200', iconColor: 'text-orange-600' },
    { icon: Shield, tip: 'Meglio pochi controlli efficaci che molti sulla carta', bgColor: 'bg-green-50', borderColor: 'border-green-200', iconColor: 'text-green-600' },
    { icon: TrendingUp, tip: 'Coinvolgi tutto il team, non solo IT', bgColor: 'bg-indigo-50', borderColor: 'border-indigo-200', iconColor: 'text-indigo-600' },
    { icon: Award, tip: 'Audit interno prima di quello di certificazione', bgColor: 'bg-yellow-50', borderColor: 'border-yellow-200', iconColor: 'text-yellow-600' }
  ];

  const filteredCategories = categories.map(cat => ({
    ...cat,
    articles: cat.articles.filter(article =>
      article.title.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(cat => cat.articles.length > 0 || searchQuery === '');

  return (
    <div className="container mx-auto p-6 space-y-6">
      
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <BookOpen className="h-8 w-8 text-indigo-600" />
          📖 Guida ISO 27001
        </h1>
        <p className="text-muted-foreground mt-1">
          Tutto quello che serve per certificarsi
        </p>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Cerca nella guida... (es. 'risk assessment', 'controlli')"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 text-lg"
            />
          </div>
        </CardContent>
      </Card>

      {/* Quick Tips */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {quickTips.map((tip, i) => {
          const Icon = tip.icon;
          return (
            <Card key={i} className={`${tip.borderColor} ${tip.bgColor} border`}>
              <CardContent className="pt-4 flex items-start gap-3">
                <Icon className={`h-5 w-5 ${tip.iconColor} flex-shrink-0 mt-0.5`} />
                <p className="text-sm font-medium text-foreground">{tip.tip}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="categorie" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="categorie">
            <BookOpen className="h-4 w-4 mr-2" />
            Guide per Argomento
          </TabsTrigger>
          <TabsTrigger value="faq">
            <HelpCircle className="h-4 w-4 mr-2" />
            FAQ
          </TabsTrigger>
          <TabsTrigger value="glossario">
            <Sparkles className="h-4 w-4 mr-2" />
            Glossario
          </TabsTrigger>
        </TabsList>

        {/* Categorie */}
        <TabsContent value="categorie" className="space-y-4">
          {filteredCategories.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground">
                Nessun risultato per "{searchQuery}"
              </CardContent>
            </Card>
          ) : (
            filteredCategories.map(category => {
              const Icon = category.icon;
              return (
                <Card key={category.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Icon className={`h-5 w-5 ${category.color}`} />
                      {category.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {category.articles.map((article, i) => (
                        <button
                          key={i}
                          onClick={() => navigate(article.path)}
                          className="text-left p-3 rounded-lg border hover:border-indigo-300 hover:bg-indigo-50 transition-all"
                        >
                          <div className="flex items-center gap-2">
                            <PlayCircle className="h-4 w-4 text-indigo-600" />
                            <span className="font-medium text-foreground">{article.title}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </TabsContent>

        {/* FAQ */}
        <TabsContent value="faq">
          <Card>
            <CardHeader>
              <CardTitle>Domande Frequenti</CardTitle>
              <CardDescription>Le risposte alle domande più comuni</CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                {faqs.map((faq, i) => (
                  <AccordionItem key={i} value={`faq-${i}`}>
                    <AccordionTrigger className="text-left">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground whitespace-pre-line">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Glossario */}
        <TabsContent value="glossario">
          <Card>
            <CardHeader>
              <CardTitle>Glossario ISO 27001</CardTitle>
              <CardDescription>Termini tecnici spiegati in modo semplice</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {glossary.map((item, i) => (
                  <div key={i} className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex items-start gap-3">
                      <Badge variant="outline" className="mt-0.5">{item.term}</Badge>
                      <p className="text-sm text-muted-foreground flex-1">
                        {item.definition}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
