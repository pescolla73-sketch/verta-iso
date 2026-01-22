-- Add delivery_notes column for tracking delivery history
ALTER TABLE public.assets
ADD COLUMN IF NOT EXISTS delivery_notes text;

-- Add index for security status queries (for faster filtering)
CREATE INDEX IF NOT EXISTS idx_assets_antivirus ON public.assets (antivirus_installed);
CREATE INDEX IF NOT EXISTS idx_assets_backup ON public.assets (backup_enabled);
CREATE INDEX IF NOT EXISTS idx_assets_os ON public.assets (operating_system);

-- Update asset_suggestions table to include operating_system field
-- This enables auto-learning for OS selections too