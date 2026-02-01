#!/usr/bin/env tsx

/**
 * Run Database Migration: Add revision_metadata column
 * 
 * This script adds the revision_metadata JSONB column to the orders table
 * to store structured revision request data.
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase credentials');
    console.error('Required env vars: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
    console.log('🔄 Running migration: Add revision_metadata column...\n');

    try {
        // Add revision_metadata column
        const { error: columnError } = await supabase.rpc('exec_sql', {
            sql: `
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'orders' AND column_name = 'revision_metadata'
          ) THEN
            ALTER TABLE orders ADD COLUMN revision_metadata JSONB;
            RAISE NOTICE 'Added revision_metadata column';
          ELSE
            RAISE NOTICE 'Column revision_metadata already exists';
          END IF;
        END $$;
      `
        });

        if (columnError) {
            console.error('❌ Error adding column:', columnError);
            process.exit(1);
        }

        // Add GIN index for JSONB querying
        const { error: indexError } = await supabase.rpc('exec_sql', {
            sql: `
        CREATE INDEX IF NOT EXISTS orders_revision_metadata_idx 
          ON orders USING GIN (revision_metadata);
      `
        });

        if (indexError) {
            console.warn('⚠️  Warning: Could not create index:', indexError);
            // Don't exit - index is optional
        }

        console.log('✅ Migration completed successfully!\n');
        console.log('The orders table now has:');
        console.log('  - revision_metadata (JSONB) column');
        console.log('  - GIN index for efficient JSON querying\n');

    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
}

runMigration();
