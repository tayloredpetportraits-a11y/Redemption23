
import { generateProductMockup } from './src/lib/ai/generation';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Load env
dotenv.config({ path: '.env.local' });

async function testMockup() {
    console.log('Testing AI Mockup Generation...');

    // 1. Inputs
    // We need a "Portrait" to place. Let's use the custom dog (simulating a generated portrait)
    const portraitPath = path.join(process.cwd(), 'public', 'uploads', 'pets', 'custom_dog.jpg');

    // We'll test generating a Canvas Mockup
    const productType = 'canvas-16x20';
    const outputPath = path.join(process.cwd(), 'public', 'generated', 'test_mockup_canvas.png');

    // Ensure directory exists
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    // 2. Generate
    console.log(`Portrait: ${portraitPath}`);
    console.log(`Output: ${outputPath}`);

    const success = await generateProductMockup(portraitPath, productType, outputPath);

    if (success) {
        console.log('SUCCESS! Mockup generated.');
        console.log(`View at: http://localhost:3000/generated/test_mockup_canvas.png`);
    } else {
        console.error('FAILED to generate mockup.');
    }
}

testMockup();
