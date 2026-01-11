
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Manual env load
const envPath = './.env.local';
if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
}

async function checkDb() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !key) {
        console.error("Missing Supabase Env Vars");
        return;
    }

    const supabase = createClient(url, key);

    // Check if table exists by selecting 1
    const { count, error } = await supabase
        .from('printify_products')
        .select('*', { count: 'exact', head: true });

    if (error) {
        console.error('DB Error:', error.message);
    } else {
        console.log(`Printify Products in DB: ${count}`);
    }
}

checkDb();
