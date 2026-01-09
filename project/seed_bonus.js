const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const ORDER_ID = '129a9582-612b-4ffd-ba7d-a08763527709';
const MOCK_IMG = '/assets/mockups/canvas_mockup.png';

async function seed() {
    // 1. Primary
    const primary = Array.from({ length: 3 }).map((_, i) => ({
        order_id: ORDER_ID,
        url: MOCK_IMG,
        storage_path: 'mock/primary',
        type: 'primary',
        status: 'approved',
        display_order: i,
        theme_name: 'Royalty'
    }));

    // 2. Bonus (Upsell)
    // We simulate "Locked": url = public, storage_path = secret
    const bonus = Array.from({ length: 5 }).map((_, i) => ({
        order_id: ORDER_ID,
        url: MOCK_IMG, // This represents watermarked one visually
        storage_path: 'mock/secret/clean.png', // Represents clean one
        type: 'upsell',
        status: 'pending_review', // or whatever
        display_order: i + 3,
        theme_name: 'Valentines',
        is_bonus: true
    }));

    const { error } = await supabase.from('images').insert([...primary, ...bonus]);
    if (error) console.error(error);
    else console.log('Seeded bonus images for ' + ORDER_ID);
}
seed();
