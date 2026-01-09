import { config } from 'dotenv';
config({ path: '.env.local' });
import { createAdminClient } from './src/lib/supabase/server';

async function archiveOldTests() {
    const supabase = createAdminClient();

    // Define criteria for "Old Tests"
    // e.g., emails containing 'test', 'example', or names like 'Testy'
    // Also archive specific IDs if known, but general search is better for "all old tests"

    console.log("Searching for test orders to archive...");

    const { data: allOrders, error } = await supabase
        .from('orders')
        .select('*');

    if (error) throw error;

    const toArchive = allOrders.filter(o => {
        if (o.status === 'failed') return false; // Already archived

        const isTestEmail = o.customer_email.includes('test') || o.customer_email.includes('example');
        const isTestName = o.customer_name.toLowerCase().includes('test');
        const isTestPet = o.pet_name?.toLowerCase().includes('sausage') || o.pet_name?.toLowerCase().includes('wiener');

        return isTestEmail || isTestName || isTestPet;
    });

    console.log(`Found ${toArchive.length} orders to archive.`);

    if (toArchive.length > 0) {
        const ids = toArchive.map(o => o.id);
        const { error: updateError } = await supabase
            .from('orders')
            .update({ status: 'failed' })
            .in('id', ids);

        if (updateError) {
            console.error("Failed to archive:", updateError);
        } else {
            console.log("Successfully archived orders:", ids);
        }
    } else {
        console.log("No test orders found to archive.");
    }
}

archiveOldTests().catch(console.error);
