import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const SQL = `
-- Create printify_product_configs table
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
CREATE POLICY IF NOT EXISTS "Public read access for active products"
  ON printify_product_configs
  FOR SELECT
  USING (is_active = true);

CREATE POLICY IF NOT EXISTS "Admin full access"
  ON printify_product_configs
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Insert seed data
INSERT INTO printify_product_configs (
  product_name, 
  product_type, 
  description, 
  price_cents, 
  printify_blueprint_id, 
  printify_print_provider_id, 
  printify_variant_id, 
  display_order, 
  is_active
) VALUES
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

CREATE TRIGGER IF NOT EXISTS set_product_configs_updated_at
  BEFORE UPDATE ON printify_product_configs
  FOR EACH ROW
  EXECUTE FUNCTION update_product_configs_updated_at();
`;

async function executeSQL() {
    console.log('🚀 Executing SQL migration via Supabase Management API...\n');

    // Extract project reference from URL
    const projectRef = supabaseUrl.replace('https://', '').split('.')[0];

    console.log('Project reference:', projectRef);
    console.log('Executing SQL...\n');

    try {
        const response = await fetch(
            `https://api.supabase.com/v1/projects/${projectRef}/database/query`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${supabaseServiceKey}`,
                    'Content-Type': 'application/json',
                    'apikey': supabaseServiceKey
                },
                body: JSON.stringify({ query: SQL })
            }
        );

        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ API Error:', response.status, response.statusText);
            console.error('Response:', errorText);

            console.log('\n💡 Alternative: Use Supabase CLI');
            console.log('If you have Supabase CLI installed, run:');
            console.log('  supabase db push');
            console.log('\nOr copy the SQL from create_product_configs.sql and run it manually in Supabase SQL Editor.');
            process.exit(1);
        }

        const result = await response.json();
        console.log('✅ SQL executed successfully!');
        console.log('Result:', JSON.stringify(result, null, 2));

    } catch (error: any) {
        console.error('❌ Error:', error.message);
        console.log('\n📋 Please run this SQL manually in Supabase SQL Editor:');
        console.log('https://supabase.com/dashboard/project/' + projectRef + '/sql/new');
        console.log('\nSQL to run:');
        console.log('='.repeat(80));
        console.log(SQL);
        console.log('='.repeat(80));
        process.exit(1);
    }
}

executeSQL();
