
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function runMigration() {
    console.log("🛠️ Attempting to run migration via 'exec_sql' RPC...");

    const sql = `
        alter table product_templates 
        add column if not exists type text default 'canvas', 
        add column if not exists mask_url text, 
        add column if not exists warp_config jsonb;

        update product_templates set warp_config = null where warp_config is null;
    `;

    // 1. Try 'exec_sql' (Common helper)
    const { error } = await supabase.rpc('exec_sql', { sql_query: sql });

    if (error) {
        console.error("❌ RPC Method Failed:", error.message);
        console.log("⚠️  The JS Client cannot run 'ALTER TABLE' directly without a specific RPC function.");
        console.log("👉 Please copy/paste the SQL from 'supabase/migrations/20260129_add_mockup_fields.sql' into the Supabase Dashboard.");
        process.exit(1);
    } else {
        console.log("✅ Custom RPC success! Migration applied.");
    }
}

runMigration();
