
import { createAdminClient } from './src/lib/supabase/server.ts';
import * as dotenv from 'dotenv';
import path from 'path';

// Manual env load
dotenv.config({ path: path.resolve(__dirname, '.env.local') });

async function checkDb() {
    const supabase = createAdminClient();
    const { count, error } = await supabase
        .from('printify_products')
        .select('*', { count: 'exact', head: true });

    if (error) {
        console.error('DB Error:', error);
    } else {
        console.log(`Printify Products in DB: ${count}`);
    }
}

checkDb();
