
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
    const orderId = process.argv[2];
    if (!orderId) {
        console.error("Please provide order ID");
        process.exit(1);
    }

    const { data: images, error } = await supabase
        .from('images')
        .select('*')
        .eq('order_id', orderId);

    if (error) {
        console.error(error);
        return;
    }

    console.log(`Found ${images.length} images for order ${orderId}`);
    images.forEach(img => {
        console.log(`[${img.type}] ID: ${img.id}, Bonus: ${img.is_bonus}, Theme: "${img.theme_name}"`);
        console.log(`URL: ${img.url}`);
    });
}

main();
