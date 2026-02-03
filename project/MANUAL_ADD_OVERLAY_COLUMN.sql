-- COPY AND PASTE THIS INTO SUPABASE SQL EDITOR
-- This adds the mockup_overlay_url column for CSS overlay system

-- Step 1: Add the column
ALTER TABLE printify_product_configs 
ADD COLUMN IF NOT EXISTS mockup_overlay_url TEXT;

-- Step 2: Add helpful comment
COMMENT ON COLUMN printify_product_configs.mockup_overlay_url IS 
  'Public URL to transparent PNG overlay image stored in Supabase Storage. Used for CSS-based mockup previews (no Printify API calls).';

-- Step 3: Verify it worked
SELECT 
  product_name, 
  product_type,
  image_url,
  mockup_overlay_url
FROM printify_product_configs
ORDER BY display_order;
