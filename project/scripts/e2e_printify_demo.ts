
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
// Use explicit path for local execution with tsx
import { generateImagesForOrder } from '../src/lib/ai/generation.ts';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

// Admin client for overriding RLS
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false }
});

async function e2ePrintifyDemo() {
    // 1. Setup Data
    const customerEmail = `demo_user_${Date.now()}@example.com`;
    const petName = 'PrintifyDog';
    // Using a known image that exists in public/uploads/pets or similar
    // We'll use the one we kept seeing in logs or a reliable placeholder if local file is missing.
    // Let's assume 'public/generated/bc267425-da83-41b0-a6e0-89b1ecdab412/primary_swap_0.png' exists since we used it before?
    // Actually, `generateImagesForOrder` expects a path in `public`. 
    // Let's check if there is a generic one. 
    // setup_real_test_order used '/uploads/pets/beatrix_test.jpg'. I'll try to rely on that existing or just use a remote URL?
    // generateImagesForOrder supports remote URL.

    // Remote placeholder that looks like a dog
    const petPhotoUrl = 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80';

    console.log('🚀 Creating E2E Printify Demo Order...');

    // 2. Create Order
    const { data: order, error } = await supabase
        .from('orders')
        .insert({
            customer_email: customerEmail,
            customer_name: 'Demo User',
            pet_name: petName,
            pet_image_url: petPhotoUrl,
            status: 'pending',
            payment_status: 'paid',
            product_type: 'royalty-canvas', // KEY: Triggers Canvas Mockups
            pet_breed: 'Golden Retriever',
            pet_details: 'Standard'
        })
        .select()
        .single();

    if (error) {
        console.error('Error creating order:', error);
        return;
    }

    console.log(`✅ Order created: ${order.id}`);

    // 3. Generate Images (This triggers Printify Multi-View)
    console.log('🎨 Starting AI Generation & Printify Multi-View (Wait ~30s)...');
    try {
        await generateImagesForOrder(order.id, petPhotoUrl, 'royalty-canvas', 'Golden Retriever', 'Standard', true);
        console.log('✨ Generation Complete!');
        console.log(`👉 BROWSER URL: http://localhost:3000/customer/gallery/${order.id}`);
    } catch (e) {
        console.error('❌ AI Generation Failed:', e);
    }
}

e2ePrintifyDemo();
