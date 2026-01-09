
import { generateProductMockup } from '../src/lib/ai/generation';
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

    const result = await generateProductMockup(portraitPath, 'custom', outputPath, templatePath);

    if (result) {
        console.log('SUCCESS! Mockup generated.');
        console.log(`View at: http://localhost:3000/generated/test_canvas_mockup_real.png`);
    } else {
        console.error('FAILED to generate mockup.');
    }
}

testMockup();
