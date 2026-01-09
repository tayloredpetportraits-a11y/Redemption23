
import dotenv from 'dotenv';
import path from 'path';

// Load env BEFORE imports that might use it
dotenv.config({ path: '.env.local' });

import fs from 'fs';
import { generateProductMockup, generateMockupWithCustomBlank } from './src/lib/ai/generation';
import { PrintifyService } from './src/lib/printify/service';

async function testMockupImprovement() {
    console.log('🧪 Testing Mockup Improvements...');

    // Setup
    const testDir = path.join(process.cwd(), 'public', 'generated', 'test_comparison');
    if (!fs.existsSync(testDir)) fs.mkdirSync(testDir, { recursive: true });

    const portraitPath = path.join(process.cwd(), 'public', 'uploads', 'pets', 'custom_dog.jpg');
    if (!fs.existsSync(portraitPath)) {
        console.error('❌ Missing test image: custom_dog.jpg');
        return;
    }

    // 1. Test Optimized Nano Banana
    console.log('\n--- 1. Testing Optimized Nano Banana (Canvas) ---');
    const nanoOutputPath = path.join(testDir, 'nano_optimized_canvas.png');
    await generateProductMockup(portraitPath, 'canvas-16x20', nanoOutputPath);

    // 2. Test Custom Blank Upload (Simulated)
    console.log('\n--- 2. Testing Custom Blank Upload (Mug) ---');
    // Using a placeholder blank image if available, or just re-using a base asset
    const customBlankPath = path.join(process.cwd(), 'public', 'assets', 'mockups', 'tumbler_base.png');
    if (fs.existsSync(customBlankPath)) {
        const customOutputPath = path.join(testDir, 'nano_custom_blank_tumbler.png');
        await generateMockupWithCustomBlank(customBlankPath, portraitPath, customOutputPath);
    } else {
        console.log('⚠️ Skipping Custom Blank test - tumbler_base.png not found');
    }

    // 3. Test Real Printify API
    console.log('\n--- 3. Testing Real Printify API Mockup ---');
    // We need a dummy public URL because Printify can't reach localhost
    const publicTestUrl = "https://images.unsplash.com/photo-1543466835-00a7907e9de1?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80"; // A dog photo

    // Using generic Canvas 11x14 blueprint as example (Blueprint 75, Variant 45432 - illustrative)
    // We will rely on the service to lookup config if possible
    const printifyUrl = await PrintifyService.generateMockupImage(publicTestUrl, 'canvas-16x20');

    if (printifyUrl) {
        console.log(`✅ Printify Mockup URL: ${printifyUrl}`);
        // Download it for side-by-side comparison
        const resp = await fetch(printifyUrl);
        const blob = await resp.arrayBuffer();
        fs.writeFileSync(path.join(testDir, 'printify_real_canvas.png'), Buffer.from(blob));
        console.log('Saved to printify_real_canvas.png');
    } else {
        console.log('❌ Printify Mockup Generation Failed');
    }

    console.log('\n🏁 Test Complete. Check public/generated/test_comparison/');
}

testMockupImprovement();
