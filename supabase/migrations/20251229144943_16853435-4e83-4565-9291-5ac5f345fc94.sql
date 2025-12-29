-- =====================================================
-- ASSET-RISK-CONTROL LINKAGE (Adapted to existing schema)
-- =====================================================

-- Add auto_generated flag to risks
ALTER TABLE risks 
ADD COLUMN IF NOT EXISTS auto_generated BOOLEAN DEFAULT false;

-- Add suggested_controls array to risks  
ALTER TABLE risks
ADD COLUMN IF NOT EXISTS suggested_controls TEXT[];

-- Indices for performance
CREATE INDEX IF NOT EXISTS idx_risks_asset_id ON risks(asset_id);
CREATE INDEX IF NOT EXISTS idx_risks_auto_generated ON risks(auto_generated);

-- =====================================================
-- FUNCTION: Generate Risks from Critical Asset
-- Uses actual schema: criticality (text), integrity_required/availability_required (boolean)
-- =====================================================

CREATE OR REPLACE FUNCTION public.generate_risks_from_critical_asset(
  p_asset_id UUID,
  p_asset_name TEXT,
  p_asset_type TEXT,
  p_criticality TEXT,
  p_confidentiality TEXT,
  p_integrity_required BOOLEAN,
  p_availability_required BOOLEAN,
  p_organization_id UUID
)
RETURNS INTEGER AS $$
DECLARE
  risks_created INTEGER := 0;
  risk_id UUID;
  new_risk_id TEXT;
  base_probability TEXT;
  base_impact TEXT;
  is_critical BOOLEAN;
BEGIN
  
  -- Determine if asset is critical
  is_critical := p_criticality IN ('Critico', 'Alto');
  
  IF NOT is_critical THEN
    RETURN 0;
  END IF;
  
  -- Set base probability/impact based on criticality
  base_probability := CASE 
    WHEN p_criticality = 'Critico' THEN 'high'
    WHEN p_criticality = 'Alto' THEN 'medium'
    ELSE 'low'
  END;
  
  base_impact := CASE 
    WHEN p_criticality = 'Critico' THEN 'critical'
    WHEN p_criticality = 'Alto' THEN 'high'
    ELSE 'medium'
  END;
  
  -- Generate unique risk_id
  new_risk_id := 'RISK-AUTO-' || EXTRACT(EPOCH FROM NOW())::INTEGER || '-' || (random() * 1000)::INTEGER;
  
  -- RISK 1: Data Loss/Damage (if integrity required)
  IF p_integrity_required = true THEN
    
    INSERT INTO risks (
      organization_id,
      asset_id,
      auto_generated,
      risk_id,
      name,
      description,
      inherent_probability,
      inherent_impact,
      inherent_risk_score,
      status,
      suggested_controls,
      identified_date,
      created_at
    ) VALUES (
      p_organization_id,
      p_asset_id,
      true,
      new_risk_id || '-INT',
      'Perdita o Danneggiamento: ' || p_asset_name,
      'Rischio di perdita permanente o corruzione dei dati contenuti in ' || p_asset_name || '. ' ||
      CASE 
        WHEN p_asset_type = 'Dati' THEN 'Minacce: cancellazione accidentale, ransomware, guasto hardware.'
        WHEN p_asset_type = 'Hardware' THEN 'Minacce: guasto hardware, incendio, furto, obsolescenza.'
        WHEN p_asset_type = 'Software' THEN 'Minacce: corruzione software, bug critici, incompatibilità.'
        ELSE 'Minacce: perdita, danneggiamento o compromissione dell''asset.'
      END,
      base_probability,
      base_impact,
      CASE WHEN p_criticality = 'Critico' THEN 20 WHEN p_criticality = 'Alto' THEN 12 ELSE 6 END,
      'identified',
      ARRAY['A.5.29', 'A.5.30', 'A.8.13', 'A.8.11'],
      CURRENT_DATE,
      NOW()
    );
    
    risks_created := risks_created + 1;
    
  END IF;
  
  -- RISK 2: Unauthorized Access (if confidential)
  IF p_confidentiality IN ('Riservato', 'Strettamente Riservato', 'Segreto') THEN
    
    INSERT INTO risks (
      organization_id,
      asset_id,
      auto_generated,
      risk_id,
      name,
      description,
      inherent_probability,
      inherent_impact,
      inherent_risk_score,
      status,
      suggested_controls,
      identified_date,
      created_at
    ) VALUES (
      p_organization_id,
      p_asset_id,
      true,
      new_risk_id || '-CONF',
      'Accesso Non Autorizzato: ' || p_asset_name,
      'Rischio di accesso non autorizzato a ' || p_asset_name || ' da parte di personale interno o attaccanti esterni. ' ||
      'Minacce: hacker, insider malintenzionati, credential theft, privilege escalation. ' ||
      'Impatto potenziale: data breach, esposizione dati sensibili, sanzioni GDPR.',
      'high',
      base_impact,
      CASE WHEN p_criticality = 'Critico' THEN 25 WHEN p_criticality = 'Alto' THEN 15 ELSE 8 END,
      'identified',
      ARRAY['A.5.15', 'A.5.16', 'A.5.17', 'A.5.18', 'A.8.2', 'A.8.3', 'A.8.5'],
      CURRENT_DATE,
      NOW()
    );
    
    risks_created := risks_created + 1;
    
  END IF;
  
  -- RISK 3: Unavailability (if availability required)
  IF p_availability_required = true THEN
    
    INSERT INTO risks (
      organization_id,
      asset_id,
      auto_generated,
      risk_id,
      name,
      description,
      inherent_probability,
      inherent_impact,
      inherent_risk_score,
      status,
      suggested_controls,
      identified_date,
      created_at
    ) VALUES (
      p_organization_id,
      p_asset_id,
      true,
      new_risk_id || '-AVAIL',
      'Indisponibilità Prolungata: ' || p_asset_name,
      'Rischio di downtime prolungato di ' || p_asset_name || ' che blocca operazioni critiche. ' ||
      CASE 
        WHEN p_asset_type = 'Hardware' THEN 'Minacce: guasto hardware, disaster fisico, power outage.'
        WHEN p_asset_type = 'Software' THEN 'Minacce: bug critici, attacchi DoS, errori configurazione.'
        ELSE 'Minacce: interruzione servizio, guasti, attacchi cyber.'
      END ||
      ' Impatto: blocco operazioni, perdita revenue, violazione SLA.',
      base_probability,
      base_impact,
      CASE WHEN p_criticality = 'Critico' THEN 20 WHEN p_criticality = 'Alto' THEN 12 ELSE 6 END,
      'identified',
      ARRAY['A.5.29', 'A.5.30', 'A.8.6', 'A.8.14', 'A.8.20'],
      CURRENT_DATE,
      NOW()
    );
    
    risks_created := risks_created + 1;
    
  END IF;
  
  -- RISK 4: Physical Risk (if hardware)
  IF p_asset_type = 'Hardware' AND p_criticality IN ('Critico', 'Alto') THEN
    
    INSERT INTO risks (
      organization_id,
      asset_id,
      auto_generated,
      risk_id,
      name,
      description,
      inherent_probability,
      inherent_impact,
      inherent_risk_score,
      status,
      suggested_controls,
      identified_date,
      created_at
    ) VALUES (
      p_organization_id,
      p_asset_id,
      true,
      new_risk_id || '-PHYS',
      'Rischio Fisico: ' || p_asset_name,
      'Rischi fisici (furto, incendio, allagamento) che compromettono ' || p_asset_name || '. ' ||
      'Minacce: furto, incendio, allagamento, terremoto, sabotaggio fisico. ' ||
      'Vulnerabilità: hardware on-premise senza protezioni fisiche adeguate.',
      'low',
      base_impact,
      CASE WHEN p_criticality = 'Critico' THEN 10 ELSE 6 END,
      'identified',
      ARRAY['A.7.1', 'A.7.2', 'A.7.4', 'A.7.7', 'A.7.8'],
      CURRENT_DATE,
      NOW()
    );
    
    risks_created := risks_created + 1;
    
  END IF;
  
  RETURN risks_created;
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error generating risks from asset: %', SQLERRM;
    RETURN 0;
  
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- =====================================================
-- TRIGGER: Auto-generate risks when asset becomes critical
-- =====================================================

