
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import crypto from 'crypto';

// Load env vars
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function simulateRoyaltyWebhook() {
    console.log('👑 Starting Royalty Order E2E Simulation...');

    // 1. Unique Order ID
    const uniqueId = Math.floor(Math.random() * 100000000) + 800000000;
    const email = `royalty.test.${uniqueId}@example.com`;
    const orderName = `#ROYAL-${uniqueId}`;

    // Real Dog Photo: Reliable source
    const dogPhotoUrl = 'https://images.dog.ceo/breeds/retriever-golden/n02099601_100.jpg';

    const payload = {
        id: uniqueId,
        name: orderName,
        email: email,
        customer: {
            first_name: "King",
            last_name: "Customer",
            email: email
        },
        line_items: [
            {
                id: uniqueId + 1,
                // "Royalty" triggers the royalty theme mapping
                name: 'Custom Royal Portrait - Digital',
                quantity: 1,
                properties: [
                    { name: 'Pet Name', value: 'Rex' },
                    { name: 'Breed', value: 'Golden Retriever' },
                    { name: 'Pet Photo', value: dogPhotoUrl },
                    { name: 'Notes', value: 'Make him look majestic' }
                ]
            }
        ]
    };

    const body = JSON.stringify(payload);

    // 2. HMAC
    const secret = process.env.SHOPIFY_WEBHOOK_SECRET || 'dummy_secret_for_dev';
    const hmac = crypto
        .createHmac('sha256', secret)
        .update(body, 'utf8')
        .digest('base64');

    console.log(`📦 Sending Payload... Order: ${orderName}`);
    console.log(`   Photo: ${dogPhotoUrl}`);

    try {
        // 3. Send Webhook
        const res = await fetch('http://localhost:3000/api/webhooks/shopify', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-shopify-topic': 'orders/create',
                'x-shopify-hmac-sha256': hmac
            },
            body: body
        });

        if (!res.ok) {
            const text = await res.text();
            throw new Error(`Webhook failed: ${res.status} ${text}`);
        }

        console.log('✅ Webhook accepted (200 OK)');
        console.log('⏳ Waiting for Order Creation & Generation...');

        // 4. Poll
        let orderId = '';
        const maxRetries = 90; // 3 minutes (mockups take time)

        for (let i = 0; i < maxRetries; i++) {
            await new Promise(r => setTimeout(r, 2000));

            if (!orderId) {
                const { data: order } = await supabase
                    .from('orders')
                    .select('*')
                    .eq('shopify_order_id', payload.id.toString())
                    .single();

                if (order) {
                    orderId = order.id;
                    console.log(`✅ Order Created: ${order.id}`);
                }
            }

            if (orderId) {
                // Check if we have Primary Images AND Upsell Mockups
                const { data: images } = await supabase
                    .from('images')
                    .select('type, status')
                    .eq('order_id', orderId);

                const count = images?.length || 0;
                const upsells = images?.filter(img => img.type === 'upsell').length || 0;
                const mobile = images?.filter(img => img.type === 'mobile_wallpaper').length || 0;

                if (count >= 5 && upsells > 0) {
                    console.log(`✅ Generation Complete! Found ${count} images (${upsells} upsells, ${mobile} wallpapers).`);
                    console.log('\n-----------------------------------');
                    console.log(`ORDER_ID=${orderId}`);
                    console.log(`MAGIC_LINK=http://localhost:3000/portal/${orderId}`);
                    console.log('-----------------------------------\n');
                    process.exit(0);
                }
                process.stdout.write('.');
            }
        }

        console.error('\n❌ Timed out waiting for complete generation.');
        process.exit(1);

    } catch (err) {
        console.error('❌ Error:', err);
        process.exit(1);
    }
}

simulateRoyaltyWebhook();
