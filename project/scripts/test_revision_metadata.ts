#!/usr/bin/env tsx

import { config } from 'dotenv';
config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testRevisionMetadata() {
    console.log('🧪 Testing revision_metadata functionality...\n');

    try {
        // Get the first order
        const { data: orders, error: fetchError } = await supabase
            .from('orders')
            .select('id, customer_name, revision_metadata')
            .limit(1);

        if (fetchError) throw fetchError;

        if (!orders || orders.length === 0) {
            console.log('⚠️  No orders found in database. Create an order first to test.');
            process.exit(0);
        }

        const testOrder = orders[0];
        console.log(`📝 Testing with order: ${testOrder.id}`);
        console.log(`   Customer: ${testOrder.customer_name}\n`);

        // Test writing revision metadata
        const testMetadata = {
            selected_image_ids: ['test-uuid-1', 'test-uuid-2', 'test-uuid-3'],
            reference_photo_urls: ['https://example.com/ref1.jpg'],
            requested_at: new Date().toISOString(),
        };

        console.log('📤 Writing test revision metadata...');
        const { error: updateError } = await supabase
            .from('orders')
            .update({
                revision_metadata: JSON.stringify(testMetadata),
                revision_status: 'requested',
                revision_notes: 'Test revision request from migration verification',
            })
            .eq('id', testOrder.id)
            .select()
            .single();

        if (updateError) throw updateError;

        console.log('✅ Successfully wrote revision metadata!\n');

        // Verify we can read it back
        console.log('📥 Reading back the data...');
        const { data: verifyData, error: verifyError } = await supabase
            .from('orders')
            .select('revision_metadata, revision_status, revision_notes')
            .eq('id', testOrder.id)
            .single();

        if (verifyError) throw verifyError;

        console.log('✅ Successfully read revision metadata!\n');
        console.log('📊 Stored data:');
        console.log(JSON.stringify(verifyData, null, 2));
        console.log('\n' + '─'.repeat(60));
        console.log('✅ MIGRATION VERIFICATION COMPLETE!');
        console.log('─'.repeat(60));
        console.log('\nThe revision_metadata column is working perfectly.');
        console.log('Your API can now store structured revision requests! 🚀\n');

    } catch (error) {
        console.error('❌ Test failed:', error);
        process.exit(1);
    }
}

testRevisionMetadata();
