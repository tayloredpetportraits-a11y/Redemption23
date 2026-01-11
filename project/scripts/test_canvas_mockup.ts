
import { generateProductMockup } from '../src/lib/ai/generation.ts';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Load env
dotenv.config({ path: '.env.local' });

async function testMockup() {
    console.log('Testing Canvas Mockup Generation...');

    // 1. Inputs
    // Use a real generated portrait (from previous order)
    const portraitPath = path.join(process.cwd(), 'public', 'generated', 'bc267425-da83-41b0-a6e0-89b1ecdab412', 'primary_swap_0.png');

    // Use the canvas template we found (first one)
    const templatesDir = path.join(process.cwd(), 'public', 'mockup-templates', 'canvas');
    const files = fs.readdirSync(templatesDir).filter(f => /\.(png|jpg|jpeg)$/i.test(f) && !f.includes('Barnaby'));
    const templatePath = path.join(templatesDir, files[0]); // Pick first available template

    // Output
    const outputPath = path.join(process.cwd(), 'public', 'generated', 'test_canvas_mockup_real.png');

    console.log(`Portrait: ${portraitPath}`);
    console.log(`Template: ${templatePath}`);

    // Generate 11x14
    console.log('Generating 11x14...');
    const result11 = await generateProductMockup(portraitPath, 'canvas-11x14', path.join(process.cwd(), 'public', 'generated', 'proof_11x14.png'));
    if (result11) console.log('SUCCESS! 11x14 View at: http://localhost:3000/generated/proof_11x14.png');

    // Generate 16x20
    console.log('Generating 16x20...');
    const result16 = await generateProductMockup(portraitPath, 'canvas-16x20', path.join(process.cwd(), 'public', 'generated', 'proof_16x20.png'));
    if (result16) console.log('SUCCESS! 16x20 View at: http://localhost:3000/generated/proof_16x20.png');
}

testMockup();
