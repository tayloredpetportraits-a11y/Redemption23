import { config } from 'dotenv';
config({ path: '.env.local' });
import { createAdminClient } from './src/lib/supabase/server';

async function verifyResults() {
    const supabase = createAdminClient();
    // Order ID from the running process output
    const orderId = 'e8efdb11-5c0f-492d-9c5c-2bdc72d432f3';

    console.log(`Checking images for order: ${orderId}`);

    const { data: images, error } = await supabase
        .from('images')
        .select('id, type, is_bonus, theme_name, url, display_order')
        .eq('order_id', orderId)
        .order('display_order', { ascending: true });

    if (error) {
        console.error("Error fetching images:", error);
        return;
    }

    console.log(`Found ${images?.length} images.`);

    // Group analysis
    const primary = images?.filter(i => i.type === 'primary' && !i.is_bonus);
    const bonus = images?.filter(i => i.is_bonus);
    const upsell = images?.filter(i => i.type === 'upsell');

    console.log(`\n--- Summary ---`);
    console.log(`Primary Portraits: ${primary?.length} (Expected 5)`);
    console.log(`Bonus Portraits: ${bonus?.length} (Expected 5)`);
    console.log(`Upsells/Mockups: ${upsell?.length}`);

    console.log(`\n--- Detail ---`);
    images?.forEach(img => {
        console.log(`[${img.display_order}] Type: ${img.type}, Bonus: ${img.is_bonus}, Theme: ${img.theme_name}`);
    });
}

verifyResults().catch(console.error);
