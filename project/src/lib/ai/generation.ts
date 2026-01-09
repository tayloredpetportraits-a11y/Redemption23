import { createAdminClient } from '@/lib/supabase/server';
import fs from 'fs';
import path from 'path';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { sendCustomerNotification } from '@/lib/email';
import { uploadFile, getPublicUrl } from '@/lib/supabase/storage';

// Client initialized inside functions to ensure env vars are loaded
// const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!);
const MODEL_NAME = "models/nano-banana-pro-preview";

import sharp from 'sharp';

// Helper to upscale image for print
async function upscaleImage(inputBuffer: Buffer): Promise<Buffer> {
    const image = sharp(inputBuffer);
    const metadata = await image.metadata();

    // Only upscale if smaller than target 3000px
    if (metadata.width && metadata.width < 3000) {
        return image
            .resize(3000, null, {
                kernel: 'lanczos3',
                fit: 'inside',
                withoutEnlargement: false
            })
            .toBuffer();
    }
    return inputBuffer;
}

// Helper to add heavy watermark
export async function applyHeavyWatermark(inputBuffer: Buffer): Promise<Buffer> {
    const watermarkPath = path.join(process.cwd(), 'public', 'assets', 'watermark.png');

    // Fallback if logo missing
    if (!fs.existsSync(watermarkPath)) {
        console.warn("Watermark logo not found, falling back to original.");
        return inputBuffer;
    }

    const image = sharp(inputBuffer);
    const metadata = await image.metadata();
    const width = metadata.width || 1024;
    const height = metadata.height || 1024;

    // Load watermark
    // We want it large, say 80% of width
    const targetWidth = Math.round(width * 0.8);
    const targetHeight = Math.round(height * 0.8);

    // 1. Resize watermark first to fit
    // Use fit: 'inside' to ensure it fits within 80% box while maintaining aspect ratio
    const resizedWatermarkBuffer = await sharp(watermarkPath)
        .resize(targetWidth, targetHeight, { fit: 'inside' })
        .png()
        .toBuffer();

    const resizedMeta = await sharp(resizedWatermarkBuffer).metadata();
    const rw = resizedMeta.width || targetWidth;
    const rh = resizedMeta.height || targetHeight;

    // 2. Create semi-transparent black layer of same size
    // We want to use the watermark as a mask for this black layer.
    // If we use 'dest-in' on the black layer, with watermark as input:
    // Result = Black Layer (where Watermark is opaque).
    // This preserves the shape of the watermark but makes it 50% black.

    const semiTransparentWatermark = await sharp({
        create: {
            width: rw,
            height: rh,
            channels: 4,
            background: { r: 0, g: 0, b: 0, alpha: 0.5 }
        }
    })
        .composite([{
            input: resizedWatermarkBuffer,
            blend: 'dest-in'
        }])
        .png()
        .toBuffer();

    return image
        .composite([{
            input: semiTransparentWatermark,
            gravity: 'center',
            blend: 'over'
        }])
        .png()
        .toBuffer();
}

// Helper to get templates
function getTemplatesForTheme(themeId: string, limit: number = 5): string[] {
    // Normalize themeId
    const mappings: Record<string, string> = {
        'royalty': 'royalty',
        'spaday': 'spaday',
        'minimalist': 'minimalist',
        'valentines': 'valentines',
        'bonus': 'valentines' // Default bonus
    };

    // Simple logic to find folder
    let dirName = mappings[themeId.toLowerCase()] || 'royalty';
    // Fallback logic
    if (themeId.includes('bonus')) dirName = 'valentines';

    const templatesDir = path.join(process.cwd(), 'public', 'templates', dirName);

    if (!fs.existsSync(templatesDir)) {
        console.warn(`Theme directory not found: ${dirName}`);
        // Fallback to royalty if missing
        return themeId !== 'royalty' ? getTemplatesForTheme('royalty', limit) : [];
    }

    try {
        const files = fs.readdirSync(templatesDir);
        // Sort: We want consistent order.
        files.sort();
        const images = files.filter(file => /\.(jpg|jpeg|png|webp)$/i.test(file)).slice(0, limit);
        return images.map(file => path.join(templatesDir, file));
    } catch (error) {
        console.error(`Error reading theme directory ${dirName}:`, error);
        return [];
    }
}

