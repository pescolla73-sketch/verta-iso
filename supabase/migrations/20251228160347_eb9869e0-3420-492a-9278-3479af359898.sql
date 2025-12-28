-- =====================================================
-- ZONE RISCHIO ITALIA - Mappatura geografica
-- =====================================================

CREATE TABLE IF NOT EXISTS public.geographic_risks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  region TEXT,
  province TEXT,
  city TEXT,
  seismic_zone INTEGER,
  flood_risk TEXT,
  volcanic_risk BOOLEAN DEFAULT false,
  landslide_risk TEXT,
  coastal BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indici
CREATE INDEX idx_geographic_risks_city ON public.geographic_risks(city);
CREATE INDEX idx_geographic_risks_seismic ON public.geographic_risks(seismic_zone);

-- RLS
ALTER TABLE public.geographic_risks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Geographic risks readable by all"
  ON public.geographic_risks FOR SELECT
  USING (true);

-- =====================================================
-- POPOLA PRINCIPALI CITTÀ ITALIANE
-- =====================================================

INSERT INTO public.geographic_risks (
  region, province, city, seismic_zone, flood_risk, volcanic_risk, landslide_risk, coastal, notes
) VALUES
-- ALTO RISCHIO SISMICO (Zona 1-2)
('Sicilia', 'Catania', 'Catania', 1, 'low', true, 'medium', true, 'Vulcano Etna attivo'),
('Sicilia', 'Messina', 'Messina', 1, 'low', false, 'high', true, 'Zona sismica elevata, frane frequenti'),
('Calabria', 'Reggio Calabria', 'Reggio Calabria', 1, 'medium', false, 'high', true, 'Zona sismica molto elevata'),
('Friuli Venezia Giulia', 'Udine', 'Udine', 1, 'medium', false, 'medium', false, 'Terremoto 1976'),
('Umbria', 'Perugia', 'Perugia', 2, 'low', false, 'medium', false, 'Zona sismica media'),
('Marche', 'Ancona', 'Ancona', 2, 'low', false, 'medium', true, 'Terremoti recenti 2016'),
('Lazio', 'Rieti', 'Rieti', 2, 'low', false, 'medium', false, 'Zona Appenninica sismica'),
('Abruzzo', 'L''Aquila', 'L''Aquila', 1, 'low', false, 'high', false, 'Terremoto 2009'),
('Campania', 'Napoli', 'Napoli', 2, 'low', true, 'medium', true, 'Vesuvio e Campi Flegrei'),
('Basilicata', 'Potenza', 'Potenza', 1, 'low', false, 'high', false, 'Zona Appenninica sismica'),
-- RISCHIO ALLUVIONE ALTO
('Veneto', 'Venezia', 'Venezia', 3, 'high', false, 'low', true, 'Acqua alta frequente, livello mare'),
('Emilia-Romagna', 'Ferrara', 'Ferrara', 3, 'high', false, 'low', false, 'Sotto livello mare, fiume Po'),
('Piemonte', 'Alessandria', 'Alessandria', 3, 'high', false, 'medium', false, 'Alluvioni fiume Tanaro'),
('Liguria', 'Genova', 'Genova', 3, 'high', false, 'high', true, 'Alluvioni lampo frequenti'),
('Toscana', 'Pisa', 'Pisa', 3, 'high', false, 'low', false, 'Fiume Arno'),
('Toscana', 'Firenze', 'Firenze', 2, 'high', false, 'low', false, 'Fiume Arno, alluvione 1966'),
-- MEDIO-BASSO RISCHIO
('Lombardia', 'Milano', 'Milano', 3, 'medium', false, 'low', false, 'Rischio sismico basso'),
('Lombardia', 'Bergamo', 'Bergamo', 3, 'low', false, 'medium', false, 'Pre-Alpi'),
('Piemonte', 'Torino', 'Torino', 3, 'medium', false, 'low', false, 'Fiume Po vicino'),
('Emilia-Romagna', 'Bologna', 'Bologna', 3, 'medium', false, 'low', false, 'Appennini vicini'),
('Emilia-Romagna', 'Modena', 'Modena', 3, 'medium', false, 'low', false, 'Zona sismica bassa'),
('Toscana', 'Livorno', 'Livorno', 3, 'medium', false, 'low', true, 'Costa'),
('Lazio', 'Roma', 'Roma', 3, 'low', false, 'low', false, 'Rischio sismico molto basso'),
('Puglia', 'Bari', 'Bari', 3, 'low', false, 'low', true, 'Rischio sismico basso'),
('Sardegna', 'Cagliari', 'Cagliari', 4, 'low', false, 'low', true, 'Zona praticamente asismica'),
('Trentino-Alto Adige', 'Trento', 'Trento', 3, 'low', false, 'medium', false, 'Zona alpina, frane possibili'),
('Valle d''Aosta', 'Aosta', 'Aosta', 3, 'low', false, 'high', false, 'Zona alpina, valanghe e frane'),
('Molise', 'Campobasso', 'Campobasso', 1, 'low', false, 'high', false, 'Zona sismica elevata');

