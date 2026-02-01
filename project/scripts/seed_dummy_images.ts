
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function seedImages() {
    const { data: orders } = await supabase.from('orders').select('id').order('created_at', { ascending: false }).limit(1);

    if (!orders || orders.length === 0) {
        console.error('No order found');
        return;
    }

    const orderId = orders[0].id;
    console.log(`Seeding images for order: ${orderId}`);

    const dummyImage = 'https://images.pexels.com/photos/1108099/pexels-photo-1108099.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1';

    const images = [
        {
            order_id: orderId,
            url: dummyImage,
            type: 'primary',
            storage_path: 'dummy/primary.jpg',
            status: 'completed',
            is_selected: true
        },
        { order_id: orderId, url: dummyImage, type: 'upsell', storage_path: 'dummy/1.jpg', status: 'completed', theme_name: 'Bonus 1' },
        { order_id: orderId, url: dummyImage, type: 'upsell', storage_path: 'dummy/2.jpg', status: 'completed', theme_name: 'Bonus 2' },
        { order_id: orderId, url: dummyImage, type: 'upsell', storage_path: 'dummy/3.jpg', status: 'completed', theme_name: 'Bonus 3' },
        { order_id: orderId, url: dummyImage, type: 'upsell', storage_path: 'dummy/4.jpg', status: 'completed', theme_name: 'Bonus 4' },
        { order_id: orderId, url: dummyImage, type: 'upsell', storage_path: 'dummy/5.jpg', status: 'completed', theme_name: 'Bonus 5' },
    ];

    const { error } = await supabase.from('images').insert(images);

    if (error) {
        console.error('Error inserting images:', error);
    } else {
        console.log('Successfully seeded 6 images (1 primary, 5 upsell)');
    }
}

seedImages();
