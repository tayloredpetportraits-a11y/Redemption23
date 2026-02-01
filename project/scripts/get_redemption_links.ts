/**
 * Get Redemption Links for Orders
 * Fetches access tokens from created orders
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function main() {
    // Get the two most recent orders
    const { data: orders, error } = await supabase
        .from('orders')
        .select('id, customer_name, pet_name, product_type, status, access_token, created_at')
        .order('created_at', { ascending: false })
        .limit(2);

    if (error) {
        console.error('Error fetching orders:', error);
        process.exit(1);
    }

    console.log('\n🔗 REDEMPTION PORTAL LINKS:\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    for (const order of orders!) {
        console.log(`\n📦 ${order.customer_name} - ${order.pet_name || 'Pet'}`);
        console.log(`   Product: ${order.product_type}`);
        console.log(`   Status: ${order.status}`);

        if (order.access_token) {
            console.log(`   🔗 http://localhost:3000/redeem/${order.access_token}`);
        } else {
            console.log('   ⚠️  Access token not yet generated');
        }
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Check image count for each order
    for (const order of orders!) {
        const { data: images } = await supabase
            .from('images')
            .select('id, is_bonus, status')
            .eq('order_id', order.id);

        const baseImages = images?.filter(img => !img.is_bonus) || [];
        const bonusImages = images?.filter(img => img.is_bonus) || [];

        console.log(`📸 ${order.customer_name}:`);
        console.log(`   Base Images: ${baseImages.length}`);
        console.log(`   Bonus Images: ${bonusImages.length}`);
        console.log(`   Total: ${images?.length || 0}\n`);
    }
}

main();
