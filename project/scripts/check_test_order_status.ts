import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkOrderStatus() {
    const orderId = 'fb8efbeb-1d6a-4022-9400-28e785bfcea8';

    // Get order details
    const { data: order } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single();

    console.log('📋 Order Status:');
    console.log(`   ID: ${order.id}`);
    console.log(`   Status: ${order.status}`);
    console.log(`   Product Type: ${order.product_type}`);
    console.log(`   Customer: ${order.customer_name} (${order.customer_email})`);
    console.log(`   Created: ${order.created_at}`);
    console.log('');

    // Get images
    const { data: images } = await supabase
        .from('images')
        .select('type, is_bonus, status, theme_name')
        .eq('order_id', orderId);

    const total = images?.length || 0;
    const bonus = images?.filter(i => i.is_bonus).length || 0;
    const upsell = images?.filter(i => i.type === 'upsell').length || 0;
    const primary = total - bonus - upsell;

    console.log(' 🎨 Images Generated:');
    console.log(`   Total: ${total}`);
    console.log(`   Primary: ${primary}`);
    console.log(`   Bonus: ${bonus}`);
    console.log(`   Upsell/Mockups: ${upsell}`);
    console.log('');

    if (images && images.length > 0) {
        console.log('📸 Image Breakdown:');
        images.forEach((img, i) => {
            console.log(`   ${i + 1}. Type: ${img.type}, Bonus: ${img.is_bonus}, Status: ${img.status}, Theme: ${img.theme_name}`);
        });
    } else {
        console.log('❌ No images found!');
        console.log('');
        console.log('🔍 Possible causes:');
        console.log('   1. AI generation not triggered');
        console.log('   2. Error in generation pipeline');
        console.log('   3. Google AI API quota exceeded');
        console.log('   4. Webhook handler error');
    }

    console.log('');
    console.log(`🔗 Admin Link: http://localhost:3001/admin`);
    console.log(`🔗 Portal Link: http://localhost:3001/portal/${orderId}`);
}

checkOrderStatus();
