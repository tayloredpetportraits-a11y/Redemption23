// simulate_shopify_order.js
const crypto = require('crypto');

async function simulateWebhook() {
    const secret = process.env.SHOPIFY_WEBHOOK_SECRET || 'dummy_secret_for_dev';

    // ---------------------------------------------------------
    // CHANGE THIS DATA TO TEST DIFFERENT SCENARIOS
    // ---------------------------------------------------------
    const payload = {
        id: Math.floor(Math.random() * 1000000000), // Random Order ID
        email: "test_customer@example.com",
        customer: {
            first_name: "Taylor",
            last_name: "Strong"
        },
        line_items: [
            {
                name: "Custom Royal Pet Portrait",
                properties: [
                    { name: "Pet Photo", value: "https://place.dog/800/1000" }, // Random Dog Image
                    { name: "Pet Breed", value: "Spaniel" },
                    { name: "Pet Name", value: "Lady" },
                    { name: "What makes them special", value: "She has long floppy ears and loves spaghetti." },
                    { name: "Notes", value: "Please use the Queen Elizabeth costume." }
                ]
            }
        ]
    };
    // ---------------------------------------------------------

    const body = JSON.stringify(payload);

    // Calculate Security HMAC
    const hmac = crypto.createHmac('sha256', secret).update(body, 'utf8').digest('base64');

    console.log("🚀 Sending Simulated Shopify Webhook...");
    console.log(`📦 Order ID: ${payload.id}`);
    console.log(`👤 Customer: ${payload.email}`);

    try {
        const res = await fetch('http://localhost:3000/api/webhooks/shopify', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Shopify-Topic': 'orders/create',
                'X-Shopify-Hmac-Sha256': hmac
            },
            body: body
        });

        const data = await res.json();

        if (res.ok) {
            console.log("\n✅ SUCCESS! Webhook accepted.");
            console.log("-----------------------------------");
            console.log("What to do next:");
            console.log("1. Check your Admin Dashboard at http://localhost:3000/admin/orders");
            console.log("2. You should see a new order for 'Taylor Strong'.");
            console.log("3. The AI generation has started in the background.");
        } else {
            console.error("\n❌ FAILED. Status:", res.status);
            console.error("Error:", data);
        }

    } catch (e) {
        console.error("\n❌ Request failed. Is your server running?");
        console.error("Run 'npm run dev' in another terminal first.");
    }
}

simulateWebhook();
