import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import crypto from 'crypto';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testYeeMinimalist() {
    console.log('🐕 Starting E2E Test: Yee - Minimalist Style...\n');

    const uniqueId = Math.floor(Math.random() * 100000000) + 900000000;
    const email = `yee.test.${uniqueId}@example.com`;
    const orderName = `#YEE-${uniqueId}`;

    const payload = {
        id: uniqueId,
        name: orderName,
        email: email,
        customer: { first_name: "Test", last_name: "Customer", email: email },
        line_items: [{
            id: uniqueId + 1,
            name: 'Minimalist Canvas 11x14',
            quantity: 1,
            properties: [
                { name: 'Name', value: 'Yee' },
                { name: 'Breed', value: 'Mixed Breed' },
                { name: 'Pet Photo', value: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?q=80&w=1974&auto=format&fit=crop' },
                { name: 'Theme', value: 'minimalist' },
                { name: 'Product Type', value: 'canvas-11x14' }
            ]
        }]
    };

    const body = JSON.stringify(payload);
    const secret = process.env.SHOPIFY_WEBHOOK_SECRET || 'dummy_secret_for_dev';
    const hmac = crypto.createHmac('sha256', secret).update(body, 'utf8').digest('base64');

    console.log(`📦 Order: ${orderName} | Pet: Yee | Theme: Minimalist\n`);

    try {
        const ports = [3001, 3000];
        let res, usedPort;

        for (const port of ports) {
            try {
                res = await fetch(`http://localhost:${port}/api/webhooks/shopify`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-shopify-topic': 'orders/create',
                        'x-shopify-hmac-sha256': hmac
                    },
                    body: body
                });
                if (res.ok) { usedPort = port; break; }
            } catch (e) { }
        }

        if (!res || !res.ok) throw new Error('Webhook failed');

        console.log(`✅ Webhook accepted (Port ${usedPort})\n⏳ Waiting for generation...\n`);

        let orderId = '';
        for (let i = 0; i < 150; i++) {
            await new Promise(r => setTimeout(r, 2000));

            if (!orderId) {
                const { data: order } = await supabase.from('orders').select('*').eq('shopify_order_id', payload.id.toString()).single();
                if (order) {
                    orderId = order.id;
                    console.log(`\n✅ Order Created: ${order.id}`);
                }
            }

            if (orderId) {
                const { data: images, count } = await supabase.from('images').select('*', { count: 'exact' }).eq('order_id', orderId);
                const primaryCount = images?.filter(img => img.image_type === 'primary').length || 0;

                if (primaryCount >= 5 && count && count >= 10) {
                    await supabase.from('orders').update({ order_status: 'ready' }).eq('id', orderId);
                    console.log(`\n✅ Complete! ${count} images generated\n`);
                    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                    console.log(`ORDER_ID: ${orderId}`);
                    console.log(`PORTAL: http://localhost:${usedPort}/order/${orderId}`);
                    console.log(`ADMIN: http://localhost:${usedPort}/admin`);
                    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
                    process.exit(0);
                }
                process.stdout.write('.');
            }
        }

        console.error('\n❌ Timeout');
        process.exit(1);
    } catch (err) {
        console.error('❌ Error:', err);
        process.exit(1);
    }
}

testYeeMinimalist();
