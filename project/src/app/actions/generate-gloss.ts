'use server';

import { generateProductMockup } from '@/lib/ai/generation';
import { createAdminClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { getPublicUrl, uploadFile } from '@/lib/supabase/storage';

export async function generateGlossMockup(
    orderId: string,
    portraitUrl: string,
    productType: string,
    templateId?: string
) {
    console.log(`[Gloss] Triggered for Order: ${orderId}, Product: ${productType}`);

    // This is a "Fire and Forget" strategy for the client, 
    // BUT since server actions await, we should return immediately 
    // and let the generation happen in the background if possible.
    // However, Vercel/Next.js serverless functions might kill the process if we return early.
    // Best practice for long-running jobs is a queue (Inngest/bullMQ).
    // Given we don't have that setup, we will await it but the client UI will handle the "loading" state seamlessly.
    // OR we can rely on the fact that the client-side mockup is ALREADY showing, so the user doesn't feel the wait.
    // The client calls this, and when it resolves, it swaps the image.

    try {
        const supabase = createAdminClient();

        // 0. Check Cache (DB)
        // Find if we already have a gloss mockup for this specific portrait (templateId) and product type
        if (templateId) {
            const { data: existing } = await supabase
                .from('images')
                .select('url')
                .eq('order_id', orderId)
                .eq('template_id', templateId)
                .ilike('theme_name', `%${productType}%`)
                .limit(1)
                .single();

            if (existing) {
                console.log(`[Gloss] Found cached mockup: ${existing.url}`);
                return { success: true, url: existing.url };
            }
        }

        // 1. Generate
        // We use the "Nano Banana Pro" engine (generateProductMockup)
        const mockBuffer = await generateProductMockup(portraitUrl, productType);

        if (!mockBuffer) {
            throw new Error('Failed to generate glossy mockup');
        }

        // 2. Upload
        const timestamp = Date.now();
        const filename = `glossy_${productType}_${orderId}_${timestamp}.png`;
        const storagePath = `generated/${orderId}/mockups/${filename}`;

        await uploadFile(storagePath, mockBuffer);
        const publicUrl = getPublicUrl(storagePath);

        // 3. Save to DB (optional, but good for caching)
        // Check if a gloss mockup already exists for this combo?
        // For now, just insert.
        await supabase.from('images').insert({
            order_id: orderId,
            url: publicUrl,
            storage_path: storagePath,
            type: 'upsell', // Use 'upsell' or maybe a new 'gloss' type? 'upsell' is fine as it shows in the gallery.
            theme_name: `Glossy ${productType}`,
            is_bonus: false,
            status: 'approved',
            template_id: templateId || null,
            display_order: 200 // High number to not mess with others, or maybe replace?
        });

        // 4. Revalidate cache
        revalidatePath(`/customer/gallery/${orderId}`);

        return { success: true, url: publicUrl };

    } catch (error) {
        console.error('[Gloss] Error:', error);
        return { success: false, error: 'Failed to generate glossy mockup' };
    }
}
