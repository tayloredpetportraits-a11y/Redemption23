
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function findLatest() {
    console.log('🔍 Searching for latest Spa Day order...');
    const { data: order } = await supabase
        .from('orders')
        .select('*')
        .eq('customer_email', 'full.test.754027067@example.com')
        .single();

    if (order) {
        console.log(`FOUND_ORDER_ID=${order.id}`);
        console.log(`SHOPIFY_ID=${order.shopify_order_id}`);
        console.log(`CUSTOMER=${order.customer_email}`);

        // Count images
        const { count } = await supabase.from('images').select('*', { count: 'exact', head: true }).eq('order_id', order.id);
        console.log(`IMAGE_COUNT=${count}`);
    } else {
        console.log('No orders found.');
    }
}

findLatest();
