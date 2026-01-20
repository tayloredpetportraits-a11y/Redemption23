
import { createClient } from '@supabase/supabase-js';
import { generateImagesForOrder } from '../src/lib/ai/generation';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function forceGen() {
    // Target the specific order from the user's issue
    const orderId = 'bceff3c5-133d-4560-9573-e0521c249862';

    console.log(`Fetching order ${orderId}...`);
    const { data: order } = await supabase.from('orders').select('*').eq('id', orderId).single();

    if (!order) {
        console.error("Order not found!");
        return;
    }

    console.log("Order found. Triggering generation...");
    console.log("Pet URL:", order.pet_image_url);
    console.log("Product Type:", order.product_type);

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
