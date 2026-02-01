#!/usr/bin/env tsx

import { config } from 'dotenv';
config({ path: '.env.local' });

/**
 * Simple Direct SQL Migration
 * Uses Supabase REST API to execute SQL directly
 */

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing credentials');
    process.exit(1);
}

const sql = `
-- Add revision_metadata column
ALTER TABLE orders ADD COLUMN IF NOT EXISTS revision_metadata JSONB;

-- Add GIN index
CREATE INDEX IF NOT EXISTS orders_revision_metadata_idx ON orders USING GIN (revision_metadata);
`;

async function runSQL() {
    console.log('🔄 Executing SQL migration...\n');
    console.log(sql);
    console.log('─'.repeat(60));

    try {
        const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': supabaseServiceKey,
                'Authorization': `Bearer ${supabaseServiceKey}`,
            },
            body: JSON.stringify({ query: sql })
        });

        if (!response.ok) {
            const error = await response.text();
            console.error('\n❌ SQL execution failed:', error);
            console.log('\n📋 Please run this SQL manually in Supabase Dashboard:');
            console.log('─'.repeat(60));
            console.log(sql);
            console.log('─'.repeat(60));
            process.exit(1);
        }

        console.log('\n✅ Migration executed successfully!');
        console.log('\nThe orders table now has the revision_metadata column.');

    } catch (error) {
        console.error('\n❌ Error:', error);
        console.log('\n📋 Please run this SQL manually in Supabase Dashboard → SQL Editor:');
        console.log('─'.repeat(60));
        console.log(sql);
        console.log('─'.repeat(60));
    }
}

runSQL();
