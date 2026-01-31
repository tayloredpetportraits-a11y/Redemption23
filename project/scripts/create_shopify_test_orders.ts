/**
 * Create Test Orders via Shopify Flow
 * Simulates real Shopify orders going through the full AI generation pipeline
 */


import https from 'https';

// Test order configurations
const TEST_ORDERS = [
    {
        customerName: 'Test Customer Digital',
        customerEmail: 'digital@test.com',
        petName: 'Buddy',
        productType: 'Digital Only',
        petBreed: 'Golden Retriever',
        petDetails: 'Friendly golden retriever, loves playing fetch',
        petPhotoUrl: 'https://placedog.net/800/800?id=1'
    },
    {
        customerName: 'Test Customer Canvas',
        customerEmail: 'canvas@test.com',
        petName: 'Max',
        productType: '11x14 Canvas',
        petBreed: 'German Shepherd',
        petDetails: 'Loyal german shepherd, protective and smart',
        petPhotoUrl: 'https://placedog.net/800/800?id=2'
    }
];

async function downloadPetPhoto(url: string): Promise<Buffer> {
    return new Promise((resolve, reject) => {
        https.get(url, (response) => {
            const chunks: Buffer[] = [];
            response.on('data', (chunk) => chunks.push(chunk));
            response.on('end', () => resolve(Buffer.concat(chunks)));
            response.on('error', reject);
        });
    });
}

async function createOrder(orderData: typeof TEST_ORDERS[0]) {
    console.log(`\n📦 Creating order for ${orderData.customerName}...`);
    console.log(`   Product: ${orderData.productType}`);
    console.log(`   Pet: ${orderData.petName} (${orderData.petBreed})`);

    try {
        // Download the pet photo
        console.log('   📸 Downloading pet photo...');
        const photoBuffer = await downloadPetPhoto(orderData.petPhotoUrl);

        // Create form data
        const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2);
        const formData: string[] = [];

        // Add text fields
        formData.push(`--${boundary}\r\n`);
        formData.push(`Content-Disposition: form-data; name="customerName"\r\n\r\n${orderData.customerName}\r\n`);

        formData.push(`--${boundary}\r\n`);
        formData.push(`Content-Disposition: form-data; name="customerEmail"\r\n\r\n${orderData.customerEmail}\r\n`);

        formData.push(`--${boundary}\r\n`);
        formData.push(`Content-Disposition: form-data; name="productType"\r\n\r\n${orderData.productType}\r\n`);

        formData.push(`--${boundary}\r\n`);
        formData.push(`Content-Disposition: form-data; name="petBreed"\r\n\r\n${orderData.petBreed}\r\n`);

        formData.push(`--${boundary}\r\n`);
        formData.push(`Content-Disposition: form-data; name="petDetails"\r\n\r\n${orderData.petDetails}\r\n`);

        formData.push(`--${boundary}\r\n`);
        formData.push(`Content-Disposition: form-data; name="autoApprove"\r\n\r\ntrue\r\n`);

        // Add file
        formData.push(`--${boundary}\r\n`);
        formData.push(`Content-Disposition: form-data; name="petPhoto"; filename="${orderData.petName.toLowerCase()}.jpg"\r\n`);
        formData.push(`Content-Type: image/jpeg\r\n\r\n`);

        const formDataStr = formData.join('');
        const formDataBuffer = Buffer.concat([
            Buffer.from(formDataStr, 'utf8'),
            photoBuffer,
            Buffer.from(`\r\n--${boundary}--\r\n`, 'utf8')
        ]);

        // Make the request
        const response = await fetch('http://localhost:3000/api/orders/create', {
            method: 'POST',
            headers: {
                'Content-Type': `multipart/form-data; boundary=${boundary}`,
                'Content-Length': formDataBuffer.length.toString()
            },
            body: formDataBuffer
        });

        const result = await response.json();

        if (response.ok && result.success) {
            console.log(`   ✅ Order created successfully!`);
            console.log(`   📍 Customer URL: ${result.customerUrl}`);
            console.log(`   🤖 AI generation started in background...`);
            return result;
        } else {
            console.error(`   ❌ Failed to create order:`, result.error);
            throw new Error(result.error);
        }
    } catch (error: any) {
        console.error(`   ❌ Error:`, error.message);
        throw error;
    }
}

async function main() {
    console.log('🚀 Simulating Shopify Orders with Full AI Generation Pipeline\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    const results = [];

    for (const orderData of TEST_ORDERS) {
        try {
            const result = await createOrder(orderData);
            results.push(result);

            // Wait a bit between orders to avoid overwhelming the system
            console.log('   ⏳ Waiting 2 seconds before next order...');
            await new Promise(resolve => setTimeout(resolve, 2000));
        } catch (error) {
            console.error('Failed to create order:', error);
        }
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎉 All orders submitted!\n');
    console.log('📋 IMPORTANT:');
    console.log('   • AI generation is running in the background');
    console.log('   • Check the admin dashboard to monitor progress');
    console.log('   • Images will be auto-approved (autoApprove=true)');
    console.log('   • Orders will be set to "ready" status when complete');
    console.log('   • Check your terminal for AI generation logs');
    console.log('\n🔗 Customer URLs:');
    results.forEach((result, i) => {
        console.log(`   ${i + 1}. http://localhost:3000${result.customerUrl}`);
    });

    console.log('\n⏳ Wait 30-60 seconds for AI generation to complete...');
    console.log('   Then refresh the customer URLs or check admin dashboard\n');
}

main()
    .then(() => {
        console.log('✨ Script completed successfully');
    })
    .catch((error) => {
        console.error('❌ Script failed:', error.message);
        process.exit(1);
    });
