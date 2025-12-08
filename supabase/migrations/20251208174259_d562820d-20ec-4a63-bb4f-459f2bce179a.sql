-- Drop old function if exists
DROP FUNCTION IF EXISTS reset_database_for_testing();

-- Create new reset function with TRUNCATE
CREATE OR REPLACE FUNCTION public.reset_database_for_testing()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  tables_cleared INTEGER := 0;
BEGIN
  -- Svuota tabelle in ordine (rispettando FK con CASCADE)
  TRUNCATE TABLE review_action_items CASCADE;
  tables_cleared := tables_cleared + 1;
  
  TRUNCATE TABLE certifier_findings CASCADE;
  tables_cleared := tables_cleared + 1;
  
  TRUNCATE TABLE audit_checklist_items CASCADE;
  tables_cleared := tables_cleared + 1;
  
  TRUNCATE TABLE audit_findings CASCADE;
  tables_cleared := tables_cleared + 1;
  
  TRUNCATE TABLE document_versions CASCADE;
  tables_cleared := tables_cleared + 1;
  
  TRUNCATE TABLE document_change_requests CASCADE;
  tables_cleared := tables_cleared + 1;
  
  TRUNCATE TABLE policy_versions CASCADE;
  tables_cleared := tables_cleared + 1;
  
  TRUNCATE TABLE improvement_actions CASCADE;
  tables_cleared := tables_cleared + 1;
  
  TRUNCATE TABLE non_conformities CASCADE;
  tables_cleared := tables_cleared + 1;
  
  TRUNCATE TABLE certification_audits CASCADE;
  tables_cleared := tables_cleared + 1;
  
  TRUNCATE TABLE internal_audits CASCADE;
  tables_cleared := tables_cleared + 1;
  
  TRUNCATE TABLE management_reviews CASCADE;
  tables_cleared := tables_cleared + 1;
  
  TRUNCATE TABLE controlled_documents CASCADE;
  tables_cleared := tables_cleared + 1;
  
  TRUNCATE TABLE security_incidents CASCADE;
  tables_cleared := tables_cleared + 1;
  
  TRUNCATE TABLE training_records CASCADE;
  tables_cleared := tables_cleared + 1;
  
  TRUNCATE TABLE soa_items CASCADE;
  tables_cleared := tables_cleared + 1;
  
  TRUNCATE TABLE procedures CASCADE;
  tables_cleared := tables_cleared + 1;
  
  TRUNCATE TABLE policies CASCADE;
  tables_cleared := tables_cleared + 1;
  
  TRUNCATE TABLE risks CASCADE;
  tables_cleared := tables_cleared + 1;
  
  TRUNCATE TABLE assets CASCADE;
  tables_cleared := tables_cleared + 1;
  
  TRUNCATE TABLE audit_logs CASCADE;
  tables_cleared := tables_cleared + 1;
  
  TRUNCATE TABLE audit_trail CASCADE;
  tables_cleared := tables_cleared + 1;

  RETURN jsonb_build_object(
    'success', true,
    'tables_cleared', tables_cleared,
    'message', 'Database reset completato con successo'
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM,
      'tables_cleared', tables_cleared,
      'message', 'Errore durante il reset'
    );
END;
$$;

-- Permetti esecuzione
GRANT EXECUTE ON FUNCTION public.reset_database_for_testing() TO authenticated;
GRANT EXECUTE ON FUNCTION public.reset_database_for_testing() TO anon;