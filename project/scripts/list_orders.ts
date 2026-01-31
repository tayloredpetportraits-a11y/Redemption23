import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function listRecentOrders() {
    console.log(`\n📋 Listing recent orders...\n`);

    const { data, error } = await supabase
        .from('orders')
        .select('id, order_number, access_token, status, product_type, created_at')
        .order('created_at', { ascending: false })
        .limit(10);

    if (error) {
        console.error('❌ Error fetching orders:', error);
        return;
    }

    if (!data || data.length === 0) {
        console.log('No orders found.');
        return;
    }

    console.log(`Found ${data.length} recent orders:\n`);
    data.forEach((order, index) => {
        console.log(`${index + 1}. Order #${order.order_number}`);
        console.log(`   ID: ${order.id}`);
        console.log(`   Access Token: ${order.access_token}`);
        console.log(`   Status: ${order.status}`);
        console.log(`   Product Type: ${order.product_type}`);
        console.log(`   Created: ${new Date(order.created_at).toLocaleString()}`);
        console.log(`   Portal URL: http://localhost:3000/portal/${order.access_token}`);
        console.log('');
    });
}

listRecentOrders();
