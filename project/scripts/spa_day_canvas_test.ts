import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const orderNumber = `SPA-${Math.floor(Math.random() * 1000000)}`;
const timestamp = new Date().toISOString();

const shopifyPayload = {
    id: Math.floor(Math.random() * 1000000000),
    order_number: orderNumber,
    email: 'spa.canvas.customer@example.com',
    created_at: timestamp,
    customer: {
        id: Math.floor(Math.random() * 1000000),
        email: 'spa.canvas.customer@example.com',
        first_name: 'Spa',
        last_name: 'Customer'
    },
    line_items: [
        {
            id: Math.floor(Math.random() * 1000000000),
            title: 'Luxury Spa Day Portrait - Canvas 11x14',
            name: 'Luxury Spa Day Portrait - Canvas 11x14',
            variant_title: 'Canvas 11x14',
            quantity: 1,
            price: '79.99',
            product_id: Math.floor(Math.random() * 1000000000),
            variant_id: Math.floor(Math.random() * 1000000000),
            properties: [
                {
                    name: 'Pet Photo',
                    value: 'https://images.dog.ceo/breeds/retriever-golden/n02099601_3004.jpg'
                },
                {
                    name: 'Pet Name',
                    value: 'Bella'
                },
                {
                    name: 'Pet Breed',
                    value: 'Golden Retriever'
                }
            ]
        }
    ]
};

async function runTest() {
    console.log('🎨 Simulating Shopify Order: Spa Day Theme on Canvas');
    console.log(`📦 Order: ${orderNumber}`);
    console.log(`👤 Customer: Spa Customer (spa.canvas.customer@example.com)`);
    console.log(`🐕 Pet: Bella (Golden Retriever)`);
    console.log('');

    const port = process.env.PORT || '3000';
    const webhookUrl = `http://localhost:${port}/api/webhooks/shopify`;

    console.log(`📡 Sending webhook to: ${webhookUrl}`);

    try {
        const res = await fetch(webhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-shopify-topic': 'orders/create',
            },
            body: JSON.stringify(shopifyPayload),
        });

        if (!res.ok) {
            throw new Error(`Webhook failed: ${res.status}`);
        }

        console.log('✅ Webhook accepted!');
        console.log('');
        console.log('🎨 AI Generation started...');
        console.log('⏳ This will take 2-3 minutes for Spa Day theme images');
        console.log('');
        console.log('📊 Expected Output:');
        console.log('   - 5 Primary Spa Day portraits');
        console.log('   - 5 Bonus/upsell images (if configured)');
        console.log('   - Canvas mockup preview');
        console.log('');
        console.log('💡 Check dev server logs for generation progress');

    } catch (err) {
        console.error('❌ Error:', err);
        process.exit(1);
    }
}

runTest();
