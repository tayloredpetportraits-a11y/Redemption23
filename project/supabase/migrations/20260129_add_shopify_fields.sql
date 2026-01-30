/*
  # Add Shopify & Fulfillment Fields
  
  Adds fields to track order source (Shopify vs Manual) and fulfillment details.
  
  1. New Columns:
    - `source` (text): 'shopify' or 'manual'. Default 'manual'.
    - `shopify_order_id` (text): The ID from Shopify (e.g., "gid://shopify/Order/12345").
    - `fulfillment_link_token` (uuid): A secure token for accessing the portal without login (if needed in future).
    - `tags` (text[]): Array of tags for easier filtering.
*/

DO $$
BEGIN
    -- Add source column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'source') THEN
        ALTER TABLE orders ADD COLUMN source text DEFAULT 'manual' CHECK (source IN ('shopify', 'manual', 'stripe'));
    END IF;

    -- Add shopify_order_id
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'shopify_order_id') THEN
        ALTER TABLE orders ADD COLUMN shopify_order_id text;
        CREATE INDEX IF NOT EXISTS orders_shopify_order_id_idx ON orders(shopify_order_id);
    END IF;

    -- Add fulfillment_link_token
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'fulfillment_link_token') THEN
        ALTER TABLE orders ADD COLUMN fulfillment_link_token uuid DEFAULT gen_random_uuid();
    END IF;

    -- Add tags
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'tags') THEN
        ALTER TABLE orders ADD COLUMN tags text[] DEFAULT '{}';
    END IF;

END $$;
