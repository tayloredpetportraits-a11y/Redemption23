import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.join(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase credentials. Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
    console.log('🚀 Adding mockup_overlay_url column to printify_product_configs...\n');

    try {
        // Add the column
        const { error: alterError } = await supabase.rpc('exec_sql', {
            sql: `
        ALTER TABLE printify_product_configs 
        ADD COLUMN IF NOT EXISTS mockup_overlay_url TEXT;
        
        COMMENT ON COLUMN printify_product_configs.mockup_overlay_url IS 
        'Public URL to transparent PNG overlay image (e.g., canvas frame, mug template) stored in Supabase Storage. Used for CSS-based mockup generation.';
      `
        });

        if (alterError) {
            console.error('❌ Error adding column:', alterError);

            // Try direct query if RPC fails
            console.log('Trying direct SQL execution...');
            const { error: directError } = await supabase
                .from('printify_product_configs')
                .select('mockup_overlay_url')
                .limit(1);

            if (directError && directError.message.includes('column') && directError.message.includes('does not exist')) {
                console.error('⚠️  Column does not exist. Please run the SQL manually in Supabase SQL Editor:');
                console.log('\nALTER TABLE printify_product_configs ADD COLUMN IF NOT EXISTS mockup_overlay_url TEXT;\n');
                process.exit(1);
            } else {
                console.log('✅ Column already exists or was added successfully!');
            }
        } else {
            console.log('✅ Column added successfully!');
        }

        // Verify the column exists
        const { data, error: selectError } = await supabase
            .from('printify_product_configs')
            .select('id, product_name, mockup_overlay_url')
            .limit(3);

        if (selectError) {
            console.error('❌ Error verifying column:', selectError);
            process.exit(1);
        }

        console.log('\n✅ Migration successful! Current products:');
        console.table(data);

    } catch (error) {
        console.error('❌ Unexpected error:', error);
        process.exit(1);
    }
}

runMigration();
