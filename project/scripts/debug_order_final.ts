
import { createClient } from '@supabase/supabase-js';
import { generateImagesForOrder } from '../src/lib/ai/generation';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function forceGen() {
    // Target the specific "final" order id ending in 5e5cfa73...
    // I'll fetch it dynamically to be sure
    const { data: orders } = await supabase.from('orders').select('*').order('created_at', { ascending: false }).limit(1);
    const order = orders && orders[0];

    if (!order) {
        console.error("No recent order found!");
        return;
    }

    console.log(`Targeting Order: ${order.id} (${order.customer_name})`);
    console.log("Pet URL:", order.pet_image_url);

    try {
        await generateImagesForOrder(
            order.id,
            order.pet_image_url,
            order.product_type || 'Manual Order',
            order.pet_breed || '',
            order.pet_details || '',
            false
        );
        console.log("Generation completed successfully!");
    } catch (e) {
        console.error("GENERATION FAILED:", e);
    }
}

forceGen();