function getAllAvailableThemes(): string[] {
    return ['royalty', 'spaday', 'minimalist', 'valentines'];
}

function getBonusTemplates(excludeTheme: string, count: number): { path: string, theme: string }[] {
    const allThemes = getAllAvailableThemes();
    // Filter out the current theme (fuzzy match)
    const candidates = allThemes.filter(t => !excludeTheme.toLowerCase().includes(t));

    if (candidates.length === 0) return [];

    // Pick EXACTLY ONE random theme from the candidates
    const randomThemeIndex = Math.floor(Math.random() * candidates.length);
    const selectedBonusTheme = candidates[randomThemeIndex];

    console.log(`[Nano] Selected Bonus Theme: ${selectedBonusTheme}`);

    // Get templates for that specific bonus theme
    const tmpls = getTemplatesForTheme(selectedBonusTheme, count);

    return tmpls.map(t => ({ path: t, theme: selectedBonusTheme }));
}

export async function generateNanoSwap(templatePath: string, petBuffer: Buffer, promptOverride: string): Promise<Buffer | null> {
    try {
        const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!);
        const model = genAI.getGenerativeModel({ model: MODEL_NAME });

        const getMimeType = (filePath: string) => {
            const ext = path.extname(filePath).toLowerCase();
            if (ext === '.png') return 'image/png';
            if (ext === '.webp') return 'image/webp';
            if (ext === '.avif') return 'image/avif';
            return 'image/jpeg';
        };

        const templateMime = getMimeType(templatePath);
        // Assume petBuffer is JPEG or PNG. Google AI handles standard image buffers well usually, 
        // but explicit mime type is good. We'll default to jpeg if unknown for buffer.
        const petMime = 'image/jpeg';

        console.log(`[Nano] Swapping: Template (${templateMime}) + Pet Buffer`);

        const templateBuf = fs.readFileSync(templatePath).toString('base64');
        const petBase64 = petBuffer.toString('base64');

        const prompt = promptOverride || "Replace the main subject (animal) in the first image with the customer's pet in the second image. Maintain the exact style, clothing, and composition of the first image. High quality.";

        const result = await model.generateContent([
            prompt,
            { inlineData: { data: petBase64, mimeType: petMime } },      // Image 1: Source Pet
            { inlineData: { data: templateBuf, mimeType: templateMime } } // Image 2: Template
        ]);

        const parts = result.response.candidates?.[0]?.content?.parts;
        const imagePart = parts?.find(p => p.inlineData);

        if (imagePart && imagePart.inlineData?.data) {
            let buffer = Buffer.from(imagePart.inlineData.data, 'base64');

            // Upscale for Print Quality
            try {
                buffer = await upscaleImage(buffer);
            } catch (err) {
                console.error("Upscaling failed, using original:", err);
            }

            return buffer;
        } else {
            console.error("Nano Banana returned no image part.");
            return null;
        }
    } catch (e) {
        console.error("Nano Swap failed:", e);
        return null;
    }
}

export async function generateMockupWithCustomBlank(templatePath: string, portraitPath: string, outputPath: string) {
    return generateProductMockup(portraitPath, 'custom', outputPath, templatePath);
}


