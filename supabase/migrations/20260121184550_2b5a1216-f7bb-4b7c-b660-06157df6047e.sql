
-- Create asset_tests table for test definitions/templates
CREATE TABLE public.asset_tests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  asset_id UUID REFERENCES public.assets(id) ON DELETE CASCADE,
  test_name TEXT NOT NULL,
  test_type TEXT NOT NULL,
  description TEXT,
  frequency_days INTEGER NOT NULL DEFAULT 30,
  responsible_person TEXT,
  instructions TEXT,
  is_active BOOLEAN DEFAULT true,
  last_execution_date DATE,
  next_due_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create asset_test_executions table for actual test runs
CREATE TABLE public.asset_test_executions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  test_id UUID NOT NULL REFERENCES public.asset_tests(id) ON DELETE CASCADE,
  asset_id UUID REFERENCES public.assets(id) ON DELETE SET NULL,
  execution_date DATE NOT NULL DEFAULT CURRENT_DATE,
  executed_by TEXT NOT NULL,
  result TEXT NOT NULL CHECK (result IN ('passed', 'failed', 'partial')),
  notes TEXT,
  evidence_files JSONB DEFAULT '[]'::jsonb,
  issues_found TEXT,
  corrective_actions TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create test_type_suggestions for auto-learning
CREATE TABLE public.test_type_suggestions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID,
  test_type TEXT NOT NULL,
  usage_count INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(organization_id, test_type)
);

-- Enable RLS on all tables
ALTER TABLE public.asset_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asset_test_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_type_suggestions ENABLE ROW LEVEL SECURITY;

-- RLS policies for asset_tests
CREATE POLICY "Public can view asset_tests for testing" ON public.asset_tests
  FOR SELECT USING (true);
CREATE POLICY "Public can insert asset_tests for testing" ON public.asset_tests
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Public can update asset_tests for testing" ON public.asset_tests
  FOR UPDATE USING (true);
CREATE POLICY "Public can delete asset_tests for testing" ON public.asset_tests
  FOR DELETE USING (true);

-- RLS policies for asset_test_executions
CREATE POLICY "Public can view asset_test_executions for testing" ON public.asset_test_executions
  FOR SELECT USING (true);
CREATE POLICY "Public can insert asset_test_executions for testing" ON public.asset_test_executions
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Public can update asset_test_executions for testing" ON public.asset_test_executions
  FOR UPDATE USING (true);
CREATE POLICY "Public can delete asset_test_executions for testing" ON public.asset_test_executions
  FOR DELETE USING (true);

-- RLS policies for test_type_suggestions
CREATE POLICY "Public can view test_type_suggestions" ON public.test_type_suggestions
  FOR SELECT USING (true);
CREATE POLICY "Public can insert test_type_suggestions" ON public.test_type_suggestions
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Public can update test_type_suggestions" ON public.test_type_suggestions
  FOR UPDATE USING (true);

-- Create storage bucket for test evidence files
INSERT INTO storage.buckets (id, name, public) VALUES ('test-evidence', 'test-evidence', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for test evidence
CREATE POLICY "Anyone can view test evidence" ON storage.objects
  FOR SELECT USING (bucket_id = 'test-evidence');
CREATE POLICY "Anyone can upload test evidence" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'test-evidence');
CREATE POLICY "Anyone can update test evidence" ON storage.objects
  FOR UPDATE USING (bucket_id = 'test-evidence');
CREATE POLICY "Anyone can delete test evidence" ON storage.objects
  FOR DELETE USING (bucket_id = 'test-evidence');

-- Function to update next_due_date after test execution
CREATE OR REPLACE FUNCTION public.update_test_due_date()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.asset_tests
  SET 
    last_execution_date = NEW.execution_date,
    next_due_date = NEW.execution_date + (frequency_days || ' days')::INTERVAL,
    updated_at = now()
  WHERE id = NEW.test_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update test dates
CREATE TRIGGER trigger_update_test_due_date
  AFTER INSERT ON public.asset_test_executions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_test_due_date();

-- Insert common test types as suggestions
INSERT INTO public.test_type_suggestions (test_type, usage_count) VALUES
  ('Prova ripristino Backup', 5),
  ('Test batterie UPS', 5),
  ('Controllo Antivirus', 5),
  ('Test Disaster Recovery', 5),
  ('Verifica integrità dati', 5),
  ('Test firewall', 5),
  ('Controllo accessi fisici', 5),
  ('Test sistema di allarme', 5),
  ('Verifica log di sicurezza', 5),
  ('Test penetration', 5)
ON CONFLICT DO NOTHING;
