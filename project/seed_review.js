
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function seed() {
    const { data: order, error: orderError } = await supabase.from('orders').insert({
        customer_email: 'test@example.com',
        customer_name: 'Test Reviewer',
        pet_name: 'Test Pet',
        product_type: 'Digital Art',
        status: 'pending',
        pet_image_url: 'https://placehold.co/600x400',
    }).select().single();

    if (orderError) {
        console.error('Order Error:', orderError);
        return;
    }

    const { error: imgError } = await supabase.from('images').insert([
        { order_id: order.id, url: 'https://placehold.co/400x400?text=Pending1', status: 'pending', type: 'primary', theme_name: 'Theme A', storage_path: 'dummy/1' },
        { order_id: order.id, url: 'https://placehold.co/400x400?text=Pending2', status: 'pending', type: 'upsell', theme_name: 'Theme B', storage_path: 'dummy/2' }
    ]);

    if (imgError) console.error('Image Error:', imgError);
    else console.log('Seeded Order:', order.id);
}

seed();
