const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const ORDER_ID = '0e719ff2-ce70-4512-8062-e86d9da0ac82';
const MOCK_IMG = '/assets/mockups/canvas_mockup.png';

async function seed() {
    const images = Array.from({ length: 5 }).map((_, i) => ({
        order_id: ORDER_ID,
        url: MOCK_IMG,
        storage_path: 'mock',
        type: 'primary',
        status: 'approved',
        display_order: i,
        theme_name: 'Mock Theme'
    }));

    const { error } = await supabase.from('images').insert(images);
    if (error) console.error(error);
    else console.log('Seeded images for ' + ORDER_ID);

    // Also mark order as fulfilled so portal shows correctly? 
    // Actually portal just needs images.
}
seed();