export async function generateProductMockup(portraitSource: Buffer | string, productType: string, outputPath?: string, customTemplatePath?: string): Promise<Buffer | null> {
    try {
        // Resolve Input to Buffer
        let portraitBuffer: Buffer;
        if (typeof portraitSource === 'string') {
            if (fs.existsSync(portraitSource)) {
                portraitBuffer = fs.readFileSync(portraitSource);
            } else if (portraitSource.startsWith('http')) {
                console.log(`[Mockup] Fetching remote portrait: ${portraitSource}`);
                const res = await fetch(portraitSource);
                if (res.ok) {
                    portraitBuffer = Buffer.from(await res.arrayBuffer());
                } else {
                    console.error(`Failed to download remote portrait: ${portraitSource}`);
                    return null;
                }
            } else {
                console.error(`Portrait file not found: ${portraitSource}`);
                return null;
            }
        } else {
            portraitBuffer = portraitSource;
        }

        console.log(`[Mockup] Generating for ${productType}...`);

        let resultBuffer: Buffer | null = null;
        let templateBuf: Buffer | null = null;
        let templateMime = 'image/jpeg';


        // 1. Get Product Base Template
        // Logic update: Support remote URL in customTemplatePath
        if (customTemplatePath) {
            if (customTemplatePath.startsWith('http')) {
                console.log(`[Mockup] Fetching remote template: ${customTemplatePath}`);
                const res = await fetch(customTemplatePath);
                if (res.ok) {
                    templateBuf = Buffer.from(await res.arrayBuffer());
                    if (customTemplatePath.toLowerCase().endsWith('.png')) templateMime = 'image/png';
                    if (customTemplatePath.toLowerCase().endsWith('.webp')) templateMime = 'image/webp';
                } else {
                    console.error('Failed to download remote template');
                    return null;
                }
            } else if (fs.existsSync(customTemplatePath)) {
                templateBuf = fs.readFileSync(customTemplatePath);
                const ext = path.extname(customTemplatePath).toLowerCase();
                if (ext === '.png') templateMime = 'image/png';
                if (ext === '.webp') templateMime = 'image/webp';
            }
        }

        // Fallback or Standard Logic if no custom template provided OR if we are doing standard Printify/Local
        if (!templateBuf) {
            // OPTION A: Try Printify First (Only if NOT custom)
            // ... [Printify logic omitted for brevity as we are focusing on internal templates now, but keeping structure]
            // For now, let's assume we proceed to Nano Banana Local/Fallback if Printify wasn't used.

            // Check for dynamic Mockup Themes first in local file system (Legacy)
            const safeId = productType.toLowerCase().replace(/[^a-z0-9]/g, '');
            const themeDir = path.join(process.cwd(), 'public', 'mockup-templates', safeId);
            let legacyPath = '';

            if (fs.existsSync(themeDir)) {
                const files = fs.readdirSync(themeDir).filter(f => /\.(jpg|png|jpeg|webp)$/i.test(f));
                if (files.length > 0) {
                    legacyPath = path.join(themeDir, files[0]);
                }
            }

            if (!legacyPath) {
                let mockFilename = 'canvas_mockup.png';
                if (productType.includes('bear')) mockFilename = 'bear_base.png';
                if (productType.includes('tumbler')) mockFilename = 'tumbler_base.png';
                if (productType.includes('mug')) mockFilename = 'mug_base.png';

                legacyPath = path.join(process.cwd(), 'public', 'assets', 'mockups', mockFilename);
            }

            if (fs.existsSync(legacyPath)) {
                templateBuf = fs.readFileSync(legacyPath);
                const ext = path.extname(legacyPath).toLowerCase();
                if (ext === '.png') templateMime = 'image/png';
            }
        }

        if (!templateBuf) {
            console.error(`Mockup template not found for ${productType}`);
            return null;
        }

        // OPTION B: Nano Banana Composite
        const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!);
        const model = genAI.getGenerativeModel({ model: MODEL_NAME });

        const portraitMime = 'image/png';
        const templateBase64 = templateBuf.toString('base64');
        const portraitBase64 = portraitBuffer.toString('base64');

        // Optimized Prompt for Realistic Mockups
        const prompt = `Task: Professional Product Mockup Generation.
        Input 1: Designed Artwork (Portrait).
        Input 2: Product Mockup Template (Blank Product).
        
        Action: Realistically apply the Artwork from Input 1 onto the blank product surface in Input 2.
        
        Guidelines:
        1. Perspective & Wrapping: The artwork MUST follow the curvature and perspective of the product.
           - Canvas: Wrap naturally around the visible edges.
           - Apparel/Fabric: Follow the folds, wrinkles, and displacement of the fabric.
           - Cylinders (Mugs/Tumblers): Curve perfectly around the surface.
        2. Lighting & Shadows: Multiply the shadows and highlights from the Template onto the Artwork. The artwork should not look "floating" or "flat".
        3. Texture: Preserve the grain/texture of the product surface (e.g., canvas weave, cotton fabric).
        4. Integrity: Do NOT change the background or surrounding props of Input 2. Do NOT add new objects. Do NOT distort the subject of the Artwork.
        
        Output: A photorealistic final composite image.`;

        const result = await model.generateContent([
            prompt,
            { inlineData: { data: portraitBase64, mimeType: portraitMime } },      // Image 1: The Portrait
            { inlineData: { data: templateBase64, mimeType: templateMime } }       // Image 2: The Mockup Base
        ]);

        const parts = result.response.candidates?.[0]?.content?.parts;
        const imagePart = parts?.find(p => p.inlineData);

        if (imagePart && imagePart.inlineData?.data) {
            resultBuffer = Buffer.from(imagePart.inlineData.data, 'base64');
        } else {
            console.error("Nano Banana returned no image part for mockup.");
            resultBuffer = null;
        }

        // Finalize: Write to Disk if requested
        if (resultBuffer && outputPath) {
            const dir = path.dirname(outputPath);
            if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
            fs.writeFileSync(outputPath, resultBuffer);
            console.log(`[Mockup] Saved to ${outputPath}`);
        }

        return resultBuffer;

    } catch (e) {
        console.error("Nano Mockup Generation failed:", e);
        return null;
    }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function generateImagesForOrder(orderId: string, petPhotoUrl: string, productType: string = 'royalty', petBreed: string = '', petDetails: string = '', autoApprove: boolean = false) {
    console.log(`Starting Smart Generation for order ${orderId} [Product: ${productType}]`);
    const supabase = createAdminClient();

    // 1. Resolve Pet Photo
    let petBuffer: Buffer;
    const localPublicPath = path.join(process.cwd(), 'public', petPhotoUrl);
    try {
        if (fs.existsSync(localPublicPath)) {
            petBuffer = fs.readFileSync(localPublicPath);
        } else if (fs.existsSync(petPhotoUrl)) {
            petBuffer = fs.readFileSync(petPhotoUrl);
        } else {
            const res = await fetch(petPhotoUrl);
            if (!res.ok) throw new Error(`Failed to fetch ${petPhotoUrl}`);
            petBuffer = Buffer.from(await res.arrayBuffer());
        }
    } catch (e) {
        console.error("Failed to resolve pet photo:", e);
        throw e;
    }

    // 2. Fetch Mockup Templates from DB
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let primaryTmpl: any = null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let upsellTmpls: any[] = [];

    try {
        const { data: templates } = await supabase.from('mockup_templates').select('*').eq('is_active', true);

        if (templates && templates.length > 0) {
            // Find Match
            const targetKeywords = productType.toLowerCase().split(/[\s,-]+/);

            // Score templates
            const scored = templates.map(t => {
                let score = 0;
                if (t.keywords) {
                    t.keywords.forEach((k: string) => {
                        if (targetKeywords.some(tk => tk.includes(k.toLowerCase()) || k.toLowerCase().includes(tk))) {
                            score += 1;
                        }
                    });
                }
                return { ...t, score };
            });

            scored.sort((a, b) => b.score - a.score);

            if (scored[0].score > 0) {
                primaryTmpl = scored[0];
                upsellTmpls = scored.slice(1, 3); // next 2
            } else {
                // No clear match, random
                primaryTmpl = templates[0];
                upsellTmpls = templates.slice(1, 3);
            }
            console.log(`[Smart Gen] Matched Primary: ${primaryTmpl.name}, Upsells: ${upsellTmpls.length}`);
        }
    } catch (err) {
        console.error("Error fetching templates:", err);
    }

    // 3. Generate Base Portrait (The Art)
    // Requirement: 5 Themed Portraits + 5 Bonus Portraits
    const portraitTemplates = getTemplatesForTheme(productType, 5);
    const bonusTemplates = getBonusTemplates(productType, 5);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const generatedImages: any[] = [];

    // Helper to upload
    const uploadGenerated = async (buffer: Buffer, filename: string, isSecret = false) => {
        const path = `generated/${orderId}/${filename}`;
        await uploadFile(path, buffer);
        if (isSecret) return path; // Return path for secret
        return getPublicUrl(path);
    };

    // --- PHASE A: Generate Primary Portraits (5) ---
    let bestPortraitBuffer: Buffer | null = null;
    // We need ID if possible, but we don't have IDs yet until insert. 
    // We'll trust the buffer for immediate mockups.

    for (let i = 0; i < portraitTemplates.length; i++) {
        console.log(`[Nano] Generating Primary Portrait ${i + 1}/${portraitTemplates.length}...`);
        const tmpl = portraitTemplates[i];

        // Portrait Prompt
        let prompt = "Image 1 is the Reference Pet. Image 2 is the Scene Template. action: Replace the subject in Image 2 with the dog from Image 1.";
        if (petBreed) prompt += ` The dog is a ${petBreed}.`;
        prompt += " Recreate the scene from Image 2 exactly, but using the dog from Image 1. Identity Lock: Mandatory.";
        if (petDetails) prompt += ` Verify features: ${petDetails}.`;

        const portraitBuffer = await generateNanoSwap(tmpl, petBuffer, prompt);

        if (portraitBuffer) {
            if (!bestPortraitBuffer) bestPortraitBuffer = portraitBuffer; // Save first as 'best' for now

            // Upload Portrait
            const filename = `portrait_primary_${i}.png`;
            const url = await uploadGenerated(portraitBuffer, filename);

            generatedImages.push({
                order_id: orderId,
                url: url,
                storage_path: `generated/${orderId}/${filename}`,
                type: 'primary',
                display_order: i,
                theme_name: 'Portrait Option',
                is_bonus: false,
                status: autoApprove ? 'approved' : 'pending'
            });
        }
    }

    // --- PHASE B: Generate Bonus Portraits (5) ---
    for (let i = 0; i < bonusTemplates.length; i++) {
        console.log(`[Nano] Generating Bonus Portrait ${i + 1}/${bonusTemplates.length} (${bonusTemplates[i].theme})...`);
        const tmpl = bonusTemplates[i].path;

        // Portrait Prompt (Same logic)
        let prompt = "Image 1 is the Reference Pet. Image 2 is the Scene Template. action: Replace the subject in Image 2 with the dog from Image 1.";
        if (petBreed) prompt += ` The dog is a ${petBreed}.`;
        prompt += " Recreate the scene from Image 2 exactly, but using the dog from Image 1. Identity Lock: Mandatory.";

        const portraitBuffer = await generateNanoSwap(tmpl, petBuffer, prompt);

        if (portraitBuffer) {
            const filename = `portrait_bonus_${i}.png`;
            const url = await uploadGenerated(portraitBuffer, filename);

            generatedImages.push({
                order_id: orderId,
                url: url,
                storage_path: `generated/${orderId}/${filename}`,
                type: 'primary',
                display_order: 10 + i,
                theme_name: `Bonus: ${bonusTemplates[i].theme}`, // Label with theme
                is_bonus: true,
                status: autoApprove ? 'approved' : 'pending'
            });
        }
    }

    // --- PHASE C: Conditional Mockups (Canvas Only) ---
    // User Requirement: "And then if I pick canvas on the order, it needs to generate the canvas mockups only."
    if (bestPortraitBuffer && productType.toLowerCase().includes('canvas')) {
        console.log(`[Nano] Order includes Canvas. Generating Canvas Mockup...`);

        // We can try to find a specific Canvas template in DB or use Standard.
        // Let's rely on standard logic but targeted.
        // Try `canvas-11x14` standard.
        const mockBuffer = await generateProductMockup(bestPortraitBuffer, 'canvas-11x14');

        if (mockBuffer) {
            const filename = `mockup_canvas_${Date.now()}.png`;
            const url = await uploadGenerated(mockBuffer, filename);

            generatedImages.push({
                order_id: orderId,
                url: url,
                storage_path: `generated/${orderId}/${filename}`,
                type: 'upsell', // It is a product visualization
                display_order: 100,
                theme_name: 'Canvas Mockup',
                is_bonus: false, // It's part of the order
                status: autoApprove ? 'approved' : 'pending'
            });
        }
    }

    // 4. Save to DB
    if (generatedImages.length > 0) {
        const { error } = await supabase.from('images').insert(generatedImages);
        if (error) {
            console.error('Failed to insert images:', error);
            throw error;
        }

        if (autoApprove) {
            await supabase.from('orders').update({ status: 'fulfilled' }).eq('id', orderId);

            // Fetch email/name for notification
            const { data: orderData } = await supabase.from('orders').select('customer_email, customer_name').eq('id', orderId).single();
            if (orderData) {
                await sendCustomerNotification(orderData.customer_email, orderData.customer_name, orderId, 'ready');
            }
        }
        console.log(`Saved ${generatedImages.length} images.`);
    } else {
        console.error("No images generated.");
    }
}

