import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shield, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function SetupRBACSimplePage() {
  const [status, setStatus] = useState<'idle' | 'running' | 'success' | 'error'>('idle');
  const [log, setLog] = useState<string[]>([]);
  const { toast } = useToast();

  const addLog = (message: string) => {
    setLog(prev => [...prev, message]);
    console.log(message);
  };

  const setupRBAC = async () => {
    setStatus('running');
    setLog([]);

    try {
      addLog('🚀 Inizio setup RBAC...');

      // Verifica se la tabella roles esiste già
      addLog('📝 Verifica tabella roles...');
      const { data: existing, error: checkError } = await supabase
        .from('roles' as any)
        .select('id')
        .limit(1);
      
      if (checkError) {
        addLog(`⚠️ Tabella roles non trovata: ${checkError.message}`);
        addLog('❌ Errore: la tabella roles deve essere creata tramite migration');
        throw new Error('Tabella roles non esiste. Eseguire prima la migration del database.');
      }

      addLog('✅ Tabella roles trovata');

      // Inserisci i 7 ruoli predefiniti
      addLog('👥 Inserimento ruoli predefiniti...');
      
      const roles = [
        { role_name: 'Super Admin', role_code: 'SUPER_ADMIN', description: 'Amministratore piattaforma', is_system_role: true },
        { role_name: 'Organization Admin', role_code: 'ORG_ADMIN', description: 'Amministratore organizzazione', is_system_role: true },
        { role_name: 'CISO', role_code: 'CISO', description: 'Responsabile sicurezza', is_system_role: true },
        { role_name: 'Internal Auditor', role_code: 'AUDITOR', description: 'Auditor interno', is_system_role: true },
        { role_name: 'Process Owner', role_code: 'PROCESS_OWNER', description: 'Responsabile processo', is_system_role: true },
        { role_name: 'Employee', role_code: 'EMPLOYEE', description: 'Utente base', is_system_role: true },
        { role_name: 'External Auditor', role_code: 'EXTERNAL_AUDITOR', description: 'Auditor esterno', is_system_role: true }
      ];

      let insertedCount = 0;
      let skippedCount = 0;

      for (const role of roles) {
        const { error } = await supabase
          .from('roles' as any)
          .upsert([role], { onConflict: 'role_code' })
          .select();
        
        if (error) {
          addLog(`⚠️ Errore inserimento ${role.role_name}: ${error.message}`);
        } else {
          insertedCount++;
          addLog(`✅ Ruolo ${role.role_name} inserito/aggiornato`);
        }
      }

      // Verifica ruoli inseriti
      const { data: rolesData, error: rolesCheckError } = await supabase
        .from('roles' as any)
        .select('role_code, role_name')
        .order('role_name');
      
      if (rolesCheckError) {
        throw rolesCheckError;
      }

      addLog(`\n📊 RUOLI NEL SISTEMA: ${rolesData?.length || 0}`);
      (rolesData as any)?.forEach((r: any) => addLog(`   - ${r.role_name} (${r.role_code})`));

      addLog('\n🎉 Setup RBAC completato con successo!');
      setStatus('success');
      
      toast({
        title: 'Setup Completato',
        description: `${insertedCount} ruoli configurati correttamente`
      });

    } catch (error: any) {
      addLog(`\n❌ ERRORE: ${error.message}`);
      setStatus('error');
      
      toast({
        title: 'Errore Setup',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Shield className="h-8 w-8" />
            Setup RBAC Sistema
          </h1>
          <p className="text-muted-foreground">Configurazione iniziale ruoli e permessi</p>
        </div>
        
        <Button 
          onClick={setupRBAC} 
          disabled={status === 'running'}
          size="lg"
        >
          {status === 'running' && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          {status === 'running' ? 'Setup in corso...' : 'Avvia Setup RBAC'}
        </Button>
      </div>

      {log.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {status === 'running' && <Loader2 className="h-5 w-5 animate-spin" />}
              {status === 'success' && <CheckCircle className="h-5 w-5 text-green-600" />}
              {status === 'error' && <XCircle className="h-5 w-5 text-red-600" />}
              Log Esecuzione
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-black text-green-400 p-4 rounded font-mono text-sm space-y-1 max-h-96 overflow-y-auto">
              {log.map((line, i) => (
                <div key={i}>{line}</div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {status === 'success' && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="text-green-700">✅ Setup Completato!</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-green-600">Sistema RBAC configurato correttamente.</p>
            <p className="text-sm text-green-600">
              Prossimi step:
            </p>
            <ol className="text-sm text-green-600 list-decimal list-inside space-y-1">
              <li>Creazione UI gestione utenti</li>
              <li>Implementazione permessi granulari</li>
              <li>Testing accessi</li>
            </ol>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
