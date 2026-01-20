-- Add requires_text column to themes table
ALTER TABLE themes
ADD COLUMN IF NOT EXISTS requires_text BOOLEAN DEFAULT FALSE;

-- Update existing rows to false just in case
UPDATE themes SET requires_text = FALSE WHERE requires_text IS NULL;
