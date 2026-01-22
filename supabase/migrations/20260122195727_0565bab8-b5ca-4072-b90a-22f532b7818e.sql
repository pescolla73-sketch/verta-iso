-- Add new security-related fields to assets table
ALTER TABLE public.assets 
ADD COLUMN IF NOT EXISTS operating_system TEXT,
ADD COLUMN IF NOT EXISTS antivirus_installed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS antivirus_name TEXT,
ADD COLUMN IF NOT EXISTS backup_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS backup_software TEXT,
ADD COLUMN IF NOT EXISTS update_mode TEXT DEFAULT 'Manuale';

-- Add comment for documentation
COMMENT ON COLUMN public.assets.operating_system IS 'Operating System (Windows, Linux, macOS, etc.)';
COMMENT ON COLUMN public.assets.antivirus_installed IS 'Whether antivirus/EDR is installed';
COMMENT ON COLUMN public.assets.antivirus_name IS 'Name of antivirus/EDR software';
COMMENT ON COLUMN public.assets.backup_enabled IS 'Whether backup is enabled for this asset';
COMMENT ON COLUMN public.assets.backup_software IS 'Name of backup software used';
COMMENT ON COLUMN public.assets.update_mode IS 'Update mode: Automatico or Manuale';