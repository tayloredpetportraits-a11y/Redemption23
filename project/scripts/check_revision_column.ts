#!/usr/bin/env tsx

import { config } from 'dotenv';
config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

console.log('🔄 Adding revision_metadata column via direct UPDATE operation...\n');

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function addColumn() {
    try {
        // Test if column exists by trying to select it
        const { data: testSelect, error: selectError } = await supabase
            .from('orders')
            .select('id, revision_metadata')
            .limit(1);

        if (selectError) {
            if (selectError.message.includes('revision_metadata')) {
                console.log('❌ Column does not exist.');
                console.log('\n✋ Please run this SQL in Supabase Dashboard → SQL Editor:\n');
                console.log('─'.repeat(60));
                console.log('ALTER TABLE orders ADD COLUMN revision_metadata JSONB;');
                console.log('CREATE INDEX IF NOT EXISTS orders_revision_metadata_idx');
                console.log('  ON orders USING GIN (revision_metadata);');
                console.log('─'.repeat(60));
                console.log('\n📍 Link: https://app.supabase.com/project/_/sql');
                process.exit(0);
            }
            throw selectError;
        }

        console.log('✅ Column already exists!');
        console.log('\nRevision metadata column is ready to use.');
        console.log('The API will now store structured revision data.\n');

    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

addColumn();
