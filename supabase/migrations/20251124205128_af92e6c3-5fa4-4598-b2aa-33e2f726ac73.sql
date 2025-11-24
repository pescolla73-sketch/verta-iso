-- Rendi certifier_name opzionale
ALTER TABLE certification_audits 
ALTER COLUMN certifier_name DROP NOT NULL;