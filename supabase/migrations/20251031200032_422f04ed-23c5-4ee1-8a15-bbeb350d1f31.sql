-- Training records table for ISO 27001 Clause 7.2 Competence
CREATE TABLE IF NOT EXISTS training_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  
  -- Employee info
  employee_name VARCHAR(255) NOT NULL,
  employee_email VARCHAR(255),
  role VARCHAR(100),
  department VARCHAR(100),
  
  -- Training info
  training_title VARCHAR(255) NOT NULL,
  training_type VARCHAR(50) DEFAULT 'security_awareness',
  training_provider VARCHAR(255),
  training_duration_hours DECIMAL(4,1),
  
  -- Dates
  training_date DATE NOT NULL,
  expiry_date DATE,
  
  -- Certification
  certificate_issued BOOLEAN DEFAULT false,
  certificate_number VARCHAR(100),
  certificate_file_url TEXT,
  
  -- Status
  status VARCHAR(50) DEFAULT 'completed',
  completion_score DECIMAL(5,2),
  
  -- Notes
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_training_org ON training_records(organization_id);
CREATE INDEX idx_training_employee ON training_records(employee_email);
CREATE INDEX idx_training_date ON training_records(training_date DESC);
CREATE INDEX idx_training_expiry ON training_records(expiry_date);

-- Enable RLS
ALTER TABLE training_records ENABLE ROW LEVEL SECURITY;

-- Public access for testing (replace with proper policies later)
CREATE POLICY "Public can view training records for testing"
ON training_records FOR SELECT
USING (true);

CREATE POLICY "Public can insert training records for testing"
ON training_records FOR INSERT
WITH CHECK (true);

CREATE POLICY "Public can update training records for testing"
ON training_records FOR UPDATE
USING (true);

CREATE POLICY "Public can delete training records for testing"
ON training_records FOR DELETE
USING (true);