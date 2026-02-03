-- Create printify_product_configs table (renamed to avoid conflict with existing printify_products)
CREATE TABLE IF NOT EXISTS printify_product_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_name TEXT NOT NULL,
  product_type TEXT NOT NULL UNIQUE,
  description TEXT,
  price_cents INTEGER NOT NULL,
  printify_blueprint_id INTEGER NOT NULL,
  printify_print_provider_id INTEGER NOT NULL,
  printify_variant_id INTEGER NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_product_configs_type ON printify_product_configs(product_type);
CREATE INDEX IF NOT EXISTS idx_product_configs_active ON printify_product_configs(is_active);
CREATE INDEX IF NOT EXISTS idx_product_configs_order ON printify_product_configs(display_order);

-- Enable RLS
ALTER TABLE printify_product_configs ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Public read access for active products"
  ON printify_product_configs
  FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admin full access"
  ON printify_product_configs
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Insert seed data
INSERT INTO printify_product_configs (product_name, product_type, description, price_cents, printify_blueprint_id, printify_print_provider_id, printify_variant_id, display_order, is_active) VALUES
  ('Canvas 11x14', 'canvas-11x14', 'Museum-quality canvas print, ready to hang', 4500, 1061, 66, 55537, 1, true),
  ('Ceramic Mug 15oz', 'mug-15oz', 'Premium ceramic mug with vibrant colors', 1995, 478, 99, 51358, 2, true),
  ('Digital Download', 'digital', 'High-resolution digital files for personal use', 0, 0, 0, 0, 3, true)
ON CONFLICT (product_type) DO NOTHING;

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_product_configs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_product_configs_updated_at
  BEFORE UPDATE ON printify_product_configs
  FOR EACH ROW
  EXECUTE FUNCTION update_product_configs_updated_at();
