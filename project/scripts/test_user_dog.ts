
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

// Load env vars
dotenv.config({ path: '.env.local' });

// Import the function to test
import { generateImagesForOrder } from '../src/lib/ai/generation';

async function runTest() {
    console.log("Starting User Dog Verification Test...");

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // 1. Prepared Data (Provided by User)
    const dogPath = path.join(process.cwd(), 'public', 'assets', 'test_bulldog.jpg');
    if (!fs.existsSync(dogPath)) {
        console.error("Test dog image not found at " + dogPath);
        process.exit(1);
    }
    const dogBuffer = fs.readFileSync(dogPath);

    // 2. Upload to Storage (Simulate user upload)
    const timestamp = Date.now();
    const storagePath = `uploads/pets/verify_minimalist_bulldog_${timestamp}.jpg`;

    console.log(`Uploading ${storagePath}...`);
    const { error: uploadError } = await supabase.storage.from('primary-images').upload(storagePath, dogBuffer, {
        contentType: 'image/jpeg',
        upsert: true
    });

    if (uploadError) {
        console.error("Upload failed:", uploadError);
        process.exit(1);
    }

    const { data: { publicUrl } } = supabase.storage.from('primary-images').getPublicUrl(storagePath);
    console.log(`Image URL: ${publicUrl}`);

    // 3. Create Order
    console.log("Creating Test Order...");
    const { data: order, error: orderError } = await supabase.from('orders').insert({
        customer_email: 'minimalist_tester@example.com',
        customer_name: 'Bulldog Tester',
        product_type: 'minimalist', // Testing the minimalist theme fix specifically
        pet_image_url: publicUrl,
        status: 'pending',
        pet_breed: 'English Bulldog',
        pet_name: 'WINSTON', // Explicit name to test text overlay
        pet_details: 'Wrinkly english bulldog puppy, looking forward, white and brown',
    }).select().single();

    if (orderError) {
        console.error("Order creation failed:", orderError);
        process.exit(1);
    }

    console.log(`Order created: ${order.id}`);

    // 4. Trigger Generation
    console.log("Triggering AI Generation with Gemini 3.0 Pro Image...");
    try {
        await generateImagesForOrder(
            order.id,
            publicUrl, // Use the public URL we just created
            'minimalist',
            'English Bulldog',
            'Wrinkly english bulldog puppy, looking forward, white and brown',
            true, // autoApprove
            'WINSTON' // petName for text overlay
        );
        console.log("Generation function returned successfully.");
    } catch (e) {
        console.error("Generation failed:", e);
        process.exit(1);
    }

    // 5. Verify Output
    const { data: images } = await supabase.from('images').select('*').eq('order_id', order.id);
    console.log(`Found ${images?.length} images generated.`);

    if (images && images.length > 0) {
        console.log("TEST PASSED: Images generated.");
        console.log("Check the Admin Dashboard or Storage Bucket for Order ID: " + order.id);
    } else {
        console.error("TEST FAILED: No images found.");
        process.exit(1);
    }
}

runTest();
