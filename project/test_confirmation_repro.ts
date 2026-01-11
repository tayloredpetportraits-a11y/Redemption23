
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { PrintifyService } from './src/lib/printify/service'; // Relative path

dotenv.config({ path: '.env.local' });

async function runTest() {
    console.log("🚀 Starting Confirmation Repro Test (Full Flow)...");

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // 1. Create a dummy order
    console.log("🛒 Creating Dummy Order...");
    const { data: order, error: orderError } = await supabase.from('orders').insert({
        customer_email: `repro_500_${Date.now()}@example.com`,
        customer_name: 'Repro Tester',
        product_type: 'royalty-canvas',
        status: 'pending',
        payment_status: 'paid'
    }).select().single();

    if (orderError) {
        console.error("❌ Order creation failed:", orderError);
        process.exit(1);
    }
    console.log(`✅ Order created: ${order.id}`);

    // Create a dummy image
    const { data: image } = await supabase.from('images').insert({
        order_id: order.id,
        url: 'https://placehold.co/600x400.jpg', // Dummy URL
        type: 'primary',
        status: 'completed',
        storage_path: 'dummy/path.jpg' // Required
    }).select().single();

    if (!image) {
        console.error("❌ Failed to create image");
        process.exit(1);
    }

    // 2. Simulate DB Update (Already tested, but let's allow it)
    console.log(`📝 Attempting DB Update...`);
    const { error: updateError } = await supabase
        .from('orders')
        .update({
            selected_image_id: image.id,
            selected_print_product: 'canvas-11x14',
            status: 'ready'
        })
        .eq('id', order.id);

    if (updateError) {
        console.error("❌ DB Update FAILED:", updateError);
        process.exit(1);
    }
    console.log("✅ DB Update SUCCEEDED!");

    // 3. Simulate Printify Service Call
    console.log("🖨️ Attempting Printify Service Call...");

    // We expect this might return null if keys are missing or API fails, but it should NOT throw.
    try {
        const result = await PrintifyService.createOrder({
            orderId: order.id,
            customerEmail: order.customer_email,
            customerName: order.customer_name,
            imageUrl: image.url,
            productType: 'canvas-11x14'
        });
        console.log(`✅ Printify Service returned: ${result}`);
    } catch (e) {
        console.error("❌ Printify Service CRASHED (Threw Error):", e);
        process.exit(1);
    }
}

runTest().catch(console.error);