-- =====================================================
-- FUNZIONE SMART SUGGESTION
-- =====================================================

CREATE OR REPLACE FUNCTION public.get_recommended_risk_templates(
  p_locations TEXT[],
  p_industry TEXT,
  p_has_cloud BOOLEAN,
  p_has_onpremise BOOLEAN,
  p_has_development BOOLEAN,
  p_has_personal_data BOOLEAN,
  p_has_health_data BOOLEAN,
  p_has_financial_data BOOLEAN,
  p_employee_count TEXT
)
RETURNS TABLE (
  template_id UUID,
  risk_name TEXT,
  relevance_score INTEGER,
  reason TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  
  -- Rischi SEMPRE applicabili (score alto)
  SELECT 
    rt.id,
    rt.risk_name,
    100::INTEGER as relevance_score,
    'Rischio universale per tutte le aziende'::TEXT as reason
  FROM risk_templates rt
  WHERE rt.template_code IN ('RISK_RANSOM_001', 'RISK_PHISH_001', 'RISK_HUMAN_001')
  
  UNION ALL
  
  -- Rischi GEOGRAFICI basati su location (sismico)
  SELECT 
    rt.id,
    rt.risk_name,
    CASE 
      WHEN gr.seismic_zone = 1 THEN 95
      WHEN gr.seismic_zone = 2 THEN 75
      WHEN gr.seismic_zone = 3 THEN 40
      ELSE 20
    END as relevance_score,
    'Zona sismica ' || gr.seismic_zone || ' - ' || gr.city as reason
  FROM risk_templates rt
  CROSS JOIN unnest(p_locations) AS loc
  JOIN geographic_risks gr ON LOWER(gr.city) = LOWER(loc)
  WHERE rt.template_code = 'RISK_FIRE_001'
    AND gr.seismic_zone <= 2
  
  UNION ALL
  
  -- Rischio ALLUVIONE
  SELECT 
    rt.id,
    rt.risk_name,
    CASE gr.flood_risk
      WHEN 'high' THEN 90
      WHEN 'medium' THEN 60
      ELSE 30
    END as relevance_score,
    'Rischio idrogeologico ' || gr.flood_risk || ' - ' || gr.city as reason
  FROM risk_templates rt
  CROSS JOIN unnest(p_locations) AS loc
  JOIN geographic_risks gr ON LOWER(gr.city) = LOWER(loc)
  WHERE rt.template_code = 'RISK_FIRE_001'
    AND gr.flood_risk IN ('high', 'medium')
  
  UNION ALL
  
  -- Rischi SETTORE SANITÀ
  SELECT 
    rt.id,
    rt.risk_name,
    95::INTEGER as relevance_score,
    'Settore sanità - target frequente ransomware'::TEXT as reason
  FROM risk_templates rt
  WHERE p_industry = 'health'
    AND rt.template_code IN ('RISK_RANSOM_001', 'RISK_GDPR_001')
  
  UNION ALL
  
  -- Rischi SETTORE FINANCE
  SELECT 
    rt.id,
    rt.risk_name,
    90::INTEGER as relevance_score,
    'Settore finanziario - compliance obbligatoria'::TEXT as reason
  FROM risk_templates rt
  WHERE p_industry = 'finance'
    AND rt.template_code IN ('RISK_BREACH_001', 'RISK_NIS2_001')
  
  UNION ALL
  
  -- Rischi CLOUD
  SELECT 
    rt.id,
    rt.risk_name,
    85::INTEGER as relevance_score,
    'Infrastruttura cloud in uso'::TEXT as reason
  FROM risk_templates rt
  WHERE p_has_cloud = true
    AND rt.template_code IN ('RISK_CLOUD_001', 'RISK_BREACH_001')
  
  UNION ALL
  
  -- Rischi ON-PREMISE
  SELECT 
    rt.id,
    rt.risk_name,
    80::INTEGER as relevance_score,
    'Server on-premise - rischi fisici e backup'::TEXT as reason
  FROM risk_templates rt
  WHERE p_has_onpremise = true
    AND rt.template_code IN ('RISK_BACKUP_001', 'RISK_FIRE_001', 'RISK_PATCH_001')
  
  UNION ALL
  
  -- Rischi SVILUPPO SOFTWARE
  SELECT 
    rt.id,
    rt.risk_name,
    85::INTEGER as relevance_score,
    'Sviluppo software interno'::TEXT as reason
  FROM risk_templates rt
  WHERE p_has_development = true
    AND rt.template_code IN ('RISK_SUPPLY_001', 'RISK_API_001', 'RISK_AI_001')
  
  UNION ALL
  
  -- Rischi DATI PERSONALI
  SELECT 
    rt.id,
    rt.risk_name,
    90::INTEGER as relevance_score,
    'Trattamento dati personali - GDPR obbligatorio'::TEXT as reason
  FROM risk_templates rt
  WHERE p_has_personal_data = true
    AND rt.template_code IN ('RISK_GDPR_001', 'RISK_BREACH_001')
  
  UNION ALL
  
  -- Rischi DATI SANITARI
  SELECT 
    rt.id,
    rt.risk_name,
    95::INTEGER as relevance_score,
    'Dati sanitari - categoria speciale GDPR'::TEXT as reason
  FROM risk_templates rt
  WHERE p_has_health_data = true
    AND rt.template_code = 'RISK_GDPR_001'
  
  UNION ALL
  
  -- Rischi DATI FINANZIARI
  SELECT 
    rt.id,
    rt.risk_name,
    85::INTEGER as relevance_score,
    'Dati finanziari - target per frodi'::TEXT as reason
  FROM risk_templates rt
  WHERE p_has_financial_data = true
    AND rt.template_code IN ('RISK_BREACH_001', 'RISK_PHISH_001')
  
  UNION ALL
  
  -- Rischi DIMENSIONE AZIENDA (10+ dipendenti)
  SELECT 
    rt.id,
    rt.risk_name,
    70::INTEGER as relevance_score,
    'Team ampio - rischi phishing e insider elevati'::TEXT as reason
  FROM risk_templates rt
  WHERE p_employee_count IN ('11-50', '51-250', '251-1000', '1000+')
    AND rt.template_code IN ('RISK_INSIDER_001', 'RISK_SHADOW_001')
  
  ORDER BY relevance_score DESC;
  
END;
$$;

COMMENT ON FUNCTION public.get_recommended_risk_templates IS 'Suggerisce rischi template basati su contesto azienda (geography, industry, tech stack)';