-- Add perspective warp support to product_templates
alter table product_templates 
add column if not exists type text default 'canvas', -- 'canvas', 'mug', 'pillow', etc.
add column if not exists mask_url text, -- Path to masking image (optional)
add column if not exists warp_config jsonb; -- Stores corner coordinates: { tl: {x,y}, tr: {x,y}, bl: {x,y}, br: {x,y} }

-- Update existing rows with a default/null config so they don't break
update product_templates set warp_config = null where warp_config is null;