CREATE OR REPLACE FUNCTION public.trigger_generate_risks_from_asset()
RETURNS TRIGGER AS $$
DECLARE
  is_now_critical BOOLEAN;
  was_critical BOOLEAN;
  risks_count INTEGER;
  existing_auto_risks INTEGER;
BEGIN
  
  -- Check if asset is now critical
  is_now_critical := NEW.criticality IN ('Critico', 'Alto');
  
  -- Check if was critical before (for UPDATE)
  IF TG_OP = 'UPDATE' THEN
    was_critical := OLD.criticality IN ('Critico', 'Alto');
  ELSE
    was_critical := false;
  END IF;
  
  -- Only generate if becoming critical (not already critical)
  IF is_now_critical AND NOT was_critical THEN
    
    -- Check if auto-generated risks already exist for this asset
    SELECT COUNT(*) INTO existing_auto_risks
    FROM risks
    WHERE asset_id = NEW.id AND auto_generated = true;
    
    IF existing_auto_risks = 0 THEN
      -- Generate risks
      SELECT public.generate_risks_from_critical_asset(
        NEW.id,
        NEW.name,
        NEW.asset_type,
        NEW.criticality,
        NEW.confidentiality,
        COALESCE(NEW.integrity_required, false),
        COALESCE(NEW.availability_required, false),
        NEW.organization_id
      ) INTO risks_count;
      
      RAISE NOTICE 'Generated % risks for critical asset: %', risks_count, NEW.name;
    END IF;
    
  END IF;
  
  RETURN NEW;
  
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger (drop first if exists)
DROP TRIGGER IF EXISTS trigger_asset_risk_generation ON assets;

CREATE TRIGGER trigger_asset_risk_generation
  AFTER INSERT OR UPDATE OF criticality
  ON assets
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_generate_risks_from_asset();

-- =====================================================
-- VIEW: Critical Assets with Related Risks
-- =====================================================

DROP VIEW IF EXISTS critical_assets_with_risks;

CREATE VIEW critical_assets_with_risks AS
SELECT 
  a.id as asset_id,
  a.name as asset_name,
  a.asset_type,
  a.owner,
  a.criticality,
  a.confidentiality,
  a.integrity_required,
  a.availability_required,
  COUNT(r.id) as related_risks_count,
  COUNT(r.id) FILTER (WHERE r.status = 'identified') as untreated_risks,
  COUNT(r.id) FILTER (WHERE r.inherent_risk_score >= 15) as critical_risks,
  a.organization_id
FROM assets a
LEFT JOIN risks r ON r.asset_id = a.id
WHERE a.criticality IN ('Critico', 'Alto')
GROUP BY a.id, a.name, a.asset_type, a.owner, 
         a.criticality, a.confidentiality, a.integrity_required,
         a.availability_required, a.organization_id;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.generate_risks_from_critical_asset TO authenticated, anon;
GRANT SELECT ON critical_assets_with_risks TO authenticated, anon;