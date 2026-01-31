/**
 * Create Test Orders Script
 * Creates two test orders with images for testing the redemption portal
 */

import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';
import https from 'https';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables from .env.local
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase credentials');
    console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl);
    console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? 'SET' : 'NOT SET');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Dog image URLs from various sources
const DOG_IMAGES = [
    'https://placedog.net/500/500?id=1',
    'https://placedog.net/500/500?id=2',
    'https://placedog.net/500/500?id=3',
    'https://placedog.net/500/500?id=4',
    'https://placedog.net/500/500?id=5',
    'https://placedog.net/500/500?id=6',
    'https://placedog.net/500/500?id=7',
    'https://placedog.net/500/500?id=8',
    'https://placedog.net/500/500?id=9',
    'https://placedog.net/500/500?id=10',
];

const BONUS_THEMES = [
    'Christmas',
    'Space Adventure',
    'Memorial',
    'Tropical Paradise',
    'Autumn Forest'
];

interface OrderData {
    customer_name: string;
    customer_email: string;
    pet_name: string;
    product_type: string;
    status: string;
    payment_status: string;
    bonus_unlocked: boolean;
    access_token: string;
}

async function downloadImage(url: string): Promise<Buffer> {
    return new Promise((resolve, reject) => {
        https.get(url, (response) => {
            const chunks: Buffer[] = [];
            response.on('data', (chunk) => chunks.push(chunk));
            response.on('end', () => resolve(Buffer.concat(chunks)));
            response.on('error', reject);
        });
    });
}

async function uploadImageToSupabase(
    imageBuffer: Buffer,
    filename: string
): Promise<string> {
    const { data, error } = await supabase.storage
        .from('primary-images')
        .upload(filename, imageBuffer, {
            contentType: 'image/jpeg',
            upsert: true
        });

    if (error) {
        throw new Error(`Failed to upload ${filename}: ${error.message}`);
    }

    const { data: urlData } = supabase.storage
        .from('primary-images')
        .getPublicUrl(data.path);

    return urlData.publicUrl;
}

async function createOrder(orderData: OrderData): Promise<string> {
    const { data, error } = await supabase
        .from('orders')
        .insert(orderData)
        .select('id')
        .single();

    if (error) {
        throw new Error(`Failed to create order: ${error.message}`);
    }

    return data.id;
}

async function createImageRecord(
    orderId: string,
    url: string,
    storagePath: string,
    type: string,
    isBonus: boolean,
    displayOrder: number,
    themeName: string | null = null
) {
    const { error } = await supabase
        .from('images')
        .insert({
            order_id: orderId,
            url,
            storage_path: storagePath,
            type,
            is_bonus: isBonus,
            theme_name: themeName,
            watermarked_url: null,
            display_order: displayOrder,
            status: 'approved'
        });

    if (error) {
        throw new Error(`Failed to create image record: ${error.message}`);
    }
}

async function main() {
    console.log('🚀 Creating test orders for redemption portal...\n');

    // Generate access tokens
    const token1 = randomUUID();
    const token2 = randomUUID();

    console.log('📦 Order #1: Digital Only');
    console.log('Access Token:', token1);

    // Create Order #1 - Digital Only
    const order1Data: OrderData = {
        customer_name: 'Test Customer Digital',
        customer_email: 'digital@test.com',
        pet_name: 'Buddy',
        product_type: 'Digital Only',
        status: 'ready',
        payment_status: 'paid',
        bonus_unlocked: false,
        access_token: token1
    };

    const orderId1 = await createOrder(order1Data);
    console.log('✅ Order created:', orderId1);

    // Upload and create base portraits for Order #1
    console.log('\n📸 Uploading base portraits...');
    for (let i = 0; i < 5; i++) {
        console.log(`  Downloading image ${i + 1}/5...`);
        const imageBuffer = await downloadImage(DOG_IMAGES[i]);
        const filename = `test-orders/${orderId1}/base-${i + 1}.jpg`;
        const url = await uploadImageToSupabase(imageBuffer, filename);
        await createImageRecord(orderId1, url, filename, 'primary', false, i + 1);
        console.log(`  ✅ Uploaded: ${filename}`);
    }

    // Upload and create bonus portraits for Order #1
    console.log('\n🎨 Uploading bonus portraits...');
    for (let i = 0; i < 5; i++) {
        console.log(`  Downloading bonus image ${i + 1}/5...`);
        const imageBuffer = await downloadImage(DOG_IMAGES[i + 5]);
        const filename = `test-orders/${orderId1}/bonus-${BONUS_THEMES[i].toLowerCase().replace(/\s+/g, '-')}.jpg`;
        const url = await uploadImageToSupabase(imageBuffer, filename);
        await createImageRecord(orderId1, url, filename, 'primary', true, i + 1, BONUS_THEMES[i]);
        console.log(`  ✅ Uploaded: ${filename} (${BONUS_THEMES[i]})`);
    }

    console.log('\n📦 Order #2: Canvas');
    console.log('Access Token:', token2);

    // Create Order #2 - Canvas
    const order2Data: OrderData = {
        customer_name: 'Test Customer Canvas',
        customer_email: 'canvas@test.com',
        pet_name: 'Max',
        product_type: '11x14 Canvas',
        status: 'ready',
        payment_status: 'paid',
        bonus_unlocked: false,
        access_token: token2
    };

    const orderId2 = await createOrder(order2Data);
    console.log('✅ Order created:', orderId2);

    // Get images from Order #1 and link to Order #2
    const { data: order1Images, error: imagesError } = await supabase
        .from('images')
        .select('url, storage_path, type, is_bonus, theme_name, display_order')
        .eq('order_id', orderId1);

    if (imagesError) {
        throw new Error(`Failed to fetch images: ${imagesError.message}`);
    }

    console.log('\n🔗 Linking images to Order #2...');
    for (const img of order1Images!) {
        await createImageRecord(
            orderId2,
            img.url,
            img.storage_path,
            img.type,
            img.is_bonus,
            img.display_order,
            img.theme_name
        );
    }
    console.log('✅ Images linked');

    // Print magic links
    console.log('\n\n🎉 SUCCESS! Test orders created!\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📱 MAGIC LINKS FOR TESTING:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('🔹 Order #1 - Digital Only (Buddy):');
    console.log(`   http://localhost:3000/redeem/${token1}\n`);

    console.log('🔹 Order #2 - Canvas (Max):');
    console.log(`   http://localhost:3000/redeem/${token2}\n`);

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('✅ Test Checklist:');
    console.log('\n📋 Digital Only Order:');
    console.log('  ☐ Shows 5 base portraits with download buttons');
    console.log('  ☐ Shows revision request checkboxes and button');
    console.log('  ☐ Shows bonus theme preview with CSS watermark');
    console.log('  ☐ "Unlock All 5 Bonus Themes for $15" button visible');
    console.log('  ☐ NO physical product selection section');
    console.log('  ☐ Social sharing section at bottom');

    console.log('\n📋 Canvas Order:');
    console.log('  ☐ Shows 5 base portraits with download buttons');
    console.log('  ☐ Shows revision request system');
    console.log('  ☐ Shows bonus theme preview');
    console.log('  ☐ Shows "Choose Your Print" section');
    console.log('  ☐ Shows product mockup preview when portrait selected');
    console.log('  ☐ Social sharing section');
    console.log('\n');
}

main()
    .then(() => {
        console.log('✨ Script completed successfully');
        process.exit(0);
    })
    .catch((error) => {
        console.error('❌ Error:', error.message);
        process.exit(1);
    });
