
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import crypto from 'crypto';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function simulateFullWebhook() {
    console.log('🌟 Starting FULL E2E Simulation (Primary + Bonus + Mockups)...');

    // 1. Unique Order
    const uniqueId = Math.floor(Math.random() * 100000000) + 700000000;
    const email = `full.test.${uniqueId}@example.com`;
    // Using a clear name to separate from previous tests
    const orderName = `#FULL-${uniqueId}`;

    // Reliable Dog Photo (Golden Retriever)
    const dogPhotoUrl = 'https://images.dog.ceo/breeds/retriever-golden/n02099601_100.jpg';

    const payload = {
        id: uniqueId,
        name: orderName,
        email: email,
        customer: {
            first_name: "Full",
            last_name: "Tester",
            email: email
        },
        line_items: [
            {
                id: uniqueId + 1,
                name: 'Custom Royal Portrait - Digital',
                quantity: 1,
                properties: [
                    { name: 'Pet Name', value: 'Maximus' },
                    { name: 'Breed', value: 'Golden Retriever' },
                    { name: 'Pet Photo', value: dogPhotoUrl },
                    { name: 'Notes', value: 'Full E2E Test' }
                ]
            }
        ]
    };

    const body = JSON.stringify(payload);
    const secret = process.env.SHOPIFY_WEBHOOK_SECRET || 'dummy_secret_for_dev';
    const hmac = crypto.createHmac('sha256', secret).update(body, 'utf8').digest('base64');

    console.log(`📦 Sending Payload... Order: ${orderName}`);

    try {
        const res = await fetch('http://localhost:3000/api/webhooks/shopify', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-shopify-topic': 'orders/create',
                'x-shopify-hmac-sha256': hmac
            },
            body: body
        });

        if (!res.ok) throw new Error(`Webhook failed: ${res.status}`);
        console.log('✅ Webhook accepted.');

        // 2. Wait for Generation (Primary + Bonus + Mockups)
        // Expect: 5 Primary + 5 Bonus + 3 Mockups + (Optional Wallpapers) = ~13+ images
        let orderId = '';
        const maxRetries = 150; // 5 minutes

        for (let i = 0; i < maxRetries; i++) {
            await new Promise(r => setTimeout(r, 2000));

            if (!orderId) {
                const { data: order } = await supabase
                    .from('orders')
                    .select('*')
                    .eq('shopify_order_id', payload.id.toString())
                    .single();
                if (order) orderId = order.id;
            }

            if (orderId) {
                const { data: images } = await supabase
                    .from('images')
                    .select('type, is_bonus')
                    .eq('order_id', orderId);

                const total = images?.length || 0;
                const bonusCount = images?.filter(img => img.is_bonus).length || 0;
                const upsellMockups = images?.filter(img => img.type === 'upsell').length || 0;

                process.stdout.write(`\r[${i}] Images: ${total} (Bonus: ${bonusCount}, Mockups: ${upsellMockups})`);

                // We want at least 5 Primary (Total - Bonus) and 5 Bonus/Upsells
                // Logic: total >= 10 implies we got the bonus loop running
                if (total >= 13) {
                    console.log(`\n\n✅ Generation Complete!`);
                    console.log(`ORDER_ID=${orderId}`);
                    console.log(`MAGIC_LINK=http://localhost:3000/portal/${orderId}`);
                    process.exit(0);
                }
            }
        }
        console.error('\n❌ Timed out.');
        process.exit(1);

    } catch (err) {
        console.error('\n❌ Error:', err);
        process.exit(1);
    }
}

simulateFullWebhook();
