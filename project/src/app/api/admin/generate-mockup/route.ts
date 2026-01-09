
import { NextRequest, NextResponse } from 'next/server';
import { generateProductMockup } from '@/lib/ai/generation';
import path from 'path';
import fs from 'fs';

export async function POST(req: NextRequest) {
    try {
        const { productType, customTemplatePath, testImageUrl } = await req.json();

        // Validate Inputs
        if (!customTemplatePath && !productType) {
            return NextResponse.json({ error: "Missing productType or customTemplatePath" }, { status: 400 });
        }

        // Resolve Portrait
        // For testing, we might use a static path or the one provided
        // testImageUrl might be a http url or a local public path. 
        // Our generation function expects a LOCAL FILESYSTEM path.
        // Let's assume for this Admin Test, we use a known sample if not provided, or resolve the provided one.

        let portraitPath = "";

        // Simple resolution for 'custom_dog.jpg' or similar public assets
        if (testImageUrl && testImageUrl.includes('custom_dog.jpg')) {
            portraitPath = path.join(process.cwd(), 'public', 'uploads', 'pets', 'custom_dog.jpg');
        } else {
            // Fallback to our trusty custom dog
            portraitPath = path.join(process.cwd(), 'public', 'uploads', 'pets', 'custom_dog.jpg');
        }

        if (!fs.existsSync(portraitPath)) {
            return NextResponse.json({ error: "Test portrait not found on server" }, { status: 404 });
        }

        // Output Path
        const timestamp = Date.now();
        const filename = `admin_test_${productType}_${timestamp}.png`;
        const outputDir = path.join(process.cwd(), 'public', 'generated', 'admin_tests');
        if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

        const outputPath = path.join(outputDir, filename);

        // Generate
        // If customTemplatePath is provided (e.g. "public/assets/mockups/my_custom.png"), resolve it relative to CWD
        let absoluteTemplatePath = undefined;
        if (customTemplatePath) {
            // Remove leading slash if present
            const cleanPath = customTemplatePath.startsWith('/') ? customTemplatePath.slice(1) : customTemplatePath;
            absoluteTemplatePath = path.join(process.cwd(), cleanPath);
        }

        const success = await generateProductMockup(portraitPath, productType || 'custom', outputPath, absoluteTemplatePath);

        if (success) {
            const publicUrl = `/generated/admin_tests/${filename}`;
            return NextResponse.json({ success: true, url: publicUrl });
        } else {
            return NextResponse.json({ error: "Generation failed" }, { status: 500 });
        }

    } catch (error) {
        console.error("Admin Gen Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
