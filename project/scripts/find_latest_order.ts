
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function findLatestOrder() {
    const { data, error } = await supabase
        .from('orders')
        .select('id, customer_name, pet_name')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

    if (error) {
        console.error('Error finding order:', error);
    } else {
        console.log(`Latest Order: ${data.id} (${data.customer_name} - ${data.pet_name})`);
    }
}

findLatestOrder();
