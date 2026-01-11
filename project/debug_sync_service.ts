
import dotenv from 'dotenv';
import path from 'path';
import { PrintifySyncService } from '@/lib/printify/sync-service';
import { createAdminClient } from '@/lib/supabase/server';

// Load env
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function runSync() {
    console.log("Starting Debug Sync...");
    try {
        const result = await PrintifySyncService.syncProducts();
        console.log("Sync Result:", result);

        const supabase = createAdminClient();
        const { data: products } = await supabase.from('printify_products').select('*');
        console.log("DB Content:", products?.map(p => `${p.id} - ${p.title} (Active: ${p.is_active})`));

    } catch (e) {
        console.error("Sync Failed:", e);
    }
}

runSync();
