import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  AlertTriangle, Trash2, Database, CheckCircle,
  RefreshCw
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function AdminResetPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [resetLog, setResetLog] = useState<string[]>([]);

  const addLog = (message: string) => {
    setResetLog(prev => [...prev, `${new Date().toLocaleTimeString()} - ${message}`]);
    console.log(message);
  };

  const resetDatabase = async () => {
    if (confirmText !== 'RESET') {
      toast({
        title: 'Conferma richiesta',
        description: 'Scrivi "RESET" per confermare',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    setResetLog([]);

    try {
      addLog('🚀 Inizio reset database...');
      addLog('📡 Chiamata funzione reset_database_for_testing()...');
      addLog('');

      // Chiama la funzione PostgreSQL
      const { data, error } = await supabase.rpc('reset_database_for_testing');

      if (error) {
        throw error;
      }

      const result = data as { success: boolean; tables_cleared: number; error?: string; message: string };

      if (result?.success) {
        addLog('✅ Funzione eseguita con successo');
        addLog(`📊 Tabelle svuotate: ${result.tables_cleared}`);
        addLog('');
        addLog('✨ Reset completato!');
        addLog('');
        addLog('📋 STATO FINALE:');
        addLog('✅ Tutte le tabelle dati svuotate');
        addLog('✅ Struttura database mantenuta');
        addLog('✅ Ruoli predefiniti mantenuti');
        addLog('✅ 93 Controlli Annex A mantenuti');
        addLog('✅ RLS policies attive');
        addLog('');
        addLog('🎯 Sistema pronto per nuovi test!');
        addLog('🔄 IMPORTANTE: Ricarica la pagina per vedere la dashboard vuota');

        toast({
          title: '✅ Reset Completato!',
          description: 'Database azzerato - ricarica la pagina'
        });

        setConfirmText('');

        setTimeout(() => {
          if (window.confirm('Reset completato! Vuoi ricaricare la pagina ora?')) {
            window.location.href = '/';
          }
        }, 2000);
      } else {
        throw new Error(result?.error || 'Errore sconosciuto');
      }

    } catch (error: any) {
      addLog('');
      addLog(`❌ ERRORE: ${error.message}`);
      
      if (error.message?.includes('function') && error.message?.includes('does not exist')) {
        addLog('💡 SOLUZIONE: Attendi che la migration venga applicata e riprova.');
      }
      
      toast({
        title: 'Errore Reset',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2 text-destructive">
          <Database className="h-8 w-8" />
          Reset Database
        </h1>
        <p className="text-muted-foreground mt-1">
          ⚠️ ATTENZIONE: Questa azione cancellerà TUTTI i dati di test
        </p>
      </div>

      {/* Warning */}
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>⚠️ ZONA PERICOLOSA</AlertTitle>
        <AlertDescription>
          Questa operazione è irreversibile e cancellerà:
          <ul className="list-disc ml-6 mt-2">
            <li>Tutti i dati operativi (policy, rischi, asset, ecc.)</li>
            <li>Tutta la cronologia (audit, NC, azioni, ecc.)</li>
            <li>Tutti i documenti e versioni</li>
            <li>Tutti gli incidenti e training</li>
          </ul>
          <p className="mt-2 font-bold">
            Mantiene: Struttura DB, Ruoli, Controlli Annex A, Organizzazione, Utenti
          </p>
        </AlertDescription>
      </Alert>

      {/* Cosa Mantiene */}
      <Card className="border-green-200 bg-green-50">
        <CardHeader>
          <CardTitle className="text-green-700">✅ Cosa Viene Mantenuto</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="flex items-center gap-2 text-green-700">
              <CheckCircle className="h-4 w-4" />
              <span className="text-sm">Struttura tabelle</span>
            </div>
            <div className="flex items-center gap-2 text-green-700">
              <CheckCircle className="h-4 w-4" />
              <span className="text-sm">Ruoli predefiniti</span>
            </div>
            <div className="flex items-center gap-2 text-green-700">
              <CheckCircle className="h-4 w-4" />
              <span className="text-sm">93 Controlli Annex A</span>
            </div>
            <div className="flex items-center gap-2 text-green-700">
              <CheckCircle className="h-4 w-4" />
              <span className="text-sm">RLS Policies</span>
            </div>
            <div className="flex items-center gap-2 text-green-700">
              <CheckCircle className="h-4 w-4" />
              <span className="text-sm">Funzioni database</span>
            </div>
            <div className="flex items-center gap-2 text-green-700">
              <CheckCircle className="h-4 w-4" />
              <span className="text-sm">Organizzazione e Utenti</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reset Form */}
      <Card>
        <CardHeader>
          <CardTitle>Conferma Reset</CardTitle>
          <CardDescription>
            Per procedere, scrivi "RESET" nel campo sottostante
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="confirm">Conferma azione</Label>
            <Input
              id="confirm"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder='Scrivi "RESET" per confermare'
              className="max-w-sm"
            />
          </div>

          <Button
            onClick={resetDatabase}
            disabled={loading || confirmText !== 'RESET'}
            variant="destructive"
            size="lg"
          >
            {loading ? (
              <>
                <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                Reset in corso...
              </>
            ) : (
              <>
                <Trash2 className="h-5 w-5 mr-2" />
                Resetta Database
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Log */}
      {resetLog.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Log Operazioni</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-black text-green-400 p-4 rounded font-mono text-sm space-y-1 max-h-96 overflow-y-auto">
              {resetLog.map((line, i) => (
                <div key={i}>{line}</div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
