
import { NextRequest, NextResponse } from 'next/server';
import { generateProductMockup } from '@/lib/ai/generation';
import { createAdminClient } from '@/lib/supabase/server';
import fs from 'fs';
import path from 'path';

export const maxDuration = 300; // Allow long timeout for batch generation

export async function POST(req: NextRequest) {
    try {
        const { orderId, portraitUrl, portraitId } = await req.json();

        if (!orderId || !portraitUrl || !portraitId) {
            return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
        }

        const supabase = createAdminClient();

        // Target Products to Generate
        // Dynamic: Fetch all folders from public/mockup-templates
        const mockupsDir = path.join(process.cwd(), 'public', 'mockup-templates');
        let productsToCheck: string[] = [];

        if (fs.existsSync(mockupsDir)) {
            productsToCheck = fs.readdirSync(mockupsDir).filter(f => {
                return fs.statSync(path.join(mockupsDir, f)).isDirectory();
            });
        }

        // Add defaults if empty or just always include them if they exist?
        // Actually, let's merge legacy ones if we want, or just rely on the new system.
        // For now, let's append legacy ones if they are not covered, to ensure backward compat.
        const legacy = ['canvas-11x14', 'bear', 'tumbler'];
        legacy.forEach(p => {
            if (!productsToCheck.includes(p)) productsToCheck.push(p);
        });

        // Resolve Paths
        const relativePath = portraitUrl.startsWith('/') ? portraitUrl.slice(1) : portraitUrl;
        const absolutePortraitPath = path.join(process.cwd(), 'public', relativePath);

        if (!fs.existsSync(absolutePortraitPath)) {
            return NextResponse.json({ error: 'Source image not found' }, { status: 404 });
        }

        const outputDir = path.join(process.cwd(), 'public', 'generated', orderId, 'mockups');
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        const generatedImages = [];

        for (const productType of productsToCheck) {
            const filename = `mockup_${productType}_${portraitId}_${Date.now()}.png`;
            const outputPath = path.join(outputDir, filename);
            const publicUrl = `/generated/${orderId}/mockups/${filename}`;

            console.log(`[Admin] Generating Mockup: ${productType} for ${portraitId}`);

            // Pass customTemplatePath as undefined to use default
            const success = await generateProductMockup(absolutePortraitPath, productType, outputPath);

            if (success) {
                // Save to DB
                const dbRecord = {
                    order_id: orderId,
                    url: publicUrl,
                    storage_path: `generated/${orderId}/mockups/${filename}`,
                    type: 'mockup',
                    status: 'approved', // Auto-approve admin generated stuff
                    metadata: {
                        linked_portrait_id: portraitId,
                        product_type: productType
                    },
                    display_order: 100 // push to end
                };
                generatedImages.push(dbRecord);
            }
        }

        if (generatedImages.length > 0) {
            const { error } = await supabase.from('images').insert(generatedImages);
            if (error) throw error;
            return NextResponse.json({ success: true, count: generatedImages.length });
        } else {
            return NextResponse.json({ error: 'Generation failed for all items' }, { status: 500 });
        }

    } catch (error) {
        console.error('Batch Mockup Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
