
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import sharp from 'sharp';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

// Duplicate watermarking logic
async function applyHeavyWatermark(inputBuffer: Buffer): Promise<Buffer> {
    const width = 1024;
    const height = 1536;

    const svgText = `
    <svg width="${width}" height="${height}">
      <style>
        .heavy { fill: rgba(255, 255, 255, 0.15); font-size: 80px; font-weight: bold; transform: rotate(-45deg); transform-origin: center; }
      </style>
      <text x="50%" y="50%" text-anchor="middle" class="heavy" transform="rotate(-45, ${width / 2}, ${height / 2})">LOCKED PREVIEW</text>
      <text x="50%" y="30%" text-anchor="middle" class="heavy" transform="rotate(-45, ${width / 2}, ${height / 2})">BONUS THEME</text>
      <text x="50%" y="70%" text-anchor="middle" class="heavy" transform="rotate(-45, ${width / 2}, ${height / 2})">$5 UNLOCK</text>
    </svg>
    `;

    // Resize input to match projected canvas if needed, or just composite
    // For mock, let's just resize the input to 1024x1536 to ensure watermark fits
    const resized = await sharp(inputBuffer).resize(1024, 1536, { fit: 'cover' }).toBuffer();

    return sharp(resized)
        .composite([{ input: Buffer.from(svgText), blend: 'over' }])
        .toBuffer();
}

async function setupTestOrderMock() {
    const customerEmail = 'tester_mock@example.com';
    const petName = 'BuddyMock';
    const petPhotoUrl = '/uploads/pets/test_dog.jpg';

    // Absolute path to source image
    const sourceImgPath = path.join(process.cwd(), 'public', 'uploads', 'pets', 'test_dog.jpg');
    if (!fs.existsSync(sourceImgPath)) {
        console.error("Source image not found:", sourceImgPath);
        return;
    }

    console.log('Creating MOCK test order...');

    // 1. Create Order
    const { data: order, error } = await supabase
        .from('orders')
        .insert({
            customer_email: customerEmail,
            customer_name: 'Mock Customer',
            pet_name: petName,
            pet_image_url: petPhotoUrl,
            status: 'pending',
            payment_status: 'paid',
            product_type: 'royalty',
            pet_breed: 'Mixed Breed',
        })
        .select()
        .single();

    if (error) {
        console.error('Error creating order:', error);
        return;
    }

    console.log(`Order created: ${order.id}`);

    // 2. Mock Image Generation
    const outputDir = path.join(process.cwd(), 'public', 'generated', order.id);
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    const allImages = [];

    // A. Primary Images (3 images)
    for (let i = 0; i < 3; i++) {
        const filename = `primary_swap_${i}.png`;
        const outPath = path.join(outputDir, filename);

        // Just copy source image as the "swapped" image
        fs.copyFileSync(sourceImgPath, outPath);

        allImages.push({
            order_id: order.id,
            url: `/generated/${order.id}/${filename}`,
            storage_path: `generated/${order.id}/${filename}`, // Valid path for Primary
            type: 'primary',
            is_selected: false,
            status: 'approved',
            display_order: i,
            theme_name: 'Royalty Swap',
            is_bonus: false
        });
    }

    // B. Bonus Images (3 images)
    for (let i = 0; i < 3; i++) {
        const secretFilename = `upsell_secret_${i}.png`; // Clean
        const publicFilename = `upsell_swap_${i}.png`;   // Watermarked

        const secretPath = path.join(outputDir, secretFilename);
        const publicPath = path.join(outputDir, publicFilename);

        // 1. Copy Clean
        fs.copyFileSync(sourceImgPath, secretPath);

        // 2. Create Watermarked
        const cleanBuf = fs.readFileSync(secretPath);
        const watermarkedBuf = await applyHeavyWatermark(cleanBuf);
        fs.writeFileSync(publicPath, watermarkedBuf);

        allImages.push({
            order_id: order.id,
            url: `/generated/${order.id}/${publicFilename}`, // Points to Watermarked
            storage_path: `generated/${order.id}/${secretFilename}`, // Secret Clean
            type: 'upsell',
            is_selected: false,
            status: 'pending_review',
            display_order: i + 3,
            theme_name: 'Bonus Swap',
            is_bonus: true
        });
    }

    // 3. Insert Images
    const { error: imgError } = await supabase.from('images').insert(allImages);
    if (imgError) {
        console.error("Error inserting images:", imgError);
    } else {
        console.log("Images inserted successfully.");
        console.log(`Test URL: http://localhost:3000/customer/gallery/${order.id}`);
    }
}

setupTestOrderMock();
