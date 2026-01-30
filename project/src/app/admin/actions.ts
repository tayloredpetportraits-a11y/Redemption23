'use server';

import { createAdminClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { generateImagesForOrder } from '@/lib/ai/generation';
import { uploadFile, getPublicUrl } from '@/lib/supabase/storage';

export async function createManualOrder(formData: FormData) {
    const supabase = createAdminClient();

    const customerName = formData.get('customerName') as string;
    const customerEmail = formData.get('customerEmail') as string;
    const petName = formData.get('petName') as string;
    const petBreed = formData.get('petBreed') as string || null;
    const petDetails = formData.get('petDetails') as string || null;
    const productType = formData.get('productType') as string || 'Digital Only';
    const isPaid = formData.get('isPaid') === 'on';

    const petPhoto = formData.get('petPhoto') as File | null;
    const mockups = formData.getAll('mockups') as File[];

    let petImageUrl = '';

    // 1. Upload Pet Photo (if provided)
    if (petPhoto && petPhoto.size > 0) {
        const uniqueName = `manual-${Date.now()}-${petPhoto.name}`;
        const path = `uploads/pets/${uniqueName}`;
        const buffer = Buffer.from(await petPhoto.arrayBuffer());

        await uploadFile(path, buffer);
        petImageUrl = getPublicUrl(path);
    }

    // 2. Create Order in DB
    const status = (mockups.length > 0) ? (isPaid ? 'ready' : 'fulfilled') : 'pending';
    // If mockups provided, skip generation and go to review/ready. 
    // If paid -> ready (bypass payment). If not paid -> fulfilled (needs payment).
    // Actually, normally:
    // - Paid Webhook -> 'pending' -> AI Gen -> 'pending_review' -> Approved -> 'fulfilled' (waiting for digital download or print)
    // Wait, let's look at the schema or types.
    // status: 'pending' | 'ready' | 'failed' | 'fulfilled' | 'revising' | 'archived' | 'processing_print'
    // 'pending' usually triggers generation.
    // If we have mockups, we are effectively "Approved" or "Review Needed".
    // Let's set to 'pending_review' if we uploaded mockups so we can "Approve" them in the dash? 
    // Or if the user wants to test the PORTAL, they probably want it 'ready' (if paid) or 'fulfilled' (if unpaid but ready for portal?)

    // Let's stick to:
    // No Mockups -> 'pending' (Trigger Gen)
    // Mockups -> 'pending_review' (So we can see them in the "Review" UI and approve them to create the final state)
    // OR if I want to "just throw it in a redemption portal", I might want to bypass review.
    // Let's go with 'pending_review' for mockups so it feels like a real flow, OR 'ready' if we want to be fast.
    // The user said: "just need to throw it in a redemption portal ... and just run through the whole process"
    // So 'pending_review' allows me to hit "Approve" in the dashboard which sends the email etc.
    // BUT, if I mark it as PAID, maybe I want to skip strictly to "ready"?

    // Let's set it to 'pending' initially, insert images, then update status?
    // Actually, if I insert images with status 'approved', then the order status should be 'ready' (if paid) or 'fulfilled' (if awaiting payment? wait).

    // Let's mimic the natural flow:
    // If mockups: status = 'pending_review' (User can then click Review > Approve > Portal)
    // This is safest and tests the "Review" flow too.

    const initialStatus = (mockups.length > 0) ? 'pending_review' : 'pending';

    const { data: order, error } = await supabase
        .from('orders')
        .insert({
            customer_name: customerName,
            customer_email: customerEmail,
            pet_name: petName,
            pet_breed: petBreed,
            pet_details: petDetails,
            product_type: productType,
            pet_image_url: petImageUrl,
            status: initialStatus,
            payment_status: isPaid ? 'paid' : 'unpaid',
            source: 'manual' // Optional if column exists, otherwise ignore
        })
        .select()
        .single();

    if (error) {
        throw new Error(error.message);
    }

    // 3. Handle Mockups (if provided)
    if (mockups.length > 0 && order) {
        const uploadPromises = mockups.map(async (file, idx) => {
            if (file.size === 0) return;
            const uniqueName = `mockup-${order.id}-${idx}-${Date.now()}.jpg`;
            const path = `uploads/mockups/${uniqueName}`;
            const buffer = Buffer.from(await file.arrayBuffer());

            await uploadFile(path, buffer);
            const url = getPublicUrl(path);

            return supabase.from('images').insert({
                order_id: order.id,
                url: url,
                storage_path: path,
                type: 'mockup',
                status: 'pending_review', // Needs approval to show in portal
                is_selected: false,
                is_bonus: false,
                display_order: idx
            });
        });

        await Promise.all(uploadPromises);
    }

    // 4. Trigger AI Generation (if NO mockups and Pet Photo provided)
    if (mockups.length === 0 && petImageUrl) {
        // Run in background (don't await)
        generateImagesForOrder(order.id, petImageUrl, 'royalty', petBreed || 'dog', petDetails || '', false)
            .catch(err => console.error("Manual Gen Error:", err));
    }

    revalidatePath('/admin');
}
