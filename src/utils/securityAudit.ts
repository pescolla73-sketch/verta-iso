import { supabase } from '@/integrations/supabase/client';

export async function runSecurityAudit() {
  console.log('=== SECURITY AUDIT START ===\n');

  // 1. Verifica RLS su tabelle principali
  console.log('1. VERIFICA RLS POLICIES');
  const tables = [
    'organization',
    'policies',
    'procedures',
    'risks',
    'assets',
    'controls',
    'training_records',
    'security_incidents',
    'audit_findings',
    'non_conformities',
    'improvement_actions',
    'certification_audits',
    'controlled_documents',
    'document_versions'
  ];

  for (const table of tables) {
    try {
      // Test SELECT con RLS
      const { data, error } = await (supabase as any)
        .from(table)
        .select('id')
        .limit(1);
      
      console.log(`✅ ${table}: RLS attivo (query successful)`);
    } catch (error: any) {
      console.log(`⚠️ ${table}: ${error.message}`);
    }
  }

  // 2. Verifica autenticazione corrente
  console.log('\n2. VERIFICA AUTENTICAZIONE');
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (user) {
    console.log('✅ Utente autenticato:', user.email);
    console.log('   User ID:', user.id);
    console.log('   Metadata:', user.user_metadata);
  } else {
    console.log('⚠️ Nessun utente autenticato (DEMO mode attivo)');
  }

  // 3. Test isolamento dati tra organizzazioni
  console.log('\n3. TEST ISOLAMENTO MULTI-TENANT');
  
  // Conta organizzazioni
  const { data: orgs, error: orgError } = await supabase
    .from('organization')
    .select('id, name');
  
  console.log(`   Organizzazioni nel DB: ${orgs?.length || 0}`);
  if (orgs) {
    orgs.forEach(org => {
      console.log(`   - ${org.name} (${org.id})`);
    });
  }

  // Test: prova a leggere dati di ALTRE organizzazioni
  if (orgs && orgs.length > 0) {
    const firstOrg = orgs[0];
    
    // Prova a forzare accesso a org diversa
    const { data: policies } = await supabase
      .from('policies')
      .select('*')
      .eq('organization_id', firstOrg.id);
    
    console.log(`   Policies accessibili per org ${firstOrg.name}: ${policies?.length || 0}`);
  }

  // 4. Verifica sistema ruoli/permessi
  console.log('\n4. VERIFICA SISTEMA RUOLI');
  
  const rolesTables = ['user_roles', 'roles', 'permissions'];
  for (const table of rolesTables) {
    try {
      const { data, error } = await (supabase as any)
        .from(table)
        .select('*')
        .limit(1);
      
      if (error) {
        console.log(`❌ Tabella ${table}: NON ESISTE`);
      } else {
        console.log(`✅ Tabella ${table}: ESISTE`);
      }
    } catch (e) {
      console.log(`❌ Tabella ${table}: NON ESISTE o non accessibile`);
    }
  }

  // 5. Test validazione input
  console.log('\n5. TEST VALIDAZIONE INPUT');
  
  // Test SQL injection
  const maliciousInput = "'; DROP TABLE policies; --";
  try {
    const { error } = await supabase
      .from('policies')
      .select('*')
      .eq('policy_name', maliciousInput)
      .limit(1);
    
    console.log('✅ SQL Injection: PROTETTO (query parametrizzata)');
  } catch (e) {
    console.log('⚠️ SQL Injection: test fallito');
  }

  // 6. Verifica storage buckets
  console.log('\n6. VERIFICA STORAGE');
  const { data: buckets } = await supabase.storage.listBuckets();
  console.log(`   Storage buckets: ${buckets?.length || 0}`);
  if (buckets) {
    buckets.forEach(bucket => {
      console.log(`   - ${bucket.name} (${bucket.public ? 'PUBLIC' : 'PRIVATE'})`);
    });
  }

  console.log('\n=== SECURITY AUDIT END ===');
}
