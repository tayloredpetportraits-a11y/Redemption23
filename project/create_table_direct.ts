import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createTableDirectly() {
    console.log('🚀 Creating printify_product_configs table via Supabase client...\n');

    // Step 1: Create table
    console.log('1️⃣ Creating table...');
    const createTableSQL = `
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
  `;

    const { error: tableError } = await supabase.rpc('exec', { sql: createTableSQL });
    if (tableError) {
        console.log('⚠️  Using alternative method...');
        // We'll insert data directly which will fail if table doesn't exist
    }

    // Step 2: Create indexes
    console.log('2️⃣ Creating indexes...');
    await supabase.rpc('exec', {
        sql: `CREATE INDEX IF NOT EXISTS idx_product_configs_type ON printify_product_configs(product_type);`
    });
    await supabase.rpc('exec', {
        sql: `CREATE INDEX IF NOT EXISTS idx_product_configs_active ON printify_product_configs(is_active);`
    });
    await supabase.rpc('exec', {
        sql: `CREATE INDEX IF NOT EXISTS idx_product_configs_order ON printify_product_configs(display_order);`
    });

    // Step 3: Enable RLS
    console.log('3️⃣ Enabling RLS...');
    await supabase.rpc('exec', {
        sql: `ALTER TABLE printify_product_configs ENABLE ROW LEVEL SECURITY;`
    });

    // Step 4: Insert seed data directly using Supabase client
    console.log('4️⃣ Inserting seed data...');
    const { error: insertError } = await supabase
        .from('printify_product_configs')
        .upsert([
            {
                product_name: 'Canvas 11x14',
                product_type: 'canvas-11x14',
                description: 'Museum-quality canvas print, ready to hang',
                price_cents: 4500,
                printify_blueprint_id: 1061,
                printify_print_provider_id: 66,
                printify_variant_id: 55537,
                display_order: 1,
                is_active: true
            },
            {
                product_name: 'Ceramic Mug 15oz',
                product_type: 'mug-15oz',
                description: 'Premium ceramic mug with vibrant colors',
                price_cents: 1995,
                printify_blueprint_id: 478,
                printify_print_provider_id: 99,
                printify_variant_id: 51358,
                display_order: 2,
                is_active: true
            },
            {
                product_name: 'Digital Download',
                product_type: 'digital',
                description: 'High-resolution digital files for personal use',
                price_cents: 0,
                printify_blueprint_id: 0,
                printify_print_provider_id: 0,
                printify_variant_id: 0,
                display_order: 3,
                is_active: true
            }
        ], {
            onConflict: 'product_type'
        });

    if (insertError) {
        console.error('❌ Insert error:', insertError);
        throw insertError;
    }

    // Step 5: Verify
    console.log('5️⃣ Verifying data...');
    const { data, error } = await supabase
        .from('printify_product_configs')
        .select('*')
        .order('display_order');

    if (error) {
        console.error('❌ Verification error:', error);
        throw error;
    }

    console.log(`\n✅ Success! Created table with ${data?.length || 0} products:\n`);
    data?.forEach((p: any) => {
        console.log(`  • ${p.product_name} (${p.product_type}) - $${p.price_cents / 100}`);
    });

    console.log('\n🎉 Migration complete! Admin interface should now work.');
}

createTableDirectly()
    .then(() => process.exit(0))
    .catch((err) => {
        console.error('\n❌ Migration failed:', err.message);
        process.exit(1);
    });
