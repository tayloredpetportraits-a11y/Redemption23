import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '.env.local') });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkTable() {
    console.log('Checking printify_products table...\n');

    const { data, error } = await supabase
        .from('printify_products')
        .select('*')
        .limit(5);

    if (error) {
        console.error('Error:', error);
        return;
    }

    console.log('Table data:', data);
    console.log('\nColumn count:', data && data.length > 0 ? Object.keys(data[0]).length : 0);
    if (data && data.length > 0) {
        console.log('Columns:', Object.keys(data[0]));
    }
}

checkTable().then(() => process.exit());
