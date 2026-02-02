import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkOrderImages() {
    const orderId = '0e09e5a7-3ce5-471d-867c-4985b15174dd';

    // Get images
    const { data: images } = await supabase
        .from('images')
        .select('type, is_bonus, status')
        .eq('order_id', orderId);

    const total = images?.length || 0;
    const primary = images?.filter(i => i.type === 'primary').length || 0;
    const bonus = images?.filter(i => i.is_bonus).length || 0;

    console.log(`🎨 Images Generated for Order ${orderId.slice(0, 8)}...:`);
    console.log(`   Total: ${total}`);
    console.log(`   Primary: ${primary}`);
    console.log(`   Bonus/Upsell: ${bonus}`);
    console.log('');

    if (total >= 13) {
        console.log('✅ SUCCESS! Expected 13+ images, got', total);
        console.log('🎉 AI Generation Pipeline is WORKING!');
    } else if (total > 0) {
        console.log(`⚠️  PARTIAL: Got ${total} images (expected 13+)`);
    } else {
        console.log('❌ FAILED: No images generated');
    }
}

checkOrderImages();
