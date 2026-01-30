
import { createClient } from '@supabase/supabase-js';
import { generateImagesForOrder } from '../src/lib/ai/generation';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
// Load env before other imports
dotenv.config({ path: '.env.local' });
// Manually import internal helpers to bypass next/cache issues if any
import { uploadFile, getPublicUrl } from '../src/lib/supabase/storage';

// Mock Supabase Admin
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: {
        autoRefreshToken: false,
        persistSession: false,
    }
});

async function run() {
    console.log("🧪 Starting E2E Simulation (Headless)...");

    try {
        // 1. Read Test Image
        const localPath = path.join(process.cwd(), 'public', 'test-dog.jpg');
        console.log(`📂 Reading image from: ${localPath}`);
        if (!fs.existsSync(localPath)) {
            throw new Error("Test image not found at public/test-dog.jpg");
        }
        const fileBuffer = fs.readFileSync(localPath);

        // 2. Upload to Storage
        const timestamp = Date.now();
        const uploadPath = `uploads/e2e-test-${timestamp}/test_dog.jpg`;
        console.log(`☁️ Uploading to Supabase Storage: ${uploadPath}`);

        await uploadFile(uploadPath, fileBuffer);
        const publicUrl = getPublicUrl(uploadPath);
        console.log(`✅ Image Uploaded: ${publicUrl}`);

        // 3. Create Order
        const newOrder = {
            customer_name: "E2E Headless User",
            customer_email: "headless_test@example.com",
            pet_name: "Barkley-Headless",
            pet_breed: "Labrador",
            pet_details: "Friendly gaze, bright eyes",
            pet_image_url: publicUrl,
            product_type: "Royalty", // Valid theme
            status: "pending",
            payment_status: "paid",
            order_number: `HEADLESS-${timestamp}`
        };

        console.log("📝 Creating Order in DB...");
        const { data: order, error: orderError } = await supabase
            .from('orders')
            .insert(newOrder)
            .select()
            .single();

        if (orderError) throw new Error(`Order creation failed: ${orderError.message}`);
        console.log(`✅ Order Created: ${order.id}`);

        // 4. Trigger Generation
        console.log("🚀 Triggering AI Generation...");

        await generateImagesForOrder(
            order.id,
            order.pet_image_url,
            order.product_type,
            order.pet_breed,
            order.pet_details,
            false, // REAL AI
            order.pet_name
        );

        console.log("✨ Simulation Complete!");

    } catch (e: any) {
        console.error("❌ Simulation Failed:", e);
        process.exit(1);
    }
}

run();
