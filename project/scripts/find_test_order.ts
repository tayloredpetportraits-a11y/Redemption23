
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load env vars from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

function createAdminClient() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    return createClient(supabaseUrl, serviceRoleKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    });
}

async function findTestOrder() {
    console.log('🔍 Searching for test order...');

    const supabase = createAdminClient();

    // Query for orders that:
    // 1. Have product_type = 'digital-only' OR NULL
    // 2. Have NOT selected a print product yet (selected_print_product IS NULL)
    // 3. Have NOT converted on upsell yet (upsell_conversion IS FALSE)
    const { data: orders, error } = await supabase
        .from('orders')
        .select(`
            id, 
            customer_name, 
            pet_name, 
            product_type,
            status,
            images:images!images_order_id_fkey ( count )
        `)
        .is('selected_print_product', null)
        .eq('upsell_conversion', false)
        .limit(5);

    if (error) {
        console.error('❌ Error fetching orders:', error);
        return;
    }

    if (!orders || orders.length === 0) {
        console.log('⚠️ No matching orders found. You may need to create one.');
        return;
    }

    console.log('✅ Found suitable test orders:');
    orders.forEach(o => {
        // @ts-ignore
        const imgCount = o.images?.[0]?.count || 0;
        console.log(`- ID: ${o.id} | Name: ${o.customer_name} | Pet: ${o.pet_name} | Images: ${imgCount}`);
    });
}

findTestOrder();
