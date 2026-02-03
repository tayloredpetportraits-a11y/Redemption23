const crypto = require('crypto');

// Webhook secret from .env.local
const secret = '509ab94f254c95489b35541c4efa7fc09410f084d81dcec3413763c884399130';

// Webhook payload (must match exactly what we send)
const payload = JSON.stringify({
    "id": 999888777,
    "order_number": 1001,
    "email": "webhook-test@example.com",
    "customer": {
        "email": "webhook-test@example.com",
        "first_name": "Taylor",
        "last_name": "Test"
    },
    "line_items": [{
        "id": 123456,
        "name": "Custom Pet Portrait - Spa Day",
        "title": "Custom Pet Portrait - Spa Day",
        "properties": [
            { "name": "Pet Photo", "value": "https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=800" },
            { "name": "Pet Name", "value": "Max" },
            { "name": "Pet Breed", "value": "Golden Retriever" },
            { "name": "Special", "value": "Loves playing fetch and swimming" }
        ]
    }],
    "created_at": "2026-02-02T17:54:00-06:00"
});

// Generate HMAC
const hmac = crypto
    .createHmac('sha256', secret)
    .update(payload, 'utf8')
    .digest('base64');

console.log('HMAC Signature:', hmac);
console.log('\nCurl command:');
console.log(`curl -X POST http://localhost:3000/api/webhooks/shopify \\
  -H "Content-Type: application/json" \\
  -H "X-Shopify-Topic: orders/paid" \\
  -H "X-Shopify-Hmac-Sha256: ${hmac}" \\
  -d '${payload}'`);
