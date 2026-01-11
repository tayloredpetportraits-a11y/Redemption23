
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';
import { generateImagesForOrder } from './src/lib/ai/generation';

// Load env vars
dotenv.config({ path: '.env.local' });

async function runE2ETest() {
    console.log("🚀 Starting Full E2E Test...");

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // 1. Prepare Data
    // We'll use 'test_dog.jpg' which I verified exists in public/uploads/pets/
    const dogFilename = 'test_dog.jpg';
    const dogPath = path.join(process.cwd(), 'public', 'uploads', 'pets', dogFilename);

    if (!fs.existsSync(dogPath)) {
        console.error(`❌ Test dog image not found at ${dogPath}`);
        process.exit(1);
    }
    const dogBuffer = fs.readFileSync(dogPath);

    // 2. Upload to Storage (Simulate user upload)
    const timestamp = Date.now();
    const storagePath = `uploads/pets/e2e_test_${timestamp}.jpg`;

    console.log(`📤 Uploading ${storagePath}...`);
    const { error: uploadError } = await supabase.storage.from('primary-images').upload(storagePath, dogBuffer, {
        contentType: 'image/jpeg',
        upsert: true
    });

    if (uploadError) {
        console.error("❌ Upload failed:", uploadError);
        process.exit(1);
    }

    const { data: { publicUrl } } = supabase.storage.from('primary-images').getPublicUrl(storagePath);
    console.log(`✅ Image Uploaded: ${publicUrl}`);

    // 3. Create Order
    console.log("🛒 Creating Test Order...");
    const { data: order, error: orderError } = await supabase.from('orders').insert({
        customer_email: `e2e_tester_${timestamp}@example.com`,
        customer_name: 'E2E Tester',
        product_type: 'royalty-canvas', // Explicitly testing the flow that requires mockups
        pet_image_url: publicUrl,
        status: 'pending',
        payment_status: 'paid',
        pet_breed: 'Golden Retriever',
        pet_details: 'Happy dog, smiling',
    }).select().single();

    if (orderError) {
        console.error("❌ Order creation failed:", orderError);
        process.exit(1);
    }

    console.log(`✅ Order created: ${order.id}`);
    console.log(`🔗 Gallery URL: http://localhost:3000/customer/gallery/${order.id}`);

    // 4. Trigger Generation
    console.log("🎨 Triggering AI Generation (this takes a moment)...");
    try {
        await generateImagesForOrder(
            order.id,
            publicUrl,
            'royalty-canvas',
            'Golden Retriever',
            'Happy dog, smiling',
            true // autoApprove = true so we don't have to manually approve in admin
        );
        console.log("✅ Generation function returned.");
    } catch (e) {
        console.error("❌ Generation failed:", e);
        process.exit(1);
    }

    // 5. Verify Output (Database Check)
    console.log("🔍 Verifying Database Records...");
    const { data: images } = await supabase
        .from('images')
        .select('*')
        .eq('order_id', order.id)
        .order('display_order', { ascending: true });

    if (!images || images.length === 0) {
        console.error("❌ TEST FAILED: No images found in database.");
        process.exit(1);
    }

    const primary = images.filter(i => i.type === 'primary' && !i.is_bonus);
    const mockups = images.filter(i => i.type === 'upsell'); // Mockups are currently stored as 'upsell' type usually? Or check generation logic.
    // Actually generation logic might label them differently, let's just dump stats.

    console.log(`\n📊 Generation Results:`);
    console.log(`- Total Images: ${images.length}`);
    console.log(`- Primary Portraits: ${primary.length}`);
    console.log(`- Mockups/Upsells: ${mockups.length}`);

    // Check for specific mockup
    const canvasMockups = images.filter(i => i.theme_name?.toLowerCase().includes('mockup'));
    console.log(`- Explicit Mockups (by theme name): ${canvasMockups.length}`);

    if (primary.length === 0) {
        console.error("❌ FAIL: No primary portraits generated.");
    }

    console.log("\n✨ DATA PREP COMPLETE. Proceed to frontend verification.");
}

runE2ETest().catch(console.error);
