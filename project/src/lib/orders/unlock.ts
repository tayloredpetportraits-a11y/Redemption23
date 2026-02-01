import { createAdminClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';

export async function unlockBonusContent(orderId: string) {
    const supabase = createAdminClient();

    try {
        // 1. Get Bonus Images
        const { data: images, error: fetchError } = await supabase
            .from('images')
            .select('*')
            .eq('order_id', orderId)
            .eq('is_bonus', true);

        if (fetchError) throw fetchError;
        if (!images || images.length === 0) {
            logger.warn('No bonus images found for unlock', { orderId });
            return;
        }

        // 2. Reveal Clean URLs
        for (const img of images) {
            // Check if current URL is watermarked
            // Logic: If we have a storage_path that ends in _watermarked.png,
            // we try to switch to _clean.png

            let newUrl = img.url;
            let newStoragePath = img.storage_path;
            let updated = false;

            // Case A: File name contains '_watermarked'
            if (img.storage_path && img.storage_path.includes('_watermarked')) {
                newStoragePath = img.storage_path.replace('_watermarked', '_clean');
                // We assume the public URL follows the same pattern or we need to getPublicUrl again via supabase
                // Usually Supabase public URL is just bucket_url + path.
                // Let's rely on standard path string manipulation for now to avoid extra API calls
                // or getting the public URL base from the existing URL.
                newUrl = img.url.replace('_watermarked', '_clean');
                updated = true;
            }
            // Case B: Fallback (maybe it wasn't named _watermarked, check generation.ts logic)
            // In generation.ts: storagePath = `generated/${orderId}/${filename}`;
            // filename = `portrait_${theme.id}_${isBonus ? 'bonus' : 'primary'}_${i}_${timestamp}_watermarked.png`;
            // So checks above should pass.

            if (updated) {
                await supabase.from('images').update({
                    url: newUrl,
                    storage_path: newStoragePath,
                    status: 'approved' // Ensure it's approved
                }).eq('id', img.id);
            }
        }

        // 3. Mark Order as Bonus Unlocked
        const { error: updateError } = await supabase
            .from('orders')
            .update({
                bonus_unlocked: true,
                bonus_payment_status: 'paid'
            })
            .eq('id', orderId);

        if (updateError) throw updateError;

        logger.info('Bonus content unlocked successfully', { orderId });
        return true;

    } catch (err) {
        logger.error('Failed to unlock bonus content', { orderId, error: err });
        throw err;
    }
}
