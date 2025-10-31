-- Recreate the trigger for incident ID generation
CREATE TRIGGER set_incident_id
  BEFORE INSERT ON security_incidents
  FOR EACH ROW
  EXECUTE FUNCTION generate_incident_id();