
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkLatest() {
    const { data: orders } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1);

    if (!orders || orders.length === 0) {
        console.log("No orders found.");
        return;
    }

    const order = orders[0];
    console.log("Latest Order:", {
        id: order.id,
        customer: order.customer_name,
        pet: order.pet_name,
        status: order.status,
        created_at: order.created_at
    });

    const { data: images } = await supabase
        .from('images')
        .select('*')
        .eq('order_id', order.id)
        .or('status.eq.approved,status.eq.pending,is_bonus.eq.true');

    console.log(`[Exact Query] Found ${images?.length || 0} images.`);
}

checkLatest();
