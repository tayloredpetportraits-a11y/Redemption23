#!/usr/bin/env tsx

import { config } from 'dotenv';
config({ path: '.env.local' });

/**
 * Apply Database Migration: Add revision_metadata column
 * Executes the migration to add structured revision tracking to orders table
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase credentials');
    console.error('Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function applyMigration() {
    console.log('🔄 Applying migration: Add revision_metadata column to orders table\n');

    try {
        // Step 1: Add the revision_metadata column
        console.log('Step 1: Adding revision_metadata JSONB column...');
        const { error: addColumnError } = await supabase.rpc('exec_sql', {
            query: `
        ALTER TABLE orders 
        ADD COLUMN IF NOT EXISTS revision_metadata JSONB;
      `
        });

        if (addColumnError) {
            // Try direct approach if RPC doesn't exist
            const { error: directError } = await supabase
                .from('orders')
                .select('revision_metadata')
                .limit(1);

            if (directError && directError.message.includes('column "revision_metadata" does not exist')) {
                console.log('⚠️  Column does not exist. Using SQL Editor approach...');
                console.log('\nPlease run this SQL in Supabase Dashboard:');
                console.log('─'.repeat(60));
                console.log('ALTER TABLE orders ADD COLUMN IF NOT EXISTS revision_metadata JSONB;');
                console.log('CREATE INDEX IF NOT EXISTS orders_revision_metadata_idx ON orders USING GIN (revision_metadata);');
                console.log('─'.repeat(60));
                console.log('\nOr use: npx supabase db push');
                process.exit(1);
            }

            console.log('✅ Column already exists or was added successfully');
        } else {
            console.log('✅ Column added successfully');
        }

        // Step 2: Verify the column exists
        console.log('\nStep 2: Verifying column exists...');
        const { error: testError } = await supabase
            .from('orders')
            .select('id, revision_metadata')
            .limit(1);

        if (testError) {
            console.error('❌ Column verification failed:', testError);
            process.exit(1);
        }

        console.log('✅ Column verified successfully');

        // Step 3: Show example usage
        console.log('\n' + '─'.repeat(60));
        console.log('✅ Migration complete!');
        console.log('─'.repeat(60));
        console.log('\nThe orders table now has:');
        console.log('  • revision_metadata (JSONB) column');
        console.log('  • Stores: selected_image_ids, reference_photo_urls, requested_at');
        console.log('\nExample usage:');
        console.log(`
await supabase.from('orders').update({
  revision_metadata: JSON.stringify({
    selected_image_ids: ['uuid-1', 'uuid-2'],
    reference_photo_urls: [],
    requested_at: new Date().toISOString()
  })
}).eq('id', orderId);
    `);
        console.log('─'.repeat(60));

    } catch (error) {
        console.error('\n❌ Migration failed:', error);
        process.exit(1);
    }
}

applyMigration();
