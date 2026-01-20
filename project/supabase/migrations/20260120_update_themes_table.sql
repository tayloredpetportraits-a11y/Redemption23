
-- Add columns for AI Reference Images
ALTER TABLE themes
ADD COLUMN IF NOT EXISTS reference_images text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS trigger_word text;

-- Update existing rows if needed (optional, safe to skip)
