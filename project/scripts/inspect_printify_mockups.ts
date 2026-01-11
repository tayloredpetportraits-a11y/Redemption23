
import { PrintifyService } from '@/lib/printify/service';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: '.env.local' });

async function inspectMockups() {
    console.log('Inspecting Printify Mockups for Canvas 11x14 (Blueprint 1159)...');

    // Use a placeholder image (or real one)
    const imageUrl = 'https://opxgicxdrbpgpsxonogk.supabase.co/storage/v1/object/public/primary-images/temp/temp_printify_1768074611364.png';
    // ^ Reusing a known good URL from previous logs to avoid upload step issues if possible, 
    // or we can use a fresh one. Let's use the standard "upload" flow just in case.

    // Actually, let's just use the Service details but LOG the raw product response.
    // I can't easily modify the service to log without changing code.
    // So I will implement a raw check here.

    const SHOP_ID = process.env.PRINTIFY_SHOP_ID;
    const TOKEN = process.env.PRINTIFY_API_TOKEN;
    const BASE_URL = 'https://api.printify.com/v1';

    if (!SHOP_ID || !TOKEN) {
        console.error('Missing Env Vars');
        return;
    }

    // 1. Upload Image (We reuse a random heavy one or just a placeholder)
    // We'll skip upload if we have a URL, but let's just assume we want to see the options.
    // We need a valid upload ID to create a product.

    console.log('Uploading temporary image...');
    const uploadRes = await fetch(`${BASE_URL}/uploads/images.json`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${TOKEN}`
        },
        body: JSON.stringify({
            file_name: "temp_inspect.png",
            url: "https://placehold.co/1000x1400.png" // Simple placeholder
        })
    });

    const uploadData = await uploadRes.json();
    if (!uploadData.id) {
        console.error('Upload failed:', uploadData);
        return;
    }
    const imageId = uploadData.id;
    console.log(`Image ID: ${imageId}`);

    // 2. Create Product (Blueprint 1159, Provider 105, Variant 91641)
    const createPayload = {
        title: "Mockup Inspection " + Date.now(),
        description: "Temp",
        blueprint_id: 1159,
        print_provider_id: 105,
        variants: [
            { id: 91641, price: 1000, is_enabled: true }
        ],
        print_areas: [
            {
                variant_ids: [91641],
                placeholders: [
                    {
                        position: "front",
                        images: [
                            {
                                id: imageId,
                                x: 0.5,
                                y: 0.5,
                                scale: 1,
                                angle: 0
                            }
                        ]
                    }
                ]
            }
        ]
    };

    console.log('Creating Product...');
    const prodRes = await fetch(`${BASE_URL}/shops/${SHOP_ID}/products.json`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${TOKEN}` },
        body: JSON.stringify(createPayload)
    });

    const product = await prodRes.json();
    console.log(`Product Created: ${product.id}`);

    // 3. List Images
    if (product.images) {
        console.log('\n--- AVAILABLE MOCKUPS ---');
        product.images.forEach((img: any, idx: number) => {
            console.log(`\n[${idx}] Is Default: ${img.is_default}`);
            console.log(`Src: ${img.src}`);
            console.log(`Variant IDs: ${img.variant_ids.join(', ')}`);
        });
        console.log('-------------------------\n');
    } else {
        console.log('No images found immediately. Waiting 2s...');
        await new Promise(r => setTimeout(r, 2000));
        // Refetch
        const getRes = await fetch(`${BASE_URL}/shops/${SHOP_ID}/products/${product.id}.json`, {
            headers: { 'Authorization': `Bearer ${TOKEN}` }
        });
        const fullProd = await getRes.json();
        console.log('\n--- AVAILABLE MOCKUPS (Refetch) ---');
        fullProd.images.forEach((img: any, idx: number) => {
            console.log(`\n[${idx}] Is Default: ${img.is_default}`);
            console.log(`Src: ${img.src}`);
        });
    }

    // 4. Cleanup
    console.log('Deleting Temp Product...');
    await fetch(`${BASE_URL}/shops/${SHOP_ID}/products/${product.id}.json`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${TOKEN}` }
    });
    console.log('Done.');
}

inspectMockups();
