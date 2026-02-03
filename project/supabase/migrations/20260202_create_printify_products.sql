-- Create printify_products table for database-driven product management
CREATE TABLE IF NOT EXISTS printify_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Product info
  product_name TEXT NOT NULL,
  product_type TEXT UNIQUE NOT NULL,  -- Used in code: 'canvas-11x14', 'mug-11oz', etc.
  description TEXT,
  price_cents INTEGER NOT NULL,      -- Price in cents (4900 = $49.00)
  
  -- Printify IDs
  printify_blueprint_id INTEGER NOT NULL,
  printify_print_provider_id INTEGER NOT NULL,
  printify_variant_id INTEGER NOT NULL,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,   -- For sorting in upsell display
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_printify_products_type ON printify_products(product_type);
CREATE INDEX IF NOT EXISTS idx_printify_products_active ON printify_products(is_active);
CREATE INDEX IF NOT EXISTS idx_printify_products_display_order ON printify_products(display_order);

-- Enable RLS
ALTER TABLE printify_products ENABLE ROW LEVEL SECURITY;

-- Allow public read access (customers need to see products for upsell)
CREATE POLICY "Allow public read access"
  ON printify_products FOR SELECT
  USING (true);

-- Allow authenticated admin access for management
CREATE POLICY "Allow admin full access"
  ON printify_products FOR ALL
  USING (true);  -- TODO: Add proper admin role check when auth is implemented

-- Seed initial product data
INSERT INTO printify_products (product_name, product_type, description, price_cents, printify_blueprint_id, printify_print_provider_id, printify_variant_id, display_order)
VALUES
  -- Canvas products
  ('Canvas 11x14', 'canvas-11x14', 'Museum-quality canvas print with wooden frame, perfect for any room', 4900, 1061, 66, 55537, 1),
  ('Canvas 16x20', 'canvas-16x20', 'Large canvas print with wooden frame, ideal for living rooms and offices', 7900, 1061, 66, 55538, 2),
  
  -- Mug
  ('Ceramic Mug 11oz', 'mug-11oz', '11oz ceramic coffee mug with your custom pet portrait', 1900, 478, 29, 17188, 3),
  
  -- Digital (no Printify, just for tracking)
  ('Digital Only', 'digital', 'Digital download only - no physical product', 0, 0, 0, 0, 999)
ON CONFLICT (product_type) DO NOTHING;

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_printify_products_updated_at
  BEFORE UPDATE ON printify_products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
