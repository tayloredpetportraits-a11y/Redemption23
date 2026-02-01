'use server';

import { createAdminClient } from '@/lib/supabase/server'; // Use admin client to bypass RLS if needed, or normal client if user is auth'd (likely not auth'd as customer)
import { revalidatePath } from 'next/cache';

/**
 * Confirms the customer's selection for a physical print order.
 * 
 * @param orderId - The ID of the order
 * @param imageId - The ID of the selected image to print
 */
export async function confirmPrintSelection(orderId: string, imageId: string) {
    if (!orderId || !imageId) {
        throw new Error('Missing orderId or imageId');
    }

    const supabase = createAdminClient();

    // 1. Update the order with the selected image and advance status
    const { error: updateError } = await supabase
        .from('orders')
        .update({
            selected_image_id: imageId,
            status: 'ready' // Advances the workflow
        })
        .eq('id', orderId);

    if (updateError) {
        console.error('Failed to update order selection:', updateError);
        throw new Error('Failed to confirm selection');
    }

    // 2. Mark the selected image as 'is_selected' (optional but good for query ease)
    // First clear any previous selection
    await supabase
        .from('images')
        .update({ is_selected: false })
        .eq('order_id', orderId);

    // Then set the new one
    await supabase
        .from('images')
        .update({ is_selected: true })
        .eq('id', imageId);

    // 3. Revalidate the gallery page to reflect the new state (hides the selector, shows gallery)
    revalidatePath(`/portal/${orderId}`);
}

export async function updateSocialConsent(orderId: string, consent: boolean, handle?: string) {
    const supabase = createAdminClient();

    // Create update payload - only include social_handle if consent is true
    const updates: any = {
        social_consent: consent,
        consent_date: new Date().toISOString()
    };

    // Only update handle if provided (allows clearing it if needed or keeping existing)
    if (handle !== undefined) {
        updates.social_handle = handle;
    }

    const { error } = await supabase
        .from('orders')
        .update(updates)
        .eq('id', orderId);

    if (error) {
        console.error('Failed to update social consent:', error);
        throw new Error('Failed to update consent');
    }

    revalidatePath(`/customer/gallery/${orderId}`);
}
