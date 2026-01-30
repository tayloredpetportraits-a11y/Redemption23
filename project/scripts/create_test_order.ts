
import { createAdminClient } from '../src/lib/supabase/server';
import dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function createTestOrder() {
    console.log('🧪 Creating Test Order...');

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
        console.error('❌ Missing Supabase credentials in .env.local');
        return;
    }

    const supabase = createAdminClient();

    // 1. Create Order
    const { data: order, error: orderError } = await supabase.from('orders').insert({
        customer_email: 'test@example.com',
        customer_name: 'Test Viewer',
        pet_name: 'Barkley',
        pet_breed: 'Golden Retriever',
        status: 'pending',
        pet_image_url: '/mock-pet.jpg' // Assuming this exists or will just break image load which is fine for UI test
    }).select().single();

    if (orderError) {
        console.error('❌ Failed to create order:', orderError);
        return;
    }

    console.log(`✅ Created Order: ${order.id}`);

    // 2. Create Dummy Images
    const images = Array.from({ length: 4 }).map((_, i) => ({
        order_id: order.id,
        url: `https://placehold.co/600x800/png?text=Barkley+Portrait+${i + 1}`,
        type: 'primary',
        status: 'pending_review',
        storage_path: 'mock/path.png',
        display_order: i,
        theme_name: 'Royal',
        template_id: 'template_1'
    }));

    const { error: imgError } = await supabase.from('images').insert(images);

    if (imgError) console.error('❌ Failed to create images:', imgError);
    else console.log(`✅ Added ${images.length} test images.`);
}

createTestOrder();