export async function generateStandardMockups(portraitBuffer: Buffer, orderId: string, portraitImageId: string, productType: string = '') {
    // Logic update: Only generate mockups relevant to current product type
    // If user orders 'Royalty Canvas', we want Canvas mockup.
    // If just 'Royalty' (Digital), maybe none? Or maybe Canvas as an upsell?
    // User complaint: "generated a bear, a tumbler, and it's all wrong".
    // So we should be conservative.

    const productsToCheck: string[] = [];

    if (productType.toLowerCase().includes('canvas')) {
        productsToCheck.push('canvas-11x14');
    }
    // Only add others if explicitly requested in productType
    if (productType.toLowerCase().includes('mug')) {
        productsToCheck.push('mug');
    }
    if (productType.toLowerCase().includes('tumbler')) {
        productsToCheck.push('tumbler');
    }

    if (productsToCheck.length === 0) {
        console.log(`[Auto-Mockup] No physical products detected in type '${productType}'. Skipping mockups.`);
        return 0;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const generatedImages: any[] = [];
    const supabase = createAdminClient();

    console.log(`[Auto-Mockup] Starting batch for ${portraitImageId} [${productsToCheck.join(', ')}]`);

    for (const prod of productsToCheck) {
        const filename = `mockup_${prod}_${portraitImageId}_${Date.now()}.png`;
        const storagePath = `generated/${orderId}/mockups/${filename}`;

        try {
            // Generate
            const mockBuffer = await generateProductMockup(portraitBuffer, prod);

            if (mockBuffer) {
                // Upload
                await uploadFile(storagePath, mockBuffer);
                const publicUrl = getPublicUrl(storagePath);

                generatedImages.push({
                    order_id: orderId,
                    url: publicUrl,
                    storage_path: storagePath,
                    type: 'upsell',
                    is_bonus: false,
                    status: 'approved',
                    template_id: portraitImageId,
                    theme_name: prod.charAt(0).toUpperCase() + prod.slice(1),
                    display_order: 100
                });
            }
        } catch (err) {
            console.error(`Failed to generate ${prod}:`, err);
        }
    }

    // Save to DB
    if (generatedImages.length > 0) {
        const { error: insertError } = await supabase.from('images').insert(generatedImages);
        if (insertError) {
            console.error("Failed to insert mockups:", insertError);
            throw insertError;
        }
        console.log(`[Auto-Mockup] Created ${generatedImages.length} variants`);
    }

    return generatedImages.length;
}


