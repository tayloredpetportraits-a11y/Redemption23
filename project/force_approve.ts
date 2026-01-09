import { config } from 'dotenv';
config({ path: '.env.local' });
import { createAdminClient } from './src/lib/supabase/server';

async function approveImages() {
    const supabase = createAdminClient();
    const orderId = 'e8efdb11-5c0f-492d-9c5c-2bdc72d432f3';

    console.log(`Approving images for: ${orderId}`);

    const { error } = await supabase
        .from('images')
        .update({ status: 'approved' })
        .eq('order_id', orderId);

    if (error) {
        console.error("Error approving images:", error);
    } else {
        console.log("✅ All images approved.");
    }
}

approveImages().catch(console.error);
