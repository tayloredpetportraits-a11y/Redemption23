import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { sendCustomerNotification } from '@/lib/email';
import { generateStandardMockups } from '@/lib/ai/generation';
import { generateSocialCaption } from '@/lib/marketing/generator';
import { createSocialPost } from '@/lib/marketing/service';

export const maxDuration = 300; // Allow long timeout for generation
export const dynamic = 'force-dynamic';

export async function GET() {
    const supabase = createAdminClient();

    // 1. Get pending images
    const { data: images, error: imgError } = await supabase
        .from('images')
        .select('*')
        .eq('status', 'pending_review');

    if (imgError) return NextResponse.json({ error: imgError.message }, { status: 500 });

    if (!images || images.length === 0) {
        return NextResponse.json({ orders: [], images: [] });
    }

    // 2. Get unique order IDs
    const orderIds = Array.from(new Set(images.map(img => img.order_id)));

    // 3. Get orders
    const { data: orders, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .in('id', orderIds);

    if (orderError) return NextResponse.json({ error: orderError.message }, { status: 500 });

    return NextResponse.json({ orders, images });
}

export async function POST(req: Request) {
    const { imageId, status } = await req.json();
    const supabase = createAdminClient();

    // 1. Get image to find Order ID and Details
    const { data: image, error: fetchError } = await supabase
        .from('images')
        .select('*, orders!images_order_id_fkey(*)')
        .eq('id', imageId)
        .single();

    if (fetchError || !image) return NextResponse.json({ error: 'Image not found' }, { status: 404 });

    // 2. Update status
    const { error: updateError } = await supabase
        .from('images')
        .update({ status })
        .eq('id', imageId);

    if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

    // --- POST-APPROVAL AUTOMATION (Only if Approved) ---
    if (status === 'approved') {
        try {
            const order = image.orders;

            // A. Fetch Image Buffer (Remote or Local)
            let imageBuffer: Buffer | null = null;
            if (image.url.startsWith('http')) {
                const res = await fetch(image.url);
                if (res.ok) imageBuffer = Buffer.from(await res.arrayBuffer());
            } else {
                // Fallback for legacy local paths (though unlikely with storage migration)
                // But generation.ts handles paths too, we can let it handle it?
                // No, generateStandardMockups needs a buffer.
                // We'll skip if we can't get buffer here easily, or implement local fs read.
                // For now, assume HTTP URL (Supabase Storage) or we skip.
            }

            if (imageBuffer) {
                // B. Social Media
                if (order && order.social_consent) {
                    try {
                        const { caption, hashtags } = await generateSocialCaption(
                            order.pet_name || 'Pet',
                            order.pet_breed || '',
                            order.product_type || 'Portrait',
                            order.pet_details || ''
                        );
                        await createSocialPost({
                            order_id: order.id,
                            image_id: image.id,
                            caption,
                            hashtags,
                            platform: 'instagram'
                        });
                        console.log(`[Social] Draft created for ${order.id}`);
                    } catch (err) {
                        console.error("[Social] Failed:", err);
                    }
                }

                // C. Mockups
                // Only generate if this is a primary portrait? 
                // Assuming 'upsell' images (mockups) shouldn't generate MORE mockups.
                // Image type isn't always reliable but let's check if it's NOT an upsell/mockup type if possible.
                // The DB constraint restricts 'mockup' type, so we use 'upsell' or 'primary'.
                // We don't want recursion.
                if (image.type !== 'upsell') {
                    await generateStandardMockups(imageBuffer, image.order_id, image.id, order.product_type);
                }
            }

        } catch (automationError) {
            console.error("Automation failed:", automationError);
            // Don't fail the request, just log it.
        }
    }
    // ---------------------------------------------------

    // 3. Check for completion (Are there any OTHER pending images for this order?)
    const { data: pendingImages } = await supabase
        .from('images')
        .select('id')
        .eq('order_id', image.order_id)
        .eq('status', 'pending_review');

    // If result is empty array, we are done.
    const isComplete = !pendingImages || pendingImages.length === 0;

    if (isComplete) {
        // Order is complete!
        await supabase
            .from('orders')
            .update({ status: 'ready' }) // Changed from 'ready' to 'fulfilled' to match status meaning
            .eq('id', image.order_id);

        // Fetch order details for email
        const { data: order } = await supabase.from('orders').select('customer_email, customer_name, id').eq('id', image.order_id).single();

        if (order) {
            // Send Email
            await sendCustomerNotification(order.customer_email, order.customer_name, order.id);

            console.log(`[EMAIL TRIGGER] Sent redemption link to ${order.customer_email}`);
        }
    }

    return NextResponse.json({ success: true, orderCompleted: isComplete });
}
