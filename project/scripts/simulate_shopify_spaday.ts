
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import crypto from 'crypto';

// Load env vars
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function simulateSpaDayWebhook() {
    console.log('🛁 Starting Spa Day + Canvas Order E2E Simulation...');

    // 1. Unique Order ID
    const uniqueId = Math.floor(Math.random() * 100000000) + 800000000;
    const email = `spaday.canvas.${uniqueId}@example.com`;
    const orderName = `#SPA-${uniqueId}`;

    // Real Dog Photo from random Internet source (or local if we could upload, but webhook needs URL)
    // Using a reliable Dog CEO image
    const dogPhotoUrl = 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80';

    const payload = {
        id: uniqueId,
        name: orderName,
        email: email,
        customer: {
            first_name: "Spa",
            last_name: "Lover",
            email: email
        },
        line_items: [
            {
                id: uniqueId + 1,
                // "Spa Day" triggers theme. "Canvas" triggers print product logic?
                name: 'Custom Pet Portrait - Spa Day Theme - 16x20 Canvas',
                quantity: 1,
                properties: [
                    { name: 'Pet Name', value: 'Winston' },
                    { name: 'Breed', value: 'English Bulldog' },
                    { name: 'Pet Photo', value: dogPhotoUrl },
                    { name: 'Notes', value: 'He loves relaxing' },
                    { name: '_Case', value: 'Canvas' } // Often hidden properties indicate type
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
        const maxRetries = 120; // 4 minutes

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
                    console.log(`   Theme Detected: ${order.product_type}`);
                    console.log(`   Print Product: ${order.selected_print_product || 'None'}`);
                }
            }

            if (orderId) {
                // Check if we have Primary Images AND Upsell Mockups
                const { data: images } = await supabase
                    .from('images')
                    .select('type, status, theme_name, is_bonus')
                    .eq('order_id', orderId);

                const count = images?.length || 0;
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const bonus = images?.filter((img: any) => img.type === 'upsell' || img.is_bonus).length || 0;
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const mobile = images?.filter((img: any) => img.type === 'mobile_wallpaper').length || 0;

                // We expect 5 Primary + 5 Bonus + 1 Mobile (maybe)
                if (count >= 10) {
                    console.log(`✅ Generation Complete! Found ${count} images.`);
                    console.log(`   - Bonus/Upsell: ${bonus}`);
                    console.log(`   - Mobile: ${mobile}`);
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

simulateSpaDayWebhook();
