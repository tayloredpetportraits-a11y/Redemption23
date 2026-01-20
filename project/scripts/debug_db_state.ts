
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function debugState() {
    console.log('🔍 Debugging DB State...');

    // 1. Check Orders
    const { data: orders } = await supabase.from('orders').select('*');
    console.log(`\n📋 Orders (${orders?.length || 0}):`);
    orders?.forEach(o => console.log(` - [${o.id}] ${o.customer_name} (Status: ${o.status})`));

    // 2. Check Images
    const { data: images } = await supabase.from('images').select('id, order_id, status, type, url');
    console.log(`\n🖼️  Images (${images?.length || 0}):`);
    images?.forEach(i => console.log(` - [${i.id}] Status: ${i.status} | Order: ${i.order_id}`));

    if (images?.length && orders?.length) {
        // Check linkage
        const orphanImages = images.filter(i => !orders.find(o => o.id === i.order_id));
        if (orphanImages.length > 0) {
            console.log(`\n⚠️ Found ${orphanImages.length} Orphan Images (No matching Order ID)!`);
        } else {
            console.log('\n✅ All images link to valid orders.');
        }
    }
}

debugState();
