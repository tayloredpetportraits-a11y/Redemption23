
import { NextRequest, NextResponse } from 'next/server';
import { generateProductMockup } from '@/lib/ai/generation';
import fs from 'fs';
import path from 'path';

export const maxDuration = 60; // Allow longer timeout for AI generation

export async function POST(req: NextRequest) {
    try {
        const { imageUrl, productType, orderId } = await req.json();

        if (!imageUrl || !productType || !orderId) {
            return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
        }

        // Sanitize input path to be safe
        // imageUrl is expected to be '/generated/xyz.png'
        const relativePath = imageUrl.startsWith('/') ? imageUrl.slice(1) : imageUrl;
        const absolutePortraitPath = path.join(process.cwd(), 'public', relativePath);

        if (!fs.existsSync(absolutePortraitPath)) {
            return NextResponse.json({ error: 'Source image not found' }, { status: 404 });
        }

        // Generate a unique filename for the preview
        const timestamp = Date.now();
        const filename = `preview_${productType}_${timestamp}.png`;
        const outputDir = path.join(process.cwd(), 'public', 'generated', orderId, 'previews');

        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        const outputPath = path.join(outputDir, filename);
        const publicUrl = `/generated/${orderId}/previews/${filename}`;

        console.log(`Generating Auth Preview: ${productType} for ${imageUrl}`);

        // Call the generation service
        // Note: we pass undefined for customTemplatePath to use defaults for now, 
        // OR we could allow passing it if we want advanced features later.
        const success = await generateProductMockup(absolutePortraitPath, productType, outputPath);

        if (success) {
            return NextResponse.json({ url: publicUrl });
        } else {
            return NextResponse.json({ error: 'Generation failed' }, { status: 500 });
        }

    } catch (error) {
        console.error('Preview Endpoint Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
