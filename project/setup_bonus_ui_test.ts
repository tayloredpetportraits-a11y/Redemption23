
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

dotenv.config({ path: '.env.local' });

async function setupBonusTest() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const timestamp = Date.now();
    const email = `bonus_tester_${timestamp} @example.com`;
    const primaryImageId = crypto.randomUUID();

    // 1. Create Order (without selected_image_id first)
    const { data: order, error: orderError } = await supabase.from('orders').insert({
        customer_email: email,
        customer_name: 'Bonus Tester',
        product_type: 'royalty-canvas',
        pet_name: 'Sparky',
        status: 'pending',
        // If we want to skip directly to Step 3, we might need to manipulate the order state or the component state.
        // The component CustomerGallery.tsx logic: 
        // if (order.selected_image_id && order.selected_print_product) setCurrentStep(3);
        // So let's set these to simulate a user who has already redeemed.
        selected_print_product: 'canvas-11x14',
        bonus_unlocked: false
    }).select().single();

    if (orderError) throw orderError;

    console.log(`Order created: ${order.id}`);

    // 2. Insert Images (Mock)
    const images = [];

    // Primary
    for (let i = 1; i <= 5; i++) {
        const id = i === 1 ? primaryImageId : crypto.randomUUID();
        images.push({
            id: id,
            order_id: order.id,
            url: `https://placehold.co/600x600?text=Primary+${i}`,
            type: 'primary',
            display_order: i,
            status: 'completed',
            storage_path: `mock/path/primary-${i}.jpg`
        });
    }

    // Bonus (Locked)
    for (let i = 1; i <= 5; i++) {
        images.push({
            id: crypto.randomUUID(),
            order_id: order.id,
            url: `https://placehold.co/600x600/orange/white?text=Bonus+${i}`,
            watermarked_url: `https://placehold.co/600x600/gray/white?text=Locked+${i}`,
            type: 'upsell',
            theme_name: 'Neon Pop',
            display_order: i,
            status: 'completed',
            is_bonus: true,
            storage_path: `mock/path/bonus-${i}.jpg`
        });
    }

    const { error: imgError } = await supabase.from('images').insert(images);
    if (imgError) throw imgError;

    // 3. Update Order with Selected Image
    const { error: updateError } = await supabase.from('orders').update({
        selected_image_id: primaryImageId
    }).eq('id', order.id);

    if (updateError) throw updateError;

    console.log(`http://localhost:3000/customer/gallery/${order.id}`);
}

setupBonusTest().catch(console.error);
