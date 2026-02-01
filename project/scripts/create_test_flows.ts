import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load env vars from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase credentials in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createTestOrders() {
    console.log('Creating test orders with direct client...');

    // 1. Create Physical Order (Should show proofing interface)
    const { data: physicalOrder, error: err1 } = await supabase
        .from('orders')
        .insert({
            customer_email: 'test-physical@example.com',
            customer_name: 'Physical Tester',
            pet_name: 'Rex',
            product_type: 'canvas-11x14', // Physical
            status: 'ready',
            selected_image_id: null,
            order_number: 'TEST-PHYS-' + Math.floor(Math.random() * 1000)
        })
        .select()
        .single();

    if (err1) console.error('Error creating physical order:', err1);
    else console.log('Created Physical Order:', physicalOrder.id);

    // 2. Create Images for Physical Order
    if (physicalOrder) {
        await supabase.from('images').insert([
            { order_id: physicalOrder.id, url: 'https://placehold.co/800x1000/png?text=Rex+1', type: 'primary', status: 'approved', display_order: 1 },
            { order_id: physicalOrder.id, url: 'https://placehold.co/800x1000/png?text=Rex+2', type: 'primary', status: 'approved', display_order: 2 }
        ]);
    }

    // 3. Create Digital Order (Should skip proofing, show upsell)
    const { data: digitalOrder, error: err2 } = await supabase
        .from('orders')
        .insert({
            customer_email: 'test-digital@example.com',
            customer_name: 'Digital Tester',
            pet_name: 'Luna',
            product_type: 'digital-only', // Digital
            status: 'ready',
            order_number: 'TEST-DIGI-' + Math.floor(Math.random() * 1000)
        })
        .select()
        .single();

    if (err2) console.error('Error creating digital order:', err2);
    else console.log('Created Digital Order:', digitalOrder.id);

    // 4. Create Images for Digital Order
    if (digitalOrder) {
        await supabase.from('images').insert([
            { order_id: digitalOrder.id, url: 'https://placehold.co/800x1000/png?text=Luna+1', type: 'primary', status: 'approved', display_order: 1 }
        ]);
    }
}

createTestOrders();
