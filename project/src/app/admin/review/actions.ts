'use server';

import { createAdminClient } from '@/lib/supabase/server';
import { regenerateSingleImage } from '@/lib/ai/generation';
import { revalidatePath } from 'next/cache';

import { sendCustomerNotification } from '@/lib/email';

export async function approveImage(id: string) {
    const supabase = createAdminClient();

    // 1. Approve Image
    const { data: img, error } = await supabase
        .from('images')
        .update({ status: 'approved' })
        .eq('id', id)
        .select()
        .single();

    if (error || !img) throw new Error('Failed to approve image');

    revalidatePath('/admin/review');

    // 2. Check if we should trigger "Order Ready" email
    // Logic: If we hit a threshold of approved images (e.g. 1 or 5), or if this is the first one?
    // Let's go with: If we have at least 1 approved image and order is not yet fulfilled.
    // User said "as soon as it's approved". That implies the collection is ready?
    // Let's set the threshold to 5 (the standard pack).

    const { count } = await supabase
        .from('images')
        .select('id', { count: 'exact', head: true })
        .eq('order_id', img.order_id)
        .eq('status', 'approved');

    // If we have 5 approved, mark order complete and send email
    if (count && count >= 5) {
        const { data: order } = await supabase
            .from('orders')
            .select('*')
            .eq('id', img.order_id)
            .single();

        if (order && order.status !== 'fulfilled') {
            await supabase.from('orders').update({ status: 'fulfilled' }).eq('id', order.id);
            await sendCustomerNotification(order.customer_email, order.customer_name, order.id, 'ready');
            console.log(`[Approval] Order ${order.id} fulfilled and email sent.`);
        }
    }
}

export async function rejectImage(id: string) {
    const supabase = createAdminClient();
    await supabase.from('images').update({ status: 'rejected' }).eq('id', id);
    revalidatePath('/admin/review');
}

export async function regenerateImageAction(imageId: string) {
    console.log(`[Action] Regenerating image ${imageId}...`);
    try {
        const result = await regenerateSingleImage(imageId);
        revalidatePath('/admin/review');
        return { success: true, newImage: result };
    } catch (error) {
        console.error("Regeneration failed:", error);
        return { success: false, error: 'Failed to regenerate' };
    }
}
