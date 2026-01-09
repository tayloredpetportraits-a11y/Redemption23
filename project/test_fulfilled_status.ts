import { config } from 'dotenv';
config({ path: '.env.local' });
import { createAdminClient } from './src/lib/supabase/server';

async function testFulfilled() {
    const supabase = createAdminClient();

    // Create a dummy order
    const { data: order, error } = await supabase.from('orders').insert({
        customer_email: 'fulfill_test@example.com',
        customer_name: 'Fulfill Tester',
        status: 'pending'
    }).select().single();

    if (error) throw error;
    console.log(`Created order ${order.id} with status ${order.status}`);

    // Update to fulfilled
    const { data: updated, error: updateError } = await supabase
        .from('orders')
        .update({ status: 'fulfilled' })
        .eq('id', order.id)
        .select()
        .single();

    if (updateError) {
        console.error("Update failed:", updateError);
    } else {
        console.log(`Updated order ${updated.id} to status ${updated.status}`);
        // Clean up
        await supabase.from('orders').delete().eq('id', order.id);
    }
}

testFulfilled().catch(console.error);
