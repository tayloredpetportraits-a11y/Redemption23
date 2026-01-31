import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function addRevisionMetadataColumn() {
    console.log('🔧 Adding revision_metadata column to orders table...');

    try {
        // Execute the SQL to add the column
        const { error } = await supabase.rpc('exec_sql', {
            sql: `
        ALTER TABLE orders 
        ADD COLUMN IF NOT EXISTS revision_metadata JSONB;

        CREATE INDEX IF NOT EXISTS idx_orders_revision_metadata 
        ON orders USING GIN (revision_metadata);

        COMMENT ON COLUMN orders.revision_metadata IS 'Structured revision data including selected image IDs and reference photos';
      `
        });

        if (error) {
            console.error('❌ Error adding column:', error);
            throw error;
        }

        console.log('✅ Successfully added revision_metadata column!');
        console.log('✅ Added GIN index for better query performance');
        console.log('✅ Added column comment for documentation');

    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
}

addRevisionMetadataColumn();
