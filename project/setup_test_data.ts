
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { generateImagesForOrder } from './src/lib/ai/generation';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function setupTestOrder() {
    const customerEmail = 'tester@example.com';
    const petName = 'Buddy';
    const petPhotoUrl = '/uploads/pets/test_dog.jpg';

    console.log('Creating test order...');

    // 1. Create Order
    const { data: order, error } = await supabase
        .from('orders')
        .insert({
            customer_email: customerEmail,
            customer_name: 'Test Customer',
            pet_name: petName,
            pet_image_url: petPhotoUrl,
            status: 'pending',
            payment_status: 'paid', // Simulate they bought the initial product
            product_type: 'royalty',
            pet_breed: 'Mixed Breed',
        })
        .select()
        .single();

    if (error) {
        console.error('Error creating order:', error);
        return;
    }

    console.log(`Order created: ${order.id}`);

    // 2. Generate Images (including Bonus)
    console.log('Generating images...');
    try {
        // Generate for 'royalty' theme, auto-approve = true
        await generateImagesForOrder(order.id, petPhotoUrl, 'royalty', 'Mixed Breed', '', true);
        console.log('Generation complete!');
        console.log(`Test URL: http://localhost:3000/customer/gallery/${order.id}`);
    } catch (err) {
        console.error('Error generating images:', err);
    }
}

setupTestOrder();
