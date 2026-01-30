'use server';

import { createAdminClient } from "@/lib/supabase/server";
import { generateImagesForOrder } from "@/lib/ai/generation";
import fs from "fs";
import path from "path";
import { uploadFile, getPublicUrl } from "@/lib/supabase/storage";
import { revalidatePath } from "next/cache";

export async function simulateShopifyOrder() {
    console.log("🧪 Starting E2E Simulation...");
    const supabase = createAdminClient();

    try {
        // 1. Read Test Image
        const localPath = path.join(process.cwd(), 'public', 'test-dog.jpg');
        console.log(`📂 Reading image from: ${localPath}`);
        if (!fs.existsSync(localPath)) {
            throw new Error("Test image not found at public/test-dog.jpg");
        }
        const fileBuffer = fs.readFileSync(localPath);

        // 2. Upload to Storage (Mimic User Upload)
        const timestamp = Date.now();
        const uploadPath = `uploads/e2e-test-${timestamp}/test_dog.jpg`;
        console.log(`☁️ Uploading to Supabase Storage: ${uploadPath}`);

        await uploadFile(uploadPath, fileBuffer);
        const publicUrl = getPublicUrl(uploadPath);
        console.log(`✅ Image Uploaded: ${publicUrl}`);

        // 3. Create Order
        const newOrder = {
            customer_name: "E2E Simulation User",
            customer_email: "e2e_simulation@test.com",
            pet_name: "Barkley",
            pet_breed: "Labrador",
            pet_details: "Friendly gaze",
            pet_image_url: publicUrl,
            product_type: "Royalty",
            status: "pending",
            payment_status: "paid",
            order_number: `SIM-${timestamp}`
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
        // Fire and forget? No, let's await it to prove it works in the test connection.
        // In real webhooks we might await or offload.

        await generateImagesForOrder(
            order.id,
            order.pet_image_url,
            order.product_type,
            order.pet_breed,
            order.pet_details,
            false, // REAL AI
            order.pet_name
        );

        console.log("✨ Simulation Complete! Images are generating.");
        revalidatePath('/admin');
        return { success: true, orderId: order.id };

    } catch (e: any) {
        console.error("❌ Simulation Failed:", e);
        return { success: false, error: e.message };
    }
}
