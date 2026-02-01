
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import crypto from 'crypto';

// Load env vars
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function simulateWebhook() {
    console.log('🚀 Starting Golden Run Simulation (Webhook Trigger)...');

    // 1. Construct Payload - #RealDog
    const randomId = Math.floor(Math.random() * 1000000000);
    const generatedName = `#GOLDEN-REAL-${Date.now()}`;
    const payload = {
        id: randomId,
        name: generatedName,
        email: 'captain@example.com',
        customer: {
            first_name: "Captain's",
            last_name: "Owner",
            email: 'captain@example.com'
        },
        line_items: [
            {
                id: 888777666,
                name: 'Custom Pet Portrait',
                quantity: 1,
                properties: [
                    { name: 'Name', value: 'Captain' },
                    { name: 'Breed', value: 'Golden Retriever' },
                    { name: 'Pet Photo', value: 'https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&w=1600&q=80' }
                ]
            }
        ]
    };

    const body = JSON.stringify(payload);

    // 2. Generate HMAC signature
    const secret = process.env.SHOPIFY_WEBHOOK_SECRET || 'dummy_secret_for_dev';
    const hmac = crypto
        .createHmac('sha256', secret)
        .update(body, 'utf8')
        .digest('base64');

    console.log(`📦 Sending Payload to Webhook... Order: ${payload.name}`);

    try {
        // 3. Send Request
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
        console.log('⏳ Waiting for Order to appear in DB...');

        // 4. Poll for Order Creation
        let orderId = '';
        for (let i = 0; i < 20; i++) {
            await new Promise(r => setTimeout(r, 2000));

            const { data: order } = await supabase
                .from('orders')
                .select('*')
                .eq('customer_email', 'captain@example.com')
                .order('created_at', { ascending: false })
                .limit(1)
                .single();

            if (order) {
                console.log(`✅ Order Found in DB: ${order.id}`);
                if (order.pet_name === 'Captain') {
                    console.log('✨ Pet Name verified: Captain');
                } else {
                    console.warn('⚠️ Pet Name match failed. Found:', order.pet_name);
                }
                orderId = order.id;
                break;
            }
            console.log('... polling for order ...');
        }

        if (!orderId) {
            console.error('❌ Order was not created after 40s.');
            process.exit(1);
        }

        // 5. Poll for Generation (Pending Review)
        console.log('⏳ Waiting for Generation (images > 0)...');
        for (let i = 0; i < 45; i++) { // Wait up to 90s
            await new Promise(r => setTimeout(r, 2000));

            const { count } = await supabase
                .from('images')
                .select('*', { count: 'exact', head: true })
                .eq('order_id', orderId);

            if (count && count > 0) {
                console.log(`✅ Generation Started! Found ${count} images.`);
                console.log('🎉 Golden Run Successful. Check Admin Dashboard.');
                console.log(`🔗 Redemption Link: http://localhost:3000/portal/${orderId}`);
                process.exit(0);
            }
            process.stdout.write('.');
        }

        console.error('\n❌ Timed out waiting for images.');

    } catch (err) {
        console.error('❌ Error hitting webhook:', err);
    }
}

simulateWebhook();
