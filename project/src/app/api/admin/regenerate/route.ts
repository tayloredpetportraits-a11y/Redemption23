import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { generateNanoSwap } from '@/lib/ai/generation'; // Need to export this or move logic
import path from 'path';
import fs from 'fs';

// Helper to re-fetch templates (Copying logic from generation.ts or importing if I refactor. 
// For speed, I will duplicate the "get template by index" logic efficiently here or verify imports).
// Actually generateNanoSwap is NOT exported currently. I need to updating generation.ts to export it.
// Assuming I will do that in next step.

export async function POST(request: Request) {
    try {
        const { imageId, promptOverride } = await request.json();
        const supabase = createAdminClient();

        // 1. Get Image Info
        const { data: img, error } = await supabase
            .from('images')
            .select('*, orders(pet_image_url, pet_breed, pet_details, id)')
            .eq('id', imageId)
            .single();

        if (error || !img) throw new Error("Image not found");

        const order = img.orders;
        if (!order) throw new Error("Order not found");

        // 2. Identify Template
        // Url format: /generated/[orderId]/[type]_swap_[index].png
        // e.g. /generated/uuid/primary_swap_0.png
        const filename = path.basename(img.url); // primary_swap_0.png
        const match = filename.match(/^(primary|upsell)_swap_(\d+)\.png$/);

        if (!match) throw new Error("Could not parse image filename to identify template");

        const type = match[1]; // primary or upsell
        const index = parseInt(match[2]);

        // Resolve Template Path
        const themeDir = type === 'primary' ? 'royalty' : 'valentines'; // Simplified logic matching generation.ts
        const templatesDir = path.join(process.cwd(), 'public', 'templates', themeDir);
        const files = fs.readdirSync(templatesDir).filter(f => /\.(jpg|png|webp)$/i.test(f)).sort();

        if (index >= files.length) throw new Error("Template index out of bounds");

        const templatePath = path.join(templatesDir, files[index]);

        // 3. Resolve Pet Photo
        const petCleanUrl = order.pet_image_url.startsWith('/') ? order.pet_image_url.slice(1) : order.pet_image_url;
        const petPhotoPath = path.join(process.cwd(), 'public', petCleanUrl);

        // 4. Output Path (Overwrite)
        const outputDir = path.join(process.cwd(), 'public', 'generated', order.id);
        const outputPath = path.join(outputDir, filename);

        // 5. Construct Prompt
        let prompt = promptOverride;
        if (!prompt) {
            // Default logic
            prompt = "Image 1 is the Reference Pet. Image 2 is the Scene Template. action: Replace the subject in Image 2 with the dog from Image 1.";
            if (order.pet_breed) prompt += ` The dog is a ${order.pet_breed}.`;
            prompt += " Recreate the scene from Image 2 exactly, but using the dog from Image 1. Maintain the lighting, style, and clothing of Image 2. Identity Lock: Mandatory.";
            if (order.pet_details) prompt += ` Verify features: ${order.pet_details}.`;
        }

        console.log(`[Regen] Regenerating ${imageId} (${filename}) with prompt: ${prompt?.slice(0, 50)}...`);

        // 6. Generate (Imported function)
        // We need to confirm generateNanoSwap is exported.
        // I will assume I fix that next.
        // 6. Generate
        const petBuffer = fs.readFileSync(petPhotoPath);
        const resultBuffer = await generateNanoSwap(templatePath, petBuffer, prompt || "");

        if (!resultBuffer) throw new Error("AI Generation failed (returned null)");

        // Save Output
        fs.writeFileSync(outputPath, resultBuffer);

        // 7. Update DB Metadata (optional, e.g. status)
        // Maybe set status to 'approved' if it was rejected? Or keep 'pending_review'?
        // Let's set to 'pending_review' so admin has to approve again?
        // Actually this IS the admin tools, so if they regen, they see it immediately.

        return NextResponse.json({ success: true });

    } catch (e: unknown) {
        console.error("Regen error:", e);
        return NextResponse.json({ error: (e as Error).message }, { status: 500 });
    }
}

// Stub for the import (I will actually edit generation.ts to export this)
// import { generateNanoSwap } from '@/lib/ai/generation'; 
