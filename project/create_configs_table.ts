/**
 * Quick script to create the printify_product_configs table
 * Run with: npx tsx create_configs_table.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing environment variables!');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function createTable() {
    console.log('🚀 Creating printify_product_configs table...\n');

    // First, check if table already exists
    const { data: existing } = await supabase
        .from('printify_product_configs')
        .select('id')
        .limit(1);

    if (existing) {
        console.log('✅ Table already exists! Checking for seed data...');

        const { data: products } = await supabase
            .from('printify_product_configs')
            .select('*');

        console.log(`Found ${products?.length || 0} products in table`);
        if (products && products.length > 0) {
            console.log('\nExisting products:');
            products.forEach(p => console.log(`  - ${p.product_name} (${p.product_type})`));
        }
        return;
    }

    console.log('❌ Table does not exist.');
    console.log('\n📋 Please run this SQL in your Supabase SQL Editor:\n');
    console.log('='.repeat(80));
    console.log(`
-- Create printify_product_configs table
CREATE TABLE printify_product_configs (
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
CREATE INDEX idx_product_configs_type ON printify_product_configs(product_type);
CREATE INDEX idx_product_configs_active ON printify_product_configs(is_active);
CREATE INDEX idx_product_configs_order ON printify_product_configs(display_order);

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
  ('Digital Download', 'digital', 'High-resolution digital files for personal use', 0, 0, 0, 0, 3, true);

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
`.trim());
    console.log('='.repeat(80));
    console.log('\n📍 Steps:');
    console.log('1. Go to https://supabase.com/dashboard/project/[your-project]/sql/new');
    console.log('2. Copy the SQL above');
    console.log('3. Paste and click "Run"');
    console.log('4. Run this script again to verify: npx tsx create_configs_table.ts\n');
}

createTable()
    .then(() => {
        console.log('\n✨ Done!');
        process.exit(0);
    })
    .catch(err => {
        console.error('Error:', err);
        process.exit(1);
    });
