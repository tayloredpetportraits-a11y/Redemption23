import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function updateOrderStatusById(orderId: string, status: string) {
    console.log(`\n🔄 Updating order status...`);
    console.log(`Order ID: ${orderId}`);
    console.log(`New Status: ${status}`);

    const { data, error } = await supabase
        .from('orders')
        .update({ status })
        .eq('id', orderId)
        .select()
        .single();

    if (error) {
        console.error('❌ Error updating order:', error);
        return;
    }

    console.log('✅ Order updated successfully!');
    console.log(`Order ID: ${data.id}`);
    console.log(`Order Number: ${data.order_number}`);
    console.log(`Status: ${data.status}`);
    console.log(`Product Type: ${data.product_type}`);
    console.log(`\n🔗 Portal URL: http://localhost:3000/portal/${data.id}`);
}

// Get order ID from command line args
const orderId = process.argv[2];
const newStatus = process.argv[3] || 'ready';

if (!orderId) {
    console.error('❌ Please provide an order ID');
    console.log('Usage: tsx scripts/update_order_by_id.ts <order_id> [status]');
    console.log('Example: tsx scripts/update_order_by_id.ts 46f9aac5-2fc3-47d0-83b4-3879d8eae41b ready');
    process.exit(1);
}

updateOrderStatusById(orderId, newStatus);
