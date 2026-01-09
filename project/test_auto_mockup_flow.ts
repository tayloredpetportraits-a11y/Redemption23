import { config } from 'dotenv';
config({ path: '.env.local' });
import { createAdminClient } from './src/lib/supabase/server';
import { generateProductMockup } from './src/lib/ai/generation';
import fs from 'fs';
import path from 'path';

// Note: We can't use 'fetch' to call our own Next.js API easily from a standalone script without the server running and knowing the port.
// However, since we are in the same codebase, we can arguably import the logic OR just assume the dev server is at localhost:3000.
// Let's assume localhost:3000 is running (User metadata says it is).

const SERVER_URL = 'http://localhost:3000';

async function runTest() {
    const supabase = createAdminClient();

    console.log("1. Creating Test Order (Wiener Dog)...");
    const { data: order, error: orderError } = await supabase.from('orders').insert({
        customer_email: 'test_dog_lover@example.com',
        customer_name: 'Testy McTesterson',
        pet_name: 'Sausage',
        pet_breed: 'Dachshund',
        pet_details: 'Long and cute',
        status: 'pending'
    }).select().single();

    if (orderError) throw orderError;
    console.log(`   Order Created: ${order.id}`);

    console.log("2. Uploading/Seeding Primary Portrait (Pending)...");

    // Use an existing valid image as the source "Pet"
    const sourcePath = path.join(process.cwd(), 'public', 'assets', 'mockups', 'canvas_mockup.png');

    if (!fs.existsSync(sourcePath)) {
        throw new Error(`Source image not found at ${sourcePath}`);
    }

    const portraitFilename = `test_generated_${Date.now()}.png`;
    const outputDir = path.join(process.cwd(), 'public', 'generated', order.id);
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

    const portraitPath = path.join(outputDir, portraitFilename);
    fs.copyFileSync(sourcePath, portraitPath);

    // Insert into DB as PENDING
    const { data: image, error: imgError } = await supabase.from('images').insert({
        order_id: order.id,
        url: `/generated/${order.id}/${portraitFilename}`,
        storage_path: `generated/${order.id}/${portraitFilename}`,
        type: 'primary',
        status: 'pending_review',
        display_order: 1
    }).select().single();

    if (imgError) throw imgError;
    console.log(`   Portrait Seeded: ${image.id} (Pending Review)`);


    console.log(`3. SIMULATING ADMIN: Clicking 'Approve & Build' for image ${image.id}...`);
    // Call the API endpoint
    try {
        const response = await fetch(`${SERVER_URL}/api/admin/images/${image.id}/approve`, {
            method: 'POST'
        });

        if (!response.ok) {
            const text = await response.text();
            throw new Error(`API Failed: ${response.status} ${text}`);
        }

        const result = await response.json();
        console.log("   API Response:", result);
    } catch (e) {
        console.error("   Failed to call API. Is localhost:3000 running?");
        throw e;
    }

    console.log("4. Verifying Mockups in Database...");
    // Poll for a few seconds
    let attempts = 0;
    while (attempts < 10) {
        await new Promise(r => setTimeout(r, 2000));
        const { data: mockups } = await supabase
            .from('images')
            .select('*')
            .eq('order_id', order.id)
            .eq('type', 'mockup');

        if (mockups && mockups.length >= 3) {
            console.log(`   SUCCESS! Found ${mockups.length} mockups.`);
            mockups.forEach(m => console.log(`    - ${m.metadata.product_type}: ${m.url}`));

            console.log("\nTEST COMPLETE.");
            console.log(`Admin Link: ${SERVER_URL}/admin/orders/${order.id}`);
            console.log(`Customer Link: ${SERVER_URL}/customer/gallery/${order.id}`);
            return;
        }
        console.log(`   Waiting for mockups... (${mockups?.length || 0} found)`);
        attempts++;
    }

    console.error("   TIMEOUT: Mockups were not generated in time.");
}

runTest().catch(console.error);
