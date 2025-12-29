-- Fix generate_initial_recurring_tasks function with proper date calculation
CREATE OR REPLACE FUNCTION public.generate_initial_recurring_tasks(
  p_organization_id UUID,
  p_start_date DATE DEFAULT CURRENT_DATE
)
RETURNS INTEGER AS $$
DECLARE
  task_count INTEGER := 0;
  template RECORD;
  first_due_date DATE;
BEGIN
  FOR template IN 
    SELECT * FROM public.recurring_task_templates
  LOOP
    first_due_date := p_start_date + (template.frequency_days * INTERVAL '1 day');
    
    INSERT INTO public.recurring_tasks (
      organization_id,
      template_id,
      task_name,
      task_description,
      category,
      due_date,
      priority,
      frequency_days,
      status,
      created_at
    ) VALUES (
      p_organization_id,
      template.id,
      template.task_name,
      template.task_description,
      template.category,
      first_due_date,
      template.priority,
      template.frequency_days,
      'pending',
      NOW()
    );
    
    task_count := task_count + 1;
  END LOOP;
  
  RETURN task_count;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error in generate_initial_recurring_tasks: %', SQLERRM;
    RETURN 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Fix update_overdue_tasks function
CREATE OR REPLACE FUNCTION public.update_overdue_tasks()
RETURNS INTEGER AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  UPDATE public.recurring_tasks
  SET status = 'overdue', updated_at = NOW()
  WHERE status = 'pending'
    AND due_date < CURRENT_DATE;
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  
  RETURN updated_count;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error in update_overdue_tasks: %', SQLERRM;
    RETURN 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;