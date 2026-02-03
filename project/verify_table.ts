import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '.env.local') });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function refreshCacheAndTest() {
    console.log('📊 Checking database state...\n');

    // Try to get data from the table
    console.log('1️⃣ Testing direct query to printify_product_configs...');
    const { data: configs, error: configError } = await supabase
        .from('printify_product_configs')
        .select('*');

    if (configError) {
        console.error('❌ Error querying printify_product_configs:', configError);
        console.log('\nThis likely means the table doesn\'t exist yet in Supabase.');
        console.log('\n🚨 IMPORTANT: Please run the SQL in Supabase SQL Editor manually.');
        console.log('The browser agent ran it, but something went wrong.\n');
    } else {
        console.log(`✅ Success! Found ${configs?.length || 0} products`);
        if (configs && configs.length > 0) {
            console.log('\nProducts:');
            configs.forEach((p: any) => {
                console.log(`  • ${p.product_name} (${p.product_type}) - $${p.price_cents / 100}`);
            });
        }
    }

    // Also check the old table to verify it exists
    console.log('\n2️⃣ Checking existing printify_products table...');
    const { data: products, error: productsError } = await supabase
        .from('printify_products')
        .select('id, title')
        .limit(3);

    if (productsError) {
        console.error('❌ Error:', productsError);
    } else {
        console.log(`✅ Found ${products?.length || 0} rows in printify_products`);
    }
}

refreshCacheAndTest().then(() => process.exit());
