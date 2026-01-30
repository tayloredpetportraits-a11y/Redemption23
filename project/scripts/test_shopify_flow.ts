
import dotenv from 'dotenv';
import path from 'path';
import crypto from 'crypto';

// Load env
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

async function runTest() {
    const topic = 'orders/create';
    const secret = process.env.SHOPIFY_WEBHOOK_SECRET || 'dummy_secret_for_debug';

    // Mock Payload
    const payload = {
        id: Math.floor(Math.random() * 1000000),
        email: 'test-qa@example.com',
        created_at: new Date().toISOString(),
        customer: {
            first_name: 'QA',
            last_name: 'Tester',
            email: 'test-qa@example.com'
        },
        line_items: [
            {
                name: 'The General Custom Pet Portrait',
                properties: [
                    { name: 'Pet Name', value: 'Buster' },
                    { name: 'Pet Breed', value: 'Golden Retriever' },
                    { name: 'Pet Photo', value: 'https://placehold.co/1024x1024.jpg' }, // Mock image
                    { name: 'Style', value: 'Royalty' }
                ]
            }
        ]
    };

    const rawBody = JSON.stringify(payload);

    // Create HMAC
    const hmac = crypto
        .createHmac('sha256', secret)
        .update(rawBody, 'utf8')
        .digest('base64');

    console.log(`Sending Webhook to http://localhost:3000/api/webhooks/shopify...`);
    console.log(`Payload ID: ${payload.id}`);

    try {
        const res = await fetch('http://localhost:3000/api/webhooks/shopify', {
            method: 'POST',
            headers: {
                'x-shopify-topic': topic,
                'x-shopify-hmac-sha256': hmac,
                'Content-Type': 'application/json'
            },
            body: rawBody
        });

        const text = await res.text();
        console.log(`Status: ${res.status}`);
        console.log(`Response: ${text}`);
    } catch (e) {
        console.error("Failed to send webhook:", e);
    }
}

runTest();
