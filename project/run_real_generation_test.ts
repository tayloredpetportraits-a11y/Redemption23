
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

// Load env vars
dotenv.config({ path: '.env.local' });

// Mock globals if needed or import directly
// We need to register ts-node provided modules??
// Actually, I'll rely on ts-node to run this.

// Import the function to test
// Note: We need to use relative paths for imports if we run this with ts-node from project root
import { generateImagesForOrder } from './src/lib/ai/generation';
// import { uploadFile, getPublicUrl } from './src/lib/supabase/storage'; // This might fail if it relies on other alias imports

// Redefine storage helpers to avoid Alias Resolution hell if tsconfig-paths not set up for the runner
// But let's try to assume ts-node respects tsconfig.json paths or I might need `tsconfig-paths/register`

async function runTest() {
    console.log("Starting E2E Test...");

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // 1. Prepared Data
    const dogPath = path.join(process.cwd(), 'public', 'uploads', 'pets', 'test_dog.jpg');
    if (!fs.existsSync(dogPath)) {
        console.error("Test dog image not found at " + dogPath);
        process.exit(1);
    }
    const dogBuffer = fs.readFileSync(dogPath);

    // 2. Upload to Storage (Simulate user upload)
    const timestamp = Date.now();
    const storagePath = `uploads/pets/e2e_test_${timestamp}.jpg`;

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
    console.log("Creating Order...");
    const { data: order, error: orderError } = await supabase.from('orders').insert({
        customer_email: 'e2e_tester@example.com',
        customer_name: 'E2E Tester',
        product_type: 'royalty',
        pet_image_url: publicUrl,
        status: 'pending',
        pet_breed: 'Golden Retriever',
        pet_details: 'Happy dog, smiling',
    }).select().single();

    if (orderError) {
        console.error("Order creation failed:", orderError);
        process.exit(1);
    }

    console.log(`Order created: ${order.id}`);

    // 4. Trigger Generation
    console.log("Triggering AI Generation...");
    try {
        await generateImagesForOrder(
            order.id,
            publicUrl, // Use the public URL we just created
            'royalty',
            'Golden Retriever',
            'Happy dog, smiling',
            false // autoApprove
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
    } else {
        console.error("TEST FAILED: No images found.");
        process.exit(1);
    }
}

runTest();
