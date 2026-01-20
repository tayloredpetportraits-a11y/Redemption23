import { createAdminClient } from '@/lib/supabase/server';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { sendCustomerNotification } from '@/lib/email';
import { uploadFile, getPublicUrl } from '@/lib/supabase/storage';

// Client initialized inside functions to ensure env vars are loaded
// const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!);
const MODEL_NAME = "models/nano-banana-pro-preview";

import sharp from 'sharp';

// Helper: Download URL to Temp File (for Gemini Input)
export async function downloadToTemp(url: string): Promise<string> {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Failed to download ${url}`);
    const buffer = Buffer.from(await response.arrayBuffer());
    const tempPath = path.join(os.tmpdir(), `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}.jpg`);
    fs.writeFileSync(tempPath, buffer);
    return tempPath;
}

// Helper: Add Text Overlay (if theme requires it)
export async function applyTextOverlay(imageBuffer: Buffer, text: string): Promise<Buffer> {
    const image = sharp(imageBuffer);
    const metadata = await image.metadata();
    const width = metadata.width || 1024;
    const height = metadata.height || 1024;

    // Create SVG Text
    // Bottom center, white text with black shadow/outline for readability
    const svgText = `
    <svg width="${width}" height="${height}">
        <style>
            .title { fill: white; font-size: ${Math.floor(width * 0.1)}px; font-weight: bold; font-family: sans-serif; text-anchor: middle; text-shadow: 2px 2px 10px black; }
        </style>
        <text x="50%" y="${height * 0.9}" class="title">${text}</text>
    </svg>`;

    return image
        .composite([{ input: Buffer.from(svgText), gravity: 'south' }])
        .toBuffer();
}

// Helper to upscale image for print

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

// Helper to create a Center-Subject Mask
async function createSubjectMask(templateBuffer: Buffer): Promise<Buffer> {
    const image = sharp(templateBuffer);
    const metadata = await image.metadata();
    const width = metadata.width || 1024;
    const height = metadata.height || 1024;

    // Create a simple oval mask in the center
    // Assuming the dog head is roughly in the top-center usually
    // We'll make a mask that is white in the center (keep/edit) and black outside (protected)?
    // WAIT: Inpainting masks usually work as: White = Edit this area, Black = Keep this area.
    // The user said: "Fill the masked area". So Mask = Area to change.

    const mask = await sharp({
        create: {
            width: width,
            height: height,
            channels: 4,
            background: { r: 0, g: 0, b: 0, alpha: 1 } // Black background (Protected)
        }
    })
        .composite([{
            input: Buffer.from(
                `<svg width="${width}" height="${height}">
                <ellipse cx="${width / 2}" cy="${height * 0.4}" rx="${width * 0.25}" ry="${height * 0.3}" fill="white" filter="url(#blur)" />
                <filter id="blur">
                  <feGaussianBlur stdDeviation="20" />
                </filter>
            </svg>`
            ),
            blend: 'over'
        }])
        .png()
        .toBuffer();

    return mask;
}

export async function generateNanoSwap(templatePath: string, petBuffer: Buffer, promptOverride: string): Promise<Buffer | null> {
    try {
        const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!);
        // Using Gemini 1.5 Pro for Inpainting capabilities or Imagen 3 if available. 
        // For now, sticking to the user's preferred "Nano" model name or standard Gemini Pro 
        // as the user's prompt implies a "Nano Banana" workflow.
        // But for Inpainting, we need to send the mask.
        // Using Gemini 3.0 Pro Image (Nano Banana Pro) for Reasoning capabilities
        const model = genAI.getGenerativeModel({ model: "models/nano-banana-pro-preview" });

        const getMimeType = (filePath: string) => {
            const ext = path.extname(filePath).toLowerCase();
            return (ext === '.png' || ext === '.webp') ? `image/${ext.slice(1)}` : 'image/jpeg';
        };

        const templateMime = getMimeType(templatePath);
        const petMime = 'image/jpeg';

        console.log(`[Nano] Starting Inpainting Swap...`);

        // 1. Load Template
        const templateBuffer = fs.readFileSync(templatePath);

        // 2. Generate Auto-Mask (The "Hole" for the new face)
        const maskBuffer = await createSubjectMask(templateBuffer);

        // Debug: Save mask to verify (Optional, can remove later)
        // fs.writeFileSync('debug_latest_mask.png', maskBuffer);

        const templateBase64 = templateBuffer.toString('base64');
        const maskBase64 = maskBuffer.toString('base64');
        const petBase64 = petBuffer.toString('base64');

        // 3. Construct Inpainting Prompt
        // "Fill the masked area with the dog from the Customer Photo. It must wear the robe from the Template..."
        const prompt = promptOverride || `
            Task: Inpainting / Face Swap.
            Input Images:
            1. Template Image (The scene/costume).
            2. Mask Image (White area indicates where to draw the new face).
            3. Customer Pet Photo (The reference subject).
            
            Instructions:
            - Fill the WHITE area of the Mask with the head/face of the dog from the Customer Pet Photo.
            - The new face must seamlessly match the lighting, angle, and style of the Template Image.
            - The dog MUST appear to be wearing the costume from the Template.
            - DO NOT change any pixels in the BLACK area of the mask (Keep background exactly as is).
            - High fidelity, photorealistic, 1.0 denoising strength.
        `;

        const result = await model.generateContent([
            prompt,
            { inlineData: { data: templateBase64, mimeType: templateMime } }, // Template
            { inlineData: { data: maskBase64, mimeType: "image/png" } },      // Mask (Always PNG)
            { inlineData: { data: petBase64, mimeType: petMime } }            // Pet Reference
        ]);

        const parts = result.response.candidates?.[0]?.content?.parts;
        const imagePart = parts?.find(p => p.inlineData);

        if (imagePart && imagePart.inlineData?.data) {
            let buffer = Buffer.from(imagePart.inlineData.data, 'base64');
            try {
                buffer = await upscaleImage(buffer);
            } catch (err) {
                console.error("Upscaling failed, using original:", err);
            }
            return buffer;
        } else {
            console.error("Nano Banana (Inpainting) returned no image part.");
            return null;
        }
    } catch (e) {
        console.error("Nano Swap (Inpainting) failed:", e);
        return null;
    }
}

export async function generateSinglePortrait(
    orderId: string,
    templatePath: string,
    petBuffer: Buffer,
    prompt: string,
    filename: string
): Promise<{ url: string, storagePath: string, buffer: Buffer } | null> {
    const portraitBuffer = await generateNanoSwap(templatePath, petBuffer, prompt);
    if (!portraitBuffer) return null;

    const path = `generated/${orderId}/${filename}`;
    await uploadFile(path, portraitBuffer);
    const url = getPublicUrl(path);

    return { url, storagePath: path, buffer: portraitBuffer };
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
export async function generateImagesForOrder(orderId: string, petPhotoUrl: string, productType: string = 'royalty', petBreed: string = '', petDetails: string = '', autoApprove: boolean = false, petName: string = '') {
    console.log(`Starting Smart Generation for order ${orderId} [Style: ${productType}]`);
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

    // 2. Fetch Theme Config from DB
    // We expect 'productType' to match 'theme.id' (e.g., 'royalty', 'spa-day')
    let primaryTheme: any = null;
    let bonusTheme: any = null;

    try {
        // Fetch Primary
        const { data: pTheme, error: pError } = await supabase
            .from('themes')
            .select('*')
            .eq('id', productType.toLowerCase()) // assuming productType IS the theme ID
            .single();

        if (pTheme) {
            primaryTheme = pTheme;
        } else {
            console.warn(`Theme '${productType}' not found in DB. Falling back to 'royalty' or first available.`);
            // Fallback: Get first theme
            const { data: all } = await supabase.from('themes').select('*').limit(1);
            if (all && all.length > 0) primaryTheme = all[0];
        }

        // Fetch Bonus (Random different theme)
        if (primaryTheme) {
            const { data: bThemes } = await supabase
                .from('themes')
                .select('*')
                .neq('id', primaryTheme.id)
                .limit(10); // fetch a few to pick random

            if (bThemes && bThemes.length > 0) {
                bonusTheme = bThemes[Math.floor(Math.random() * bThemes.length)];
            }
        }
    } catch (dbErr) {
        console.error("DB Theme Fetch Error:", dbErr);
    }

    if (!primaryTheme) {
        throw new Error("Critical: No themes available for generation.");
    }

    console.log(`[Smart Gen] Configured - Primary: ${primaryTheme.name}, Bonus: ${bonusTheme ? bonusTheme.name : 'None'}`);

    const generatedImages: any[] = [];

    // Helper to generate a set of portraits for a theme
    const generateForTheme = async (theme: any, isBonus: boolean, startIndex: number, count: number) => {
        if (!theme || !theme.reference_images || theme.reference_images.length === 0) return;

        // Take first N images from reference_images
        const templates = theme.reference_images.slice(0, count);

        for (let i = 0; i < templates.length; i++) {
            const tmplUrl = templates[i];
            console.log(`[Nano] Generating ${isBonus ? 'Bonus' : 'Primary'} ${i + 1}/${templates.length} (${theme.name})...`);

            let tempTemplatePath = '';
            try {
                // A. Download Template to Temp File (so Nano function works as is)
                tempTemplatePath = await downloadToTemp(tmplUrl);

                // B. Prepare Prompt
                const petLabel = petBreed ? `the ${petBreed}` : 'the dog';
                let prompt = `Reasoning Task: Look at the reference image. Identify ${petLabel}'s unique features (eyes, snout, markings). Look at the template image. Replace the animal in the template with ${petLabel} from the reference. Keep the costume and background exactly as they are.`;
                if (petDetails) prompt += ` Ensure these features are visible: ${petDetails}.`;
                if (theme.trigger_word) prompt += ` Style Trigger: ${theme.trigger_word}.`;

                const filename = `portrait_${theme.id}_${isBonus ? 'bonus' : 'primary'}_${i}_${Date.now()}.png`;

                // C. Call Core AI (Outputs a Buffer)
                const resultBuffer = await generateNanoSwap(tempTemplatePath, petBuffer, prompt);

                if (resultBuffer) {
                    let finalBuffer = resultBuffer;

                    // D. Apply Text Overlay if required
                    if (theme.requires_text && petName) {
                        console.log(`[Post-Process] Applying Text Overlay: "${petName}"`);
                        finalBuffer = await applyTextOverlay(finalBuffer, petName);
                    }

                    // E. Upload
                    const storagePath = `generated/${orderId}/${filename}`;
                    await uploadFile(storagePath, finalBuffer);
                    const publicUrl = getPublicUrl(storagePath);

                    generatedImages.push({
                        order_id: orderId,
                        url: publicUrl,
                        storage_path: storagePath,
                        type: isBonus ? 'upsell' : 'primary',
                        display_order: startIndex + i,
                        theme_name: isBonus ? `Bonus: ${theme.name}` : theme.name,
                        is_bonus: isBonus,
                        status: autoApprove ? 'approved' : 'pending_review',
                        template_id: tmplUrl // Storing the source URL as ID
                    });
                }

            } catch (err) {
                console.error(`Failed to generate for ${theme.name} index ${i}:`, err);
            } finally {
                // F. Cleanup Temp File
                if (tempTemplatePath && fs.existsSync(tempTemplatePath)) {
                    fs.unlinkSync(tempTemplatePath);
                }
            }
        }
    };

    // --- PHASE A: Generate Primary Portraits (5) ---
    await generateForTheme(primaryTheme, false, 0, 5);

    // --- PHASE B: Generate Bonus Portraits (5) ---
    if (bonusTheme) {
        await generateForTheme(bonusTheme, true, 5, 5);
    }

    // --- PHASE C: Conditional Mockups (Canvas Only, etc.) ---
    // If we have at least one valid image, let's use the first primary one for a mockup
    const bestImage = generatedImages.find(img => !img.is_bonus) || generatedImages[0];

    if (bestImage && productType.toLowerCase().includes('canvas')) {
        console.log(`[Nano] Order includes Canvas. Generating Canvas Mockup...`);
        // We need to fetch the best image buffer back to generate mockup? 
        // Or if we had it in variable scope... we lost it in the loop helper.
        // Let's re-fetch effectively or just skip for this iteration to keep it simple as requested.
        // User just said update inputs. Mockups are secondary.
        // BUT, existing logic had mockups.

        // Re-download the "best image" to use as source for mockup
        try {
            const bestImgPath = await downloadToTemp(bestImage.url);
            const bestImgBuffer = fs.readFileSync(bestImgPath);

            const mockBuffer = await generateProductMockup(bestImgBuffer, 'canvas-11x14');
            if (mockBuffer) {
                const filename = `mockup_canvas_${Date.now()}.png`;
                const storagePath = `generated/${orderId}/${filename}`;
                await uploadFile(storagePath, mockBuffer);
                const url = getPublicUrl(storagePath);

                generatedImages.push({
                    order_id: orderId,
                    url: url,
                    storage_path: storagePath,
                    type: 'upsell',
                    display_order: 100,
                    theme_name: 'Canvas Mockup',
                    is_bonus: false,
                    status: autoApprove ? 'approved' : 'pending_review'
                });
            }
            fs.unlinkSync(bestImgPath);
        } catch (e) {
            console.error("Mockup generation error:", e);
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


