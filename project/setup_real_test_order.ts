
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { generateImagesForOrder } from './src/lib/ai/generation';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function setupRealTestOrder() {
    const customerEmail = 'taylor.strong+beatrix_bonus@example.com';
    const petName = 'Beatrix';
    // Use the NEW copy we just made
    const petPhotoUrl = '/uploads/pets/beatrix_test.jpg';

    console.log('🚀 Creating FULL AI Test Order for Beatrix...');

    // 1. Create Order
    const { data: order, error } = await supabase
        .from('orders')
        .insert({
            customer_email: customerEmail,
            customer_name: 'Taylor Strong',
            pet_name: petName,
            pet_image_url: petPhotoUrl,
            status: 'pending',
            payment_status: 'paid',
            product_type: 'royalty-canvas',
            pet_breed: 'Dachshund',
            pet_details: 'Brown/Red short hair, floppy ears, sitting on couch'
        })
        .select()
        .single();

    if (error) {
        console.error('Error creating order:', error);
        return;
    }

    console.log(`✅ Order created: ${order.id}`);
    console.log(`🔗 Test URL: http://localhost:3000/customer/gallery/${order.id}`);
    console.log('🎨 Starting AI Generation (This may take 30-60s)...');

    // 2. Generate Images (Real AI)
    try {
        await generateImagesForOrder(order.id, petPhotoUrl, 'royalty-canvas', 'Dachshund', 'Brown fur', true); // Auto-Approve = true
        console.log('✨ Generation Complete! Check the gallery.');
    } catch (e) {
        console.error('❌ AI Generation Failed:', e);
    }
}

setupRealTestOrder();
