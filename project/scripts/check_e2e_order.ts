import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function checkOrder() {
    const orderId = '05822ce8-51d5-46c6-8df3-6b2d10965365';

    // Get order details
    const { data: order } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single();

    console.log('Order details:', {
        id: order?.id,
        shopify_order_id: order?.shopify_order_id,
        customer_email: order?.customer_email,
        status: order?.status
    });

    // Get images
    const { data: images, count } = await supabase
        .from('images')
        .select('*', { count: 'exact' })
        .eq('order_id', orderId);

    console.log(`\nImages for order ${orderId}: ${count} total`);
    images?.forEach(img => console.log(`  - ${img.id}: ${img.type} (${img.status})`));
}

checkOrder();
