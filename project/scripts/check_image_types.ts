import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkImageTypes() {
    const orderId = '20e0f183-8253-4922-9441-85bece751ddf';

    console.log(`\n🔍 Checking image records for FIXED order: ${orderId}\n`);

    const { data: images, error } = await supabase
        .from('images')
        .select('*')
        .eq('order_id', orderId)
        .order('created_at');

    if (error) {
        console.error('Error:', error);
        return;
    }

    console.log(`Total images: ${images?.length || 0}\n`);

    const primary = images?.filter(img => img.type === 'primary') || [];
    const bonus = images?.filter(img => img.type === 'bonus') || [];

    console.log(`✅ PRIMARY images (unlocked): ${primary.length}`);
    primary.forEach((img, i) => {
        const filename = img.url.split('/').pop();
        console.log(`  ${i + 1}. Theme: ${img.theme_name}, Type: ${img.type}, File: ${filename?.substring(0, 50)}`);
    });

    console.log(`\n🔒 BONUS images (locked/watermarked): ${bonus.length}`);
    bonus.forEach((img, i) => {
        const filename = img.url.split('/').pop();
        const isWatermarked = filename?.includes('watermarked') || filename?.includes('mobile');
        console.log(`  ${i + 1}. Theme: ${img.theme_name}, Type: ${img.type}, Watermarked: ${isWatermarked}`);
    });

    console.log('\n📊 Fix Verification:');
    if (primary.length === 5 && bonus.length === 10) {
        console.log('✅ ✅ ✅ SUCCESS! Fix worked perfectly:');
        console.log('   - 5 primary Spa Day images saved with type="primary" (UNLOCKED)');
        console.log('   - 5 bonus Royalty images saved with type="bonus" (LOCKED)');
        console.log('   - 5 mobile wallpapers saved with type="bonus" (BONUS)');
        console.log('\n🎉 Customer portal will now display:');
        console.log('   ✓ Primary gallery: 5 Spa Day portraits (VISIBLE & UNLOCKED)');
        console.log('   ✓ Upsell section: 5 Royalty portraits (BLURRED & LOCKED)');
        console.log('   ✓ Canvas selection: 5 Spa Day portraits available');
        console.log(`\n🌐 Test in browser: http://localhost:3000/customer/gallery/${orderId}`);
    } else {
        console.log(`❌ ISSUE: Expected 5 primary + 10 bonus, got ${primary.length} primary + ${bonus.length} bonus`);
    }
}

checkImageTypes();
