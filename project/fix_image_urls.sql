-- Fix broken image URLs with working placeholders
UPDATE printify_product_configs 
SET image_url = 'https://placehold.co/400x400/1a1a2e/f97316?text=Canvas+11x14&font=montserrat'
WHERE product_type = 'canvas-11x14';

UPDATE printify_product_configs 
SET image_url = 'https://placehold.co/400x400/1a1a2e/7c3aed?text=Mug+15oz&font=montserrat'
WHERE product_type = 'mug-15oz';

UPDATE printify_product_configs 
SET image_url = 'https://placehold.co/400x400/1a1a2e/34d399?text=Digital&font=montserrat'
WHERE product_type = 'digital';
