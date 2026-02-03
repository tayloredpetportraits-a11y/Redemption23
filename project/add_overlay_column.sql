-- Phase 1: Add mockup overlay URL column to printify_product_configs
-- This will store the public URL to transparent PNG overlay images

ALTER TABLE printify_product_configs 
ADD COLUMN IF NOT EXISTS mockup_overlay_url TEXT;

COMMENT ON COLUMN printify_product_configs.mockup_overlay_url IS 
'Public URL to transparent PNG overlay image (e.g., canvas frame, mug template) stored in Supabase Storage. Used for CSS-based mockup generation.';

-- Verify the column was added
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'printify_product_configs' 
AND column_name = 'mockup_overlay_url';
