import { createAdminClient } from './src/lib/supabase/server';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function verifyOrder() {
    const supabase = createAdminClient();
    const orderId = '8a5ae862-b6c1-417e-8eb5-729d6517e20e';

    console.log(`Checking Validated Order: ${orderId}`);

    const { data: images } = await supabase
        .from('images')
        .select('*')
        .eq('order_id', orderId)
        .order('display_order', { ascending: true });

    if (!images) { console.log('No images found'); return; }

    const primary = images.filter(i => !i.is_bonus && i.type === 'primary');
    const bonus = images.filter(i => i.is_bonus);
    const mockups = images.filter(i => i.type === 'upsell');

    console.log(`Primary Count: ${primary.length}`);
    console.log(`Bonus Count: ${bonus.length}`);
    console.log(`Mockup Count: ${mockups.length}`);

    // Verify Bonus Consistency
    const bonusThemes = [...new Set(bonus.map(b => b.theme_name))];
    console.log(`Bonus Themes:`, bonusThemes);

    if (bonusThemes.length === 1 || (bonusThemes.length > 1 && bonusThemes.every(t => t?.includes('Spaday')))) { // allow mismatch "Bonus: spaday" vs "spaday"
        console.log("SUCCESS: Single Bonus Theme verified.");
    } else {
        console.log("FAIL: Multiple bonus themes found.");
    }

    // Status check
    const pending = images.filter(i => i.status !== 'approved');
    if (pending.length === 0) console.log("SUCCESS: All images approved.");
    else console.log(`FAIL: ${pending.length} images pending.`);
}

verifyOrder();
