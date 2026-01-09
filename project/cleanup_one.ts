import { config } from 'dotenv';
config({ path: '.env.local' });
import { createAdminClient } from './src/lib/supabase/server';

async function cleanupSpecific() {
    const supabase = createAdminClient();
    const orderId = '2cf40073-f17a-4e44-8552-296978dc2cd4';

    await supabase.from('images').delete().eq('order_id', orderId);
    await supabase.from('orders').delete().eq('id', orderId);
    console.log(`Deleted order ${orderId}`);
}
cleanupSpecific();
