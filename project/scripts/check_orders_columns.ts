
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkOrders() {
    // We can't easily query information_schema via JS client usually, 
    // but we can try to select * limit 1 and see keys.
    const { data, error } = await supabase.from('orders').select('*').limit(1);
    if (error) {
        console.error("Error:", error);
        return;
    }
    if (!data || data.length === 0) {
        console.log("No orders found, cannot check columns by key inspection.");
        return;
    }
    console.log("Order Keys:", Object.keys(data[0]));
}

checkOrders();
