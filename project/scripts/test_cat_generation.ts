
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { generateImagesForOrder } from '../src/lib/ai/generation';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runDirectCatTest() {
    console.log('🐱 Starting Direct Cat Generation Test...');

    const localImagePath = '/uploads/pets/test_cat.jpg'; // Relative to public

    // 1. Insert Order (Matching route.ts fields exactly)
    const { data: order, error } = await supabase
        .from('orders')
        .insert({
            // shopify_order_id: '88888888', // Removing this as it seems to cause schema errors
            // order_number: '#CAT-TEST-001', // This might also be missing or optional?
            customer_email: 'catlover@example.com',
            customer_name: 'Cat Lover',
            pet_name: 'Whiskers',
            pet_breed: 'Tabby Cat',
            pet_image_url: localImagePath,
            status: 'pending',
            pet_details: 'Special: A very cute tabby cat. [Shopify ID: 88888888]' // Storing ID in details like route.ts
        })
        .select()
        .single();

    if (error) {
        console.error('❌ Failed to insert order:', error.message);
        return;
    }

    console.log(`✅ Order Created: ${order.id}`);
    await triggerGen(order.id, localImagePath);
}

async function triggerGen(orderId: string, imagePath: string) {
    console.log('⚡ Triggering Generation Logic Directly...');
    try {
        await generateImagesForOrder(
            orderId,
            imagePath,
            'royalty',
            'Tabby Cat',
            'Special: A very cute tabby cat',
            false
        );
        console.log('🎉 Generation function completed. Checking DB...');

        // Final Poll
        const { count } = await supabase.from('images').select('*', { count: 'exact', head: true }).eq('order_id', orderId);
        console.log(`📸 Images Found: ${count}`);

    } catch (e) {
        console.error('❌ Generation threw error:', e);
    }
}

runDirectCatTest();
