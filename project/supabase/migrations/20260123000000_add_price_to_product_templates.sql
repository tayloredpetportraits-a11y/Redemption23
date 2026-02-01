-- Add formatting for price handling
alter table product_templates 
add column if not exists price integer, -- Price in cents
add column if not exists stripe_price_id text;

-- Make purchase_link optional if it isn't already (it might be required currently)
alter table product_templates 
alter column purchase_link drop not null;
