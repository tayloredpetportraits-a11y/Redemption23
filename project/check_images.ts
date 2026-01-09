
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function checkImages() {
    const orderId = '1489d127-903f-4f62-bd11-dc6aa5697c62';
    console.log(`Checking images for order: ${orderId}`);

    const { data: images, error } = await supabase
        .from('images')
        .select('*')
        .eq('order_id', orderId);

    if (error) {
        console.error('Error:', error);
        return;
    }

    console.log(`Found ${images.length} images.`);
    images.forEach(img => {
        console.log(`[${img.id}] Type: ${img.type}, Status: ${img.status}, IsBonus: ${img.is_bonus}, DisplayOrder: ${img.display_order}`);
    });
}

checkImages();
