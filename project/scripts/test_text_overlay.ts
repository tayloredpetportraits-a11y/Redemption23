
import { applyTextOverlay } from '../src/lib/ai/generation';
import fs from 'fs';
import path from 'path';

async function test() {
    console.log("🧪 Testing Text Overlay...");

    // 1. Create a blank white image (or use test-dog.jpg)
    // Let's use test-dog.jpg as base
    const inputPath = path.join(process.cwd(), 'public', 'test-dog.jpg');
    if (!fs.existsSync(inputPath)) {
        console.error("Test image missing");
        return;
    }
    const inputBuffer = fs.readFileSync(inputPath);

    // 2. Test WITH Name
    console.log("Generating 'Barkley' overlay...");
    const buffer1 = await applyTextOverlay(inputBuffer, "Barkley");
    fs.writeFileSync('public/test_text_barkley.png', buffer1);
    console.log("Saved public/test_text_barkley.png");

    // 3. Test WITHOUT Name (Fallback)
    console.log("Generating Fallback overlay...");
    const buffer2 = await applyTextOverlay(inputBuffer, ""); // Empty string
    fs.writeFileSync('public/test_text_fallback.png', buffer2);
    console.log("Saved public/test_text_fallback.png");

    console.log("✨ Done.");
}

test();
