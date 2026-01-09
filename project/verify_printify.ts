
import { generateProductMockup } from './src/lib/ai/generation';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Load env
dotenv.config({ path: '.env.local' });

async function verifyPrintify() {
    console.log('Verifying Printify Integration...');

    // 1. Inputs
    // Find a valid image
    const petsDir = path.join(process.cwd(), 'public', 'uploads', 'pets');
    let portraitPath = '';

    if (fs.existsSync(petsDir)) {
        const files = fs.readdirSync(petsDir).filter(f => f.endsWith('.png') || f.endsWith('.jpg'));
        if (files.length > 0) {
            portraitPath = path.join(petsDir, files[0]);
        }
    }

    if (!portraitPath) {
        console.error('No test image found in public/uploads/pets');
        return;
    }

    console.log(`Using Portrait: ${portraitPath}`);

    // We mapped 'tumbler' to the Mug ID in printify/config.ts
    const productType = 'tumbler';
    const outputPath = path.join(process.cwd(), 'public', 'generated', 'verify_printify_tumbler.png');

    // 2. Generate
    console.log(`Generating ${productType} mockup to ${outputPath}...`);

    try {
        const buffer = await generateProductMockup(portraitPath, productType, outputPath);

        if (buffer) {
            console.log('SUCCESS! Mockup generated.');
            // Check if it looks like a Printify result? (Hard to do programmatically, but if it succeeded via Printify logic log, we are good)
        } else {
            console.error('FAILED to generate mockup.');
        }
    } catch (e) {
        console.error('CRASHED:', e);
    }
}

verifyPrintify();
