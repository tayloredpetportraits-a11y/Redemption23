
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

// Load env vars
dotenv.config({ path: '.env.local' });

// Import the function to test
import { generateImagesForOrder } from '../src/lib/ai/generation';

async function runTest() {
    console.log("🛁 Starting Shopify 'Spa Day' Simulation...");

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // 1. Prepared Data (Simulating Shopify Order Data)
    const petName = "Winston";
    const breed = "English Bulldog";
    const details = "Wrinkly, white and brown, looking forward, very relaxed";
    const customerEmail = "spaday_lover@example.com";
    const customerName = "Spa Enthusiast";

    // Use the real test image
    const dogPath = path.join(process.cwd(), 'public', 'assets', 'test_bulldog.jpg');
    if (!fs.existsSync(dogPath)) {
        console.error("❌ Test dog image not found at " + dogPath);
        process.exit(1);
    }
    const dogBuffer = fs.readFileSync(dogPath);

    // 2. Upload to Storage (Simulating Shopify CDN / Copying to our storage)
    const timestamp = Date.now();
    const storagePath = `uploads/pets/spaday_winston_${timestamp}.jpg`;

    console.log(`📸 Uploading customer photo to: ${storagePath}...`);
    const { error: uploadError } = await supabase.storage.from('primary-images').upload(storagePath, dogBuffer, {
        contentType: 'image/jpeg',
        upsert: true
    });

    if (uploadError) {
        console.error("❌ Upload failed:", uploadError);
        process.exit(1);
    }

    const { data: { publicUrl } } = supabase.storage.from('primary-images').getPublicUrl(storagePath);
    console.log(`🔗 Image Ready: ${publicUrl}`);

    // 3. Create Order (Simulating Webhook Insertion)
    console.log("📦 Creating Order Record...");
    const { data: order, error: orderError } = await supabase.from('orders').insert({
        customer_email: customerEmail,
        customer_name: customerName,
        product_type: 'spaday', // THEME SELECTED
        pet_image_url: publicUrl,
        status: 'pending',
        pet_breed: breed,
        pet_name: petName,
        pet_details: details,
        payment_status: 'paid'
    }).select().single();

    if (orderError) {
        console.error("❌ Order creation failed:", orderError);
        process.exit(1);
    }

    console.log(`✅ Order Created: ${order.id}`);
    console.log(`👉 Admin Link: http://localhost:3000/admin/orders/${order.id}`);

    // 4. Trigger AI Service (Simulating Webhook Trigger)
    console.log("🎨 Triggering AI Service (Spa Day Theme)...");
    try {
        await generateImagesForOrder(
            order.id,
            publicUrl,
            'spaday', // Theme
            breed,
            details,
            false, // autoApprove = false (Real flow usually requires approval)
            petName
        );
        console.log("✨ Service Finished. Images await approval.");
    } catch (e) {
        console.error("❌ Generation failed:", e);
        process.exit(1);
    }
}

runTest();
