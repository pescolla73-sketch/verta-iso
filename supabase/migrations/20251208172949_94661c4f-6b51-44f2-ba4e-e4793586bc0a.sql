-- Funzione per reset database (solo per test/dev)
CREATE OR REPLACE FUNCTION reset_database_for_testing()
RETURNS TEXT AS $$
DECLARE
  result TEXT := 'Reset completato:';
BEGIN
  -- Svuota tabelle in ordine (rispettando FK)
  DELETE FROM review_action_items;
  DELETE FROM certifier_findings;
  DELETE FROM audit_checklist_items;
  DELETE FROM audit_findings;
  DELETE FROM document_versions;
  DELETE FROM document_change_requests;
  DELETE FROM policy_versions;
  DELETE FROM improvement_actions;
  DELETE FROM non_conformities;
  DELETE FROM certification_audits;
  DELETE FROM internal_audits;
  DELETE FROM management_reviews;
  DELETE FROM controlled_documents;
  DELETE FROM security_incidents;
  DELETE FROM training_records;
  DELETE FROM soa_items;
  DELETE FROM procedures;
  DELETE FROM policies;
  DELETE FROM risks;
  DELETE FROM assets;
  DELETE FROM audit_logs;
  DELETE FROM audit_trail;
  
  result := result || ' Tutte le tabelle dati svuotate. Struttura, ruoli e controlli mantenuti.';
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Rendi la funzione eseguibile (solo per dev/test!)
GRANT EXECUTE ON FUNCTION reset_database_for_testing() TO authenticated;
GRANT EXECUTE ON FUNCTION reset_database_for_testing() TO anon;