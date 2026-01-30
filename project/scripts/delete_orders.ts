
import { createAdminClient } from '../src/lib/supabase/server';
import dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function clearOrders() {
    console.log('🧹 Clearing All Orders...');

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
        console.error('❌ Missing Supabase credentials in .env.local');
        return;
    }

    const supabase = createAdminClient();

    // Delete all images first (cascade usually handles this, but being safe)
    const { error: imageError } = await supabase.from('images').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (imageError) console.error('⚠️ Image cleanup error:', imageError.message);
    else console.log('✅ Cleared images');

    // Delete all orders
    const { error: orderError } = await supabase.from('orders').delete().neq('id', '00000000-0000-0000-0000-000000000000');

    if (orderError) {
        console.error('❌ Order cleanup Failed:', orderError);
    } else {
        console.log(`✅ Successfully cleared all orders.`);
    }
}

clearOrders();
