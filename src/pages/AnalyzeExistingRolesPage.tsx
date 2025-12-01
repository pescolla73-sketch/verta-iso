import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CheckCircle, XCircle, AlertCircle, Search } from 'lucide-react';

interface AnalysisResult {
  hasRolesTable: boolean;
  hasRoleEnum: boolean;
  hasHasRoleFunction: boolean;
  userRolesCount: number;
  users: Array<{
    user_id: string;
    email: string;
    roles: string[];
  }>;
  errors: string[];
}

export default function AnalyzeExistingRolesPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]);
  };

  const analyzeSystem = async () => {
    setLoading(true);
    setLogs([]);
    const analysis: AnalysisResult = {
      hasRolesTable: false,
      hasRoleEnum: false,
      hasHasRoleFunction: false,
      userRolesCount: 0,
      users: [],
      errors: []
    };

    try {
      addLog('🔍 Inizio analisi sistema RBAC...');

      // Check if user_roles table exists
      addLog('📋 Verifica esistenza tabella user_roles...');
      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('*')
        .limit(1);

      if (!rolesError) {
        analysis.hasRolesTable = true;
        addLog('✅ Tabella user_roles trovata');

        // Count user roles
        const { count } = await supabase
          .from('user_roles')
          .select('*', { count: 'exact', head: true });
        analysis.userRolesCount = count || 0;
        addLog(`📊 Trovati ${count} ruoli assegnati`);

        // Get users with their roles
        const { data: usersWithRoles, error: usersError } = await supabase
          .from('user_roles')
          .select('user_id, role');

        if (!usersError && usersWithRoles) {
          // Group roles by user
          const userRolesMap = new Map<string, string[]>();
          usersWithRoles.forEach((ur: any) => {
            const roles = userRolesMap.get(ur.user_id) || [];
            roles.push(ur.role);
            userRolesMap.set(ur.user_id, roles);
          });

          // Get user emails from profiles
          const { data: profiles } = await supabase
            .from('profiles')
            .select('id, email')
            .in('id', Array.from(userRolesMap.keys()));

          if (profiles) {
            analysis.users = profiles.map(p => ({
              user_id: p.id,
              email: p.email || 'N/A',
              roles: userRolesMap.get(p.id) || []
            }));
            addLog(`👥 Trovati ${analysis.users.length} utenti con ruoli`);
          }
        }
      } else {
        analysis.hasRolesTable = false;
        analysis.errors.push('Tabella user_roles non trovata');
        addLog('❌ Tabella user_roles non trovata');
      }

      // Check for enum (we can't directly query it, so we check if insert would work)
      addLog('🔍 Verifica esistenza enum app_role...');
      try {
        // This will fail if enum doesn't exist
        const { error: enumError } = await supabase
          .from('user_roles')
          .select('role')
          .limit(1);
        
        if (!enumError) {
          analysis.hasRoleEnum = true;
          addLog('✅ Enum app_role configurato correttamente');
        }
      } catch (e) {
        analysis.hasRoleEnum = false;
        analysis.errors.push('Enum app_role non trovato');
        addLog('❌ Enum app_role non trovato');
      }

      // Check for has_role function (indirect check)
      addLog('🔍 Verifica funzione has_role...');
      try {
        const { data: functionData, error: functionError } = await supabase.rpc('has_role', {
          _user_id: '00000000-0000-0000-0000-000000000000',
          _role: 'admin'
        });

        if (!functionError || functionError.message.includes('permission denied')) {
          analysis.hasHasRoleFunction = true;
          addLog('✅ Funzione has_role trovata');
        } else {
          analysis.hasHasRoleFunction = false;
          analysis.errors.push('Funzione has_role non trovata');
          addLog('❌ Funzione has_role non trovata');
        }
      } catch (e) {
        analysis.hasHasRoleFunction = false;
        addLog('⚠️ Impossibile verificare funzione has_role');
      }

      addLog('✅ Analisi completata');
      setResult(analysis);
    } catch (error: any) {
      addLog(`❌ Errore durante l'analisi: ${error.message}`);
      analysis.errors.push(error.message);
      setResult(analysis);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Analisi Sistema RBAC</h1>
        <p className="text-muted-foreground">
          Verifica lo stato attuale del sistema di gestione ruoli e permessi
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Analizza Sistema</CardTitle>
          <CardDescription>
            Verifica la presenza di tabelle, enum, funzioni e ruoli assegnati
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={analyzeSystem} disabled={loading}>
            <Search className="w-4 h-4 mr-2" />
            {loading ? 'Analisi in corso...' : 'Avvia Analisi'}
          </Button>

          {result && (
            <div className="space-y-6 mt-6">
              {/* Status Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">Tabella user_roles</p>
                        <p className="text-2xl font-bold">{result.userRolesCount}</p>
                        <p className="text-xs text-muted-foreground">ruoli assegnati</p>
                      </div>
                      {result.hasRolesTable ? (
                        <CheckCircle className="w-8 h-8 text-green-500" />
                      ) : (
                        <XCircle className="w-8 h-8 text-red-500" />
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">Enum app_role</p>
                        <p className="text-xs text-muted-foreground mt-2">
                          {result.hasRoleEnum ? 'Configurato' : 'Non trovato'}
                        </p>
                      </div>
                      {result.hasRoleEnum ? (
                        <CheckCircle className="w-8 h-8 text-green-500" />
                      ) : (
                        <XCircle className="w-8 h-8 text-red-500" />
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">Funzione has_role</p>
                        <p className="text-xs text-muted-foreground mt-2">
                          {result.hasHasRoleFunction ? 'Attiva' : 'Non trovata'}
                        </p>
                      </div>
                      {result.hasHasRoleFunction ? (
                        <CheckCircle className="w-8 h-8 text-green-500" />
                      ) : (
                        <XCircle className="w-8 h-8 text-red-500" />
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Users with Roles */}
              {result.users.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Utenti con Ruoli</CardTitle>
                    <CardDescription>
                      Lista degli utenti che hanno ruoli assegnati
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Email</TableHead>
                          <TableHead>User ID</TableHead>
                          <TableHead>Ruoli</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {result.users.map(user => (
                          <TableRow key={user.user_id}>
                            <TableCell>{user.email}</TableCell>
                            <TableCell className="font-mono text-xs">
                              {user.user_id.substring(0, 8)}...
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                {user.roles.map(role => (
                                  <Badge key={role} variant="secondary">
                                    {role}
                                  </Badge>
                                ))}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}

              {/* Errors */}
              {result.errors.length > 0 && (
                <Card className="border-destructive">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertCircle className="w-5 h-5 text-destructive" />
                      Problemi Rilevati
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="list-disc list-inside space-y-1">
                      {result.errors.map((error, i) => (
                        <li key={i} className="text-destructive">{error}</li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Logs */}
          {logs.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Log Analisi</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-muted rounded-lg p-4 font-mono text-sm max-h-64 overflow-y-auto">
                  {logs.map((log, i) => (
                    <div key={i}>{log}</div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
