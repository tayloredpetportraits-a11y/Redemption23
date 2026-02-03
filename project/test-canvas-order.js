const crypto = require('crypto');

// Webhook secret
const secret = '509ab94f254c95489b35541c4efa7fc09410f084d81dcec3413763c884399130';

// 11x14 Canvas order payload
const payload = JSON.stringify({
    "id": 888777666,
    "order_number": 2002,
    "email": "customer@example.com",
    "customer": {
        "email": "customer@example.com",
        "first_name": "Sarah",
        "last_name": "Johnson"
    },
    "line_items": [{
        "id": 654321,
        "name": "Custom Pet Portrait - 11x14 Canvas",
        "title": "Custom Pet Portrait - 11x14 Canvas",
        "properties": [
            { "name": "Pet Photo", "value": "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=800" },
            { "name": "Pet Name", "value": "Luna" },
            { "name": "Pet Breed", "value": "Husky" },
            { "name": "Special", "value": "Loves snow and running" }
        ]
    }],
    "created_at": "2026-02-02T18:56:00-06:00"
});

// Generate HMAC
const hmac = crypto.createHmac('sha256', secret).update(payload, 'utf8').digest('base64');

console.log('Testing 11x14 Canvas Order Flow\n');
console.log('HMAC:', hmac);
console.log('\nCurl Command:');
console.log(`curl -X POST http://localhost:3000/api/webhooks/shopify \\
  -H "Content-Type: application/json" \\
  -H "X-Shopify-Topic: orders/paid" \\
  -H "X-Shopify-Hmac-Sha256: ${hmac}" \\
  -d '${payload}'`);
