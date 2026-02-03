-- Add Shopify Extended Fields
-- Adds order number, total price, and notes fields for Shopify webhook data

DO $$
BEGIN
    -- Add shopify_order_number
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'shopify_order_number') THEN
        ALTER TABLE orders ADD COLUMN shopify_order_number text;
        CREATE INDEX IF NOT EXISTS orders_shopify_order_number_idx ON orders(shopify_order_number);
    END IF;

    -- Add shopify_total_price (store as cents integer for precision)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'shopify_total_price') THEN
        ALTER TABLE orders ADD COLUMN shopify_total_price integer;
    END IF;

    -- Add shopify_notes (separate from pet_details for clarity)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'shopify_notes') THEN
        ALTER TABLE orders ADD COLUMN shopify_notes text;
    END IF;

END $$;
