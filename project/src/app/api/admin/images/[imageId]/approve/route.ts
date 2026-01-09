
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { generateProductMockup } from '@/lib/ai/generation';
import { generateSocialCaption } from '@/lib/marketing/generator';
import { createSocialPost } from '@/lib/marketing/service';
import fs from 'fs';
import path from 'path';

export const maxDuration = 300; // Allow long timeout for batch generation
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest, { params }: { params: { imageId: string } }) {
    try {
        const { imageId } = params;
        const supabase = createAdminClient();

        // 1. Get Image Details with Order
        const { data: image, error: imgError } = await supabase
            .from('images')
            .select('*, orders(*)')
            .eq('id', imageId)
            .single();

        if (imgError || !image) {
            return NextResponse.json({ error: 'Image not found' }, { status: 404 });
        }

        const order = image.orders;

        // 2. Approve Image
        const { error: updateError } = await supabase
            .from('images')
            .update({ status: 'approved' })
            .eq('id', imageId);

        if (updateError) {
            return NextResponse.json({ error: 'Failed to update status' }, { status: 500 });
        }

        // --- SOCIAL MEDIA AUTOMATION ---
        // Check consent and ensure not already approved/posted (though this route is 'approve')
        if (order && order.social_consent) {
            console.log(`[Social] Generating draft for Order ${order.id}`);
            try {
                // Generate Caption
                const { caption, hashtags } = await generateSocialCaption(
                    order.pet_name || 'Pet',
                    order.pet_breed || '',
                    order.product_type || 'Portrait',
                    order.pet_details || ''
                );

                // Create Draft Post
                await createSocialPost({
                    order_id: order.id,
                    image_id: image.id,
                    caption,
                    hashtags,
                    platform: 'instagram'
                });
                console.log(`[Social] Draft created for ${order.id}`);
            } catch (socialErr) {
                console.error("[Social] Failed to generate draft:", socialErr);
                // Don't block the main flow
            }
        }
        // -------------------------------

        // 3. Auto-Generate Mockups (Canvas, Bear, Tumbler)
        const productsToCheck = ['canvas-11x14', 'bear', 'tumbler'];
        const outputDir = path.join(process.cwd(), 'public', 'generated', image.order_id, 'mockups');

        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        const relativePath = image.url.startsWith('/') ? image.url.slice(1) : image.url;
        const absolutePortraitPath = path.join(process.cwd(), 'public', relativePath);

        if (!fs.existsSync(absolutePortraitPath)) {
            console.error("Original file missing, cannot mock:", absolutePortraitPath);
            // Return success anyway as approval worked
            return NextResponse.json({ success: true, warning: 'Source file missing for mockups' });
        }

        const generatedImages = [];
        console.log(`[Auto-Mockup] Starting batch for ${imageId}`);

        for (const productType of productsToCheck) {
            // Check if already exists? No, overwrite/create new is safer for "Build" action
            const filename = `mockup_${productType}_${imageId}_${Date.now()}.png`;
            const outputPath = path.join(outputDir, filename);
            const publicUrl = `/generated/${image.order_id}/mockups/${filename}`;

            try {
                // Generate
                const success = await generateProductMockup(absolutePortraitPath, productType, outputPath);

                if (success) {
                    generatedImages.push({
                        order_id: image.order_id,
                        url: publicUrl,
                        storage_path: `generated/${image.order_id}/mockups/${filename}`,
                        type: 'upsell', // 'mockup' not allowed by DB constraint. Using 'upsell' (not bonus).
                        is_bonus: false,
                        status: 'approved',
                        template_id: imageId, // Store linked portrait ID here
                        theme_name: productType, // Store product type here (canvas, bear, etc)
                        // metadata: { linked_portrait_id: imageId, product_type: productType }, // REMOVED
                        display_order: 100
                    });
                }
            } catch (err) {
                console.error(`Failed to generate ${productType}:`, err);
            }
        }

        // 4. Save Mockups to DB
        if (generatedImages.length > 0) {
            const { error: insertError } = await supabase.from('images').insert(generatedImages);
            if (insertError) {
                console.error("Failed to insert mockups:", insertError);
                return NextResponse.json({ error: 'Failed to save mockups', details: insertError }, { status: 500 });
            }
            console.log(`[Auto-Mockup] Created ${generatedImages.length} variants`);
        }

        return NextResponse.json({ success: true, mockupsCreated: generatedImages.length });

    } catch (error) {
        console.error('Approve Endpoint Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
