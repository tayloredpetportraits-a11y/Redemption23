
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
    console.log('💆‍♀️ Starting Spa Day Digital E2E Simulation...');

    // 1. Unique Order ID & Customer
    const uniqueId = Math.floor(Math.random() * 100000000) + 900000000; // 9xxxxxxxxx
    const email = `spa.day.${uniqueId}@example.com`;
    const orderName = `#SPA-${uniqueId}`;

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
                // Valid Theme Product Name
                // Our system maps 'spa day' theme ID from product type/name
                // 'Generation' logic looks for theme.id = productType.toLowerCase() or name match
                name: 'Spa Day Digital Portrait',
                quantity: 1,
                properties: [
                    { name: 'Name', value: 'Bubbles' },
                    { name: 'Breed', value: 'French Bulldog' },
                    // High quality Frenchie photo from Unsplash
                    { name: 'Pet Photo', value: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?q=80&w=2938&auto=format&fit=crop' },
                    { name: 'Notes', value: 'Loves cucumbers on eyes' }
                ]
            }
        ]
    };

    const body = JSON.stringify(payload);

    // 2. HMAC Signature
    const secret = process.env.SHOPIFY_WEBHOOK_SECRET || 'dummy_secret_for_dev';
    const hmac = crypto
        .createHmac('sha256', secret)
        .update(body, 'utf8')
        .digest('base64');

    console.log(`📦 Sending Payload... Order: ${orderName}`);
    console.log(`   Customer: ${email}`);

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

        // 4. Poll for Order & Generation
        let orderId = '';
        const maxRetries = 150; // 5 minutes max (generation can take time)

        for (let i = 0; i < maxRetries; i++) {
            await new Promise(r => setTimeout(r, 2000));

            // A. Check for Order
            if (!orderId) {
                const { data: order } = await supabase
                    .from('orders')
                    .select('*')
                    .eq('shopify_order_id', payload.id.toString())
                    .single();

                if (order) {
                    orderId = order.id;
                    console.log(`✅ Order Created: ${order.id}`);
                    console.log(`   Magic Link: http://localhost:3000/portal/${order.id}`);
                }
            }

            // B. Check for Images (if order exists)
            if (orderId) {
                const { count } = await supabase
                    .from('images')
                    .select('*', { count: 'exact', head: true })
                    .eq('order_id', orderId);

                if (count && count >= 5) { // Wait for at least 5 primary images
                    console.log(`✅ Generation Complete! Found ${count} images.`);
                    console.log('🚀 Ready for Browser Test.');
                    console.log('\n-----------------------------------');
                    console.log(`ORDER_ID=${orderId}`);
                    console.log(`MAGIC_LINK=http://localhost:3000/portal/${orderId}`);
                    console.log('-----------------------------------\n');
                    process.exit(0);
                }
                process.stdout.write('.'); // progress dot
            }
        }

        console.error('\n❌ Timed out waiting for generation.');
        process.exit(1);

    } catch (err) {
        console.error('❌ Error:', err);
        process.exit(1);
    }
}

simulateSpaDayWebhook();
