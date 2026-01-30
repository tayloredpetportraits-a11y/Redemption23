
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function simulateLifecycle() {
    console.log("🚀 Starting Full Lifecycle Simulation...");

    // 1. Create a Test Order
    const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
            customer_name: 'Simulated User',
            customer_email: 'simulated@example.com',
            pet_name: 'Simba-Sim',
            pet_image_url: 'https://images.unsplash.com/photo-1589924696195-6114b0b63c7f?w=800&auto=format&fit=crop', // A nice dog photo
            status: 'pending', // Pending == "Ready to Reveal" usually
            stripe_session_id: 'sim_session_' + Date.now()
        })
        .select()
        .single();

    if (orderError) {
        console.error("❌ Failed to create order:", orderError);
        return;
    }
    console.log(`✅ Order Created: ${order.id} for ${order.pet_name}`);

    // 2. Create 5 Standard Images (The "Base" Package)
    // Using valid Unsplash IDs for dogs/cats
    const validIds = [
        'photo-1543466835-00a7907e9de1',
        'photo-1537151608828-ea2b11777ee8',
        'photo-1583511655857-d19b40a7a54e',
        'photo-1583337130417-3346a1be7dee',
        'photo-1548199973-03cce0bbc87b'
    ];

    const baseImages = Array.from({ length: 5 }).map((_, i) => ({
        order_id: order.id,
        url: `https://images.unsplash.com/${validIds[i]}?auto=format&fit=crop&w=800`,
        storage_path: `mock/path/${order.id}/base_${i}.jpg`,
        type: 'primary',
        status: 'approved',
        is_bonus: false,
        display_order: i
    }));

    const { error: baseError } = await supabase.from('images').insert(baseImages);
    if (baseError) console.error("❌ Failed to create base images:", baseError);
    else console.log("✅ 5 Base Images Created");

    // 3. Create 5 Bonus Images (Locked & Watermarked)
    const bonusIds = [
        'photo-1514888286974-6c03e2ca1dba',
        'photo-1573865526739-10659fec78a5',
        'photo-1495360019602-e001c276375f',
        'photo-1533738363-b7f9aef128ce',
        'photo-1529778873920-4da4926a7071'
    ];

    const bonusImages = Array.from({ length: 5 }).map((_, i) => ({
        order_id: order.id,
        url: `https://images.unsplash.com/${bonusIds[i]}?auto=format&fit=crop&w=800`,
        watermarked_url: 'https://placehold.co/800x1000/000000/FFF?text=LOCKED+BONUS',
        storage_path: `mock/path/${order.id}/bonus_${i}.jpg`,
        type: 'primary',
        status: 'approved',
        is_bonus: true,
        display_order: 5 + i
    }));

    const { error: bonusError } = await supabase.from('images').insert(bonusImages);
    if (bonusError) console.error("❌ Failed to create bonus images:", bonusError);
    else console.log("✅ 5 Locked Bonus Images Created");

    // 4. Ensure Product Templates Exist
    const { data: existingTemplates } = await supabase.from('product_templates').select('*');
    if (!existingTemplates || existingTemplates.length === 0) {
        console.log("⚠️ No product templates found. seeding...");
        await supabase.from('product_templates').insert([
            {
                name: 'Gallery Canvas',
                overlay_url: 'https://placehold.co/600x800/png?text=Canvas+Overlay', // Needs to be transparent ideally
                purchase_link: 'https://printify.com',
                price_id: 'price_fake_1'
            },
            {
                name: 'Ceramic Mug',
                overlay_url: 'https://placehold.co/600x600/png?text=Mug+Overlay',
                purchase_link: 'https://printify.com',
                price_id: 'price_fake_2'
            }
        ]);
        console.log("✅ Product Templates Seeded");
    } else {
        console.log("✅ Product Templates already exist.");
    }

    console.log(`\n🎉 Simulation Complete!`);
    console.log(`👉 Test URL: http://localhost:3000/portal/${order.id}`);
}

simulateLifecycle();
