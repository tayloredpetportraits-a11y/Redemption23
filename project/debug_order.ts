
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

const ORDER_ID = 'eb86eac1-b5be-4c3a-939e-6216e2206429';

async function debugOrder() {
    console.log(`Checking Order: ${ORDER_ID}`);
    const { data: order, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', ORDER_ID)
        .single();

    if (orderError) {
        console.error('Order Error:', orderError);
    } else {
        console.log('Order Status:', order.status);
    }

    const { data: images, error: imgError } = await supabase
        .from('images')
        .select('*')
        .eq('order_id', ORDER_ID);

    if (imgError) {
        console.error('Images Error:', imgError);
    } else {
        console.log(`Found ${images.length} images.`);
        images.forEach(img => {
            console.log(`- [${img.type}] ${img.url} (Status: ${img.status})`);
        });
    }
}

debugOrder();
