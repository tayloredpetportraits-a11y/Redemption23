
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function getLatestOrder() {
    const { data: orders, error } = await supabase
        .from('orders')
        .select('id, customer_name')
        .order('created_at', { ascending: false })
        .limit(1);

    if (error) {
        console.error('Error fetching order:', error);
        return;
    }

    if (orders && orders.length > 0) {
        console.log(`Latest Order ID: ${orders[0].id}`);
        console.log(`Customer Name: ${orders[0].customer_name}`);
    } else {
        console.log('No orders found.');
    }
}

getLatestOrder();
