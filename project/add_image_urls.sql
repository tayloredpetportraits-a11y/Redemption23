-- Add image_url column to printify_product_configs
ALTER TABLE printify_product_configs 
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Update existing products with Printify mockup URLs
UPDATE printify_product_configs 
SET image_url = 'https://images.printify.com/mockup/6593e5b8d12197b6bd09f4af/91641/60161/matte-canvas-stretched-125.jpg'
WHERE product_type = 'canvas-11x14';

UPDATE printify_product_configs 
SET image_url = 'https://images.printify.com/mockup/65a9c440d595e942b702b191/104692/101750/ceramic-mug-11oz-15oz.jpg'
WHERE product_type = 'mug-15oz';

UPDATE printify_product_configs 
SET image_url = 'https://placehold.co/400x400/1a1a2e/34d399?text=Digital+Download'
WHERE product_type = 'digital';
