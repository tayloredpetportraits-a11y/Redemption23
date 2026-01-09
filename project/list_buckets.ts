
import { createAdminClient } from './src/lib/supabase/server';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function listBuckets() {
    const supabase = createAdminClient();
    const { data, error } = await supabase.storage.listBuckets();
    if (error) {
        console.error('Error listing buckets:', error);
    } else {
        console.log('Buckets:', data);
    }
}

listBuckets();
