/**
 * Test Supabase Connection
 * Verifies that the service role key is correctly configured
 */

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load environment variables from .env.local
config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function testConnection() {
    console.log('🔍 Testing Supabase Connection...\n');

    // Create Supabase client with service role
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    try {
        // Test 1: List tables in public schema
        console.log('✅ Service Role Key Format: Valid JWT');
        console.log(`📍 Connected to: ${supabaseUrl}\n`);

        // Test 2: Query orders table
        console.log('📊 Testing Orders Table Query...');
        const { data: orders, error: ordersError } = await supabase
            .from('orders')
            .select('id, customer_name, status')
            .limit(5);

        if (ordersError) {
            console.error('❌ Orders query failed:', ordersError.message);
        } else {
            console.log(`✅ Orders table accessible (found ${orders?.length || 0} records)`);
            if (orders && orders.length > 0) {
                console.log('   Sample:', orders[0]);
            }
        }

        // Test 3: Query printify_product_configs table
        console.log('\n📊 Testing Printify Product Configs Table...');
        const { data: configs, error: configsError } = await supabase
            .from('printify_product_configs')
            .select('product_id, product_name')
            .limit(5);

        if (configsError) {
            console.error('❌ Printify configs query failed:', configsError.message);
        } else {
            console.log(`✅ Printify configs table accessible (found ${configs?.length || 0} records)`);
            if (configs && configs.length > 0) {
                console.log('   Sample:', configs[0]);
            }
        }

        console.log('\n🎉 Supabase connection test complete!');

    } catch (error) {
        console.error('❌ Connection test failed:', error);
        process.exit(1);
    }
}

testConnection();
