import { config } from 'dotenv';
config({ path: '.env.local' });
import { createAdminClient } from './src/lib/supabase/server';

async function cleanup() {
    const supabase = createAdminClient();

    // Delete orders for 'Sausage' (The test dog name used in scripts)
    const { data: orders, error } = await supabase
        .from('orders')
        .select('id, pet_name')
        .or('pet_name.eq.Sausage,pet_name.eq.Beatrix');

    if (error) throw error;

    console.log(`Found ${orders.length} test orders to delete.`);

    for (const order of orders) {
        // Delete images first (cascade might handle it, but being safe)
        await supabase.from('images').delete().eq('order_id', order.id);

        // Delete order
        await supabase.from('orders').delete().eq('id', order.id);
        console.log(`Deleted order ${order.id}`);
    }
}

cleanup().catch(console.error);
