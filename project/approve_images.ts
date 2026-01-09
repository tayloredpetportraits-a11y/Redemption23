
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

const ORDER_ID = 'd28367ab-d815-4442-9dee-da4af6040ece';

async function approveImages() {
    console.log(`Approving images for: ${ORDER_ID}`);
    const { data, error } = await supabase
        .from('images')
        .update({ status: 'approved' })
        .eq('order_id', ORDER_ID)
        .select();

    if (error) {
        console.error('Error:', error.message);
    } else {
        console.log(`Success! Approved ${data.length} images.`);
    }
}

approveImages();
