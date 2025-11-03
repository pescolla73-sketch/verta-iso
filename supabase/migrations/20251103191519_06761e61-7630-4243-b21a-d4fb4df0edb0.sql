-- Management Review Module for ISO 27001:2022 Clause 9.3

-- Management Reviews table
CREATE TABLE IF NOT EXISTS management_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  
  -- Meeting identification
  review_id VARCHAR(50) NOT NULL UNIQUE,
  meeting_date DATE NOT NULL,
  meeting_duration INTEGER,
  location VARCHAR(255),
  
  -- Participants
  chairman VARCHAR(255),
  secretary VARCHAR(255),
  attendees TEXT[],
  
  -- Review inputs
  previous_actions_status TEXT,
  external_internal_changes TEXT,
  isms_performance_feedback TEXT,
  audit_results_summary TEXT,
  nonconformities_summary TEXT,
  monitoring_results TEXT,
  improvement_opportunities TEXT,
  
  -- Review outputs
  decisions JSONB,
  isms_changes_needed TEXT,
  resource_needs TEXT,
  action_items JSONB,
  
  -- Status
  status VARCHAR(30) DEFAULT 'scheduled',
  
  -- Minutes
  minutes_draft TEXT,
  minutes_approved_by VARCHAR(255),
  minutes_approval_date DATE,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID
);

-- Auto-generate review ID
CREATE OR REPLACE FUNCTION generate_review_id()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.review_id IS NULL OR NEW.review_id = '' THEN
    NEW.review_id := 'MR-' || LPAD(
      (SELECT COALESCE(MAX(CAST(SUBSTRING(review_id FROM 4) AS INTEGER)), 0) + 1
       FROM management_reviews 
       WHERE organization_id = NEW.organization_id 
       AND review_id IS NOT NULL)::TEXT, 
      3, '0'
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_review_id
  BEFORE INSERT ON management_reviews
  FOR EACH ROW
  EXECUTE FUNCTION generate_review_id();

-- Indexes
CREATE INDEX idx_reviews_org ON management_reviews(organization_id);
CREATE INDEX idx_reviews_date ON management_reviews(meeting_date);
CREATE INDEX idx_reviews_status ON management_reviews(status);

-- RLS
ALTER TABLE management_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view reviews for testing"
ON management_reviews FOR SELECT
USING (true);

CREATE POLICY "Public can insert reviews for testing"
ON management_reviews FOR INSERT
WITH CHECK (true);

CREATE POLICY "Public can update reviews for testing"
ON management_reviews FOR UPDATE
USING (true);

CREATE POLICY "Public can delete reviews for testing"
ON management_reviews FOR DELETE
USING (true);

-- Action Items table
CREATE TABLE IF NOT EXISTS review_action_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID REFERENCES management_reviews(id) ON DELETE CASCADE,
  
  action_number INTEGER NOT NULL,
  description TEXT NOT NULL,
  responsible_person VARCHAR(255) NOT NULL,
  due_date DATE NOT NULL,
  status VARCHAR(30) DEFAULT 'open',
  completion_date DATE,
  completion_notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_action_items_review ON review_action_items(review_id);
CREATE INDEX idx_action_items_status ON review_action_items(status);

ALTER TABLE review_action_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view action items for testing"
ON review_action_items FOR SELECT
USING (true);

CREATE POLICY "Public can insert action items for testing"
ON review_action_items FOR INSERT
WITH CHECK (true);

CREATE POLICY "Public can update action items for testing"
ON review_action_items FOR UPDATE
USING (true);

CREATE POLICY "Public can delete action items for testing"
ON review_action_items FOR DELETE
USING (true);