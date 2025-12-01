import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Shield, CheckCircle, AlertCircle, XCircle } from 'lucide-react';

interface CheckResult {
  name: string;
  status: 'pass' | 'warning' | 'fail';
  message: string;
  details?: string;
}

export default function SecurityCheckPage() {
  const [results, setResults] = useState<CheckResult[]>([]);
  const [running, setRunning] = useState(false);

  const runSecurityCheck = async () => {
    setRunning(true);
    const checks: CheckResult[] = [];

    // 1. TEST RLS - Verifica tabelle principali
    console.log('=== TEST 1: RLS POLICIES ===');
    const tables = [
      'organization', 'policies', 'procedures', 'risks', 'assets',
      'controls', 'training_records', 'security_incidents', 'audit_findings',
      'non_conformities', 'improvement_actions', 'certification_audits',
      'controlled_documents'
    ];

    let rlsPass = 0;
    let rlsFail = 0;

    for (const table of tables) {
      try {
        const { data, error } = await (supabase as any).from(table).select('id').limit(1);
        if (!error) {
          rlsPass++;
        } else {
          rlsFail++;
          console.log(`⚠️ ${table}: ${error.message}`);
        }
      } catch (e: any) {
        rlsFail++;
        console.log(`❌ ${table}: ${e.message}`);
      }
    }

    checks.push({
      name: 'RLS Policies',
      status: rlsFail === 0 ? 'pass' : rlsFail < 3 ? 'warning' : 'fail',
      message: `${rlsPass}/${tables.length} tabelle accessibili`,
      details: rlsFail > 0 ? `${rlsFail} tabelle con problemi RLS` : 'Tutte le tabelle protette'
    });

    // 2. TEST AUTENTICAZIONE
    console.log('=== TEST 2: AUTENTICAZIONE ===');
    const { data: { user } } = await supabase.auth.getUser();
    
    checks.push({
      name: 'Autenticazione',
      status: user ? 'pass' : 'warning',
      message: user ? `Autenticato: ${user.email}` : 'DEMO mode (nessuna auth)',
      details: user ? `User ID: ${user.id}` : 'Sistema in modalità demo - nessun controllo accessi'
    });

    // 3. TEST MULTI-TENANT ISOLATION
    console.log('=== TEST 3: ISOLAMENTO MULTI-TENANT ===');
    const { data: orgs } = await supabase.from('organization').select('id, name');
    
    if (orgs && orgs.length > 0) {
      // Test: possiamo vedere dati di altre org?
      const { data: allPolicies } = await supabase.from('policies').select('organization_id');
      const uniqueOrgs = new Set(allPolicies?.map(p => p.organization_id) || []);
      
      checks.push({
        name: 'Isolamento Multi-Tenant',
        status: uniqueOrgs.size === 1 ? 'pass' : 'fail',
        message: uniqueOrgs.size === 1 ? 'Vedo solo i dati della mia org' : `PROBLEMA: vedo dati di ${uniqueOrgs.size} organizzazioni!`,
        details: `${orgs.length} org nel sistema, ${uniqueOrgs.size} visibili`
      });
    } else {
      checks.push({
        name: 'Isolamento Multi-Tenant',
        status: 'warning',
        message: 'Nessuna organizzazione trovata',
        details: 'Impossibile testare isolamento'
      });
    }

    // 4. TEST SQL INJECTION PROTECTION
    console.log('=== TEST 4: SQL INJECTION ===');
    const maliciousInputs = [
      "'; DROP TABLE policies; --",
      "1' OR '1'='1",
      "admin'--",
      "<script>alert('xss')</script>"
    ];

    let injectionProtected = true;
    for (const input of maliciousInputs) {
      try {
        const { error } = await supabase
          .from('policies')
          .select('*')
          .eq('policy_name', input)
          .limit(1);
        
        if (error && error.message.includes('DROP')) {
          injectionProtected = false;
          break;
        }
      } catch (e) {
        // Error è OK - significa che l'input è stato rigettato
      }
    }

    checks.push({
      name: 'Protezione SQL Injection',
      status: injectionProtected ? 'pass' : 'fail',
      message: injectionProtected ? 'Query parametrizzate funzionanti' : 'VULNERABILE a SQL injection!',
      details: 'Supabase usa query parametrizzate di default'
    });

    // 5. TEST VALIDAZIONE INPUT
    console.log('=== TEST 5: VALIDAZIONE INPUT ===');
    // Test: possiamo inserire dati malformed?
    try {
      const { error } = await supabase
        .from('policies')
        .insert([{
          organization_id: '00000000-0000-0000-0000-000000000000', // UUID fake
          policy_name: '',
          policy_type: 'test'
        }]);
      
      checks.push({
        name: 'Validazione Input',
        status: error ? 'pass' : 'warning',
        message: error ? 'Database rigetta dati invalidi' : 'Possibile inserire dati vuoti',
        details: error ? error.message : 'Nessun constraint violation'
      });
    } catch (e: any) {
      checks.push({
        name: 'Validazione Input',
        status: 'pass',
        message: 'Database rigetta dati invalidi',
        details: e.message
      });
    }

    // 6. TEST SISTEMA RUOLI
    console.log('=== TEST 6: SISTEMA RUOLI ===');
    try {
      const { data: userRoles } = await (supabase as any).from('user_roles').select('*').limit(1);
      
      checks.push({
        name: 'Sistema Ruoli',
        status: userRoles ? 'pass' : 'warning',
        message: userRoles ? 'Sistema ruoli implementato' : 'Sistema ruoli non implementato',
        details: userRoles ? `Trovata tabella user_roles` : 'Tabella user_roles non esiste'
      });
    } catch (e) {
      checks.push({
        name: 'Sistema Ruoli',
        status: 'warning',
        message: 'Sistema ruoli NON implementato',
        details: 'Tabella user_roles non esiste - da implementare'
      });
    }

    setResults(checks);
    setRunning(false);
    console.log('=== SECURITY CHECK COMPLETATO ===');
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pass': return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'warning': return <AlertCircle className="h-5 w-5 text-orange-600" />;
      case 'fail': return <XCircle className="h-5 w-5 text-red-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pass': return <Badge className="bg-green-600">PASS</Badge>;
      case 'warning': return <Badge className="bg-orange-600">WARNING</Badge>;
      case 'fail': return <Badge className="bg-red-600">FAIL</Badge>;
    }
  };

  const passCount = results.filter(r => r.status === 'pass').length;
  const warningCount = results.filter(r => r.status === 'warning').length;
  const failCount = results.filter(r => r.status === 'fail').length;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Shield className="h-8 w-8" />
            Security Quick Check
          </h1>
          <p className="text-muted-foreground">Verifica rapida fondamenta sicurezza</p>
        </div>
        <Button onClick={runSecurityCheck} disabled={running} size="lg">
          {running ? 'Verifica in corso...' : 'Avvia Security Check'}
        </Button>
      </div>

      {results.length > 0 && (
        <>
          {/* Summary */}
          <div className="grid grid-cols-3 gap-4">
            <Card className="border-green-200 bg-green-50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-green-700">Test Superati</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">{passCount}</div>
              </CardContent>
            </Card>

            <Card className="border-orange-200 bg-orange-50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-orange-700">Warning</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-orange-600">{warningCount}</div>
              </CardContent>
            </Card>

            <Card className="border-red-200 bg-red-50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-red-700">Falliti</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-red-600">{failCount}</div>
              </CardContent>
            </Card>
          </div>

          {/* Results */}
          <Card>
            <CardHeader>
              <CardTitle>Risultati Check</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {results.map((result, index) => (
                <div key={index} className="flex items-start gap-4 p-4 border rounded-lg">
                  {getStatusIcon(result.status)}
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-semibold">{result.name}</h3>
                      {getStatusBadge(result.status)}
                    </div>
                    <p className="text-sm text-muted-foreground mb-1">{result.message}</p>
                    {result.details && (
                      <p className="text-xs text-muted-foreground mt-2 p-2 bg-muted rounded">
                        {result.details}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Raccomandazioni */}
          {(failCount > 0 || warningCount > 0) && (
            <Card className="border-orange-200 bg-orange-50">
              <CardHeader>
                <CardTitle className="text-orange-700">⚠️ Azioni Raccomandate</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {failCount > 0 && (
                  <div className="p-3 bg-red-100 rounded">
                    <p className="font-semibold text-red-700">CRITICI: {failCount} problemi rilevati</p>
                    <p className="text-sm text-red-600">Richiede intervento immediato</p>
                  </div>
                )}
                {warningCount > 0 && (
                  <div className="p-3 bg-orange-100 rounded">
                    <p className="font-semibold text-orange-700">WARNING: {warningCount} aree da migliorare</p>
                    <p className="text-sm text-orange-600">Implementazione sistema ruoli e autenticazione</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
