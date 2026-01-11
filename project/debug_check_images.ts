
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function checkOrderImages(orderId: string) {
    console.log(`Checking images for Order: ${orderId}`);

    const { data: images, error } = await supabase
        .from('images')
        .select('*')
        .eq('order_id', orderId);

    if (error) {
        console.error('Error fetching images:', error);
        return;
    }

    console.log(`Found ${images?.length || 0} images.`);
    if (images && images.length > 0) {
        images.forEach(img => {
            console.log(`- ID: ${img.id}, Type: ${img.type}, Status: ${img.status}, URL: ${img.url}`);
        });
    } else {
        console.log('No images found.');
    }
}

// Order ID from the failed test run
const TEST_ORDER_ID = 'cb320032-245e-4f78-a35b-dcdbc56823e9';
checkOrderImages(TEST_ORDER_ID);
