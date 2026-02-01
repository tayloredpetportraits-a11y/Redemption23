import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function updateOrderStatus(accessToken: string, status: string) {
    console.log(`\n🔄 Updating order status...`);
    console.log(`Access Token: ${accessToken}`);
    console.log(`New Status: ${status}`);

    const { data, error } = await supabase
        .from('orders')
        .update({ status })
        .eq('access_token', accessToken)
        .select()
        .single();

    if (error) {
        console.error('❌ Error updating order:', error);
        return;
    }

    console.log('✅ Order updated successfully!');
    console.log(`Order ID: ${data.id}`);
    console.log(`Order Number: ${data.order_number}`);
    console.log(`Previous Status: pending → New Status: ${data.status}`);
    console.log(`\n🔗 Portal URL: http://localhost:3000/portal/${accessToken}`);
}

// Get access token from command line args
const accessToken = process.argv[2];
const newStatus = process.argv[3] || 'ready';

if (!accessToken) {
    console.error('❌ Please provide an access token');
    console.log('Usage: tsx scripts/update_order_status.ts <access_token> [status]');
    console.log('Example: tsx scripts/update_order_status.ts 46f9aac5-2fc3-47d0-83b4-3879d8eae41b ready');
    process.exit(1);
}

updateOrderStatus(accessToken, newStatus);
