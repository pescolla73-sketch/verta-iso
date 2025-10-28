-- Risk Assessment Module for ISO 27001 Compliance

-- Threats/Minacce table
CREATE TABLE public.threats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organization(id),
  
  threat_id VARCHAR(20) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT unique_org_threat_id UNIQUE(organization_id, threat_id)
);

-- Vulnerabilities/Vulnerabilità table
CREATE TABLE public.vulnerabilities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organization(id),
  
  vulnerability_id VARCHAR(20) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT unique_org_vuln_id UNIQUE(organization_id, vulnerability_id)
);

-- Risks/Rischi table
CREATE TABLE public.risks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organization(id),
  
  -- Identification
  risk_id VARCHAR(20) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- Related entities
  asset_id UUID REFERENCES public.assets(id),
  threat_id UUID REFERENCES public.threats(id),
  vulnerability_id UUID REFERENCES public.vulnerabilities(id),
  
  -- Assessment (BEFORE treatment)
  inherent_probability VARCHAR(20) NOT NULL,
  inherent_impact VARCHAR(20) NOT NULL,
  inherent_risk_level VARCHAR(20),
  inherent_risk_score INTEGER,
  
  -- Treatment
  treatment_strategy VARCHAR(50),
  treatment_description TEXT,
  treatment_cost DECIMAL(10,2),
  treatment_deadline DATE,
  treatment_responsible VARCHAR(255),
  
  -- Related ISO controls
  related_controls TEXT[],
  
  -- Assessment (AFTER treatment)
  residual_probability VARCHAR(20),
  residual_impact VARCHAR(20),
  residual_risk_level VARCHAR(20),
  residual_risk_score INTEGER,
  
  -- Status
  status VARCHAR(50) DEFAULT 'Identificato',
  
  -- Metadata
  identified_date DATE DEFAULT CURRENT_DATE,
  last_review_date DATE,
  next_review_date DATE,
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT unique_org_risk_id UNIQUE(organization_id, risk_id)
);

-- Indexes for performance
CREATE INDEX idx_risks_org ON public.risks(organization_id);
CREATE INDEX idx_risks_asset ON public.risks(asset_id);
CREATE INDEX idx_risks_status ON public.risks(status);
CREATE INDEX idx_risks_level ON public.risks(inherent_risk_level);
CREATE INDEX idx_threats_org ON public.threats(organization_id);
CREATE INDEX idx_vulnerabilities_org ON public.vulnerabilities(organization_id);

-- Enable RLS
ALTER TABLE public.threats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vulnerabilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.risks ENABLE ROW LEVEL SECURITY;

-- RLS Policies (permissive for testing, like controls/assets)
CREATE POLICY "Public can view all threats for testing"
  ON public.threats
  FOR SELECT
  USING (true);

CREATE POLICY "Public can manage threats for testing"
  ON public.threats
  FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Public can view all vulnerabilities for testing"
  ON public.vulnerabilities
  FOR SELECT
  USING (true);

CREATE POLICY "Public can manage vulnerabilities for testing"
  ON public.vulnerabilities
  FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Public can view all risks for testing"
  ON public.risks
  FOR SELECT
  USING (true);

CREATE POLICY "Public can manage risks for testing"
  ON public.risks
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Triggers for updated_at
CREATE TRIGGER update_threats_updated_at
  BEFORE UPDATE ON public.threats
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_vulnerabilities_updated_at
  BEFORE UPDATE ON public.vulnerabilities
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_risks_updated_at
  BEFORE UPDATE ON public.risks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();