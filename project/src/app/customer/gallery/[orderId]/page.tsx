import { createAdminClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import CustomerGallery from '@/components/CustomerGallery';
import type { Image } from '@/lib/supabase/client';

export const dynamic = 'force-dynamic';

export default async function Page({ params }: { params: { orderId: string } }) {
    const supabase = createAdminClient();
    const { orderId } = params;

    // 1. Fetch Order
    const { data: order, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single();

    if (orderError || !order) {
        console.error('Order not found:', orderId);
        notFound();
    }

    // 2. Fetch Images (Approved Only for Customer view)
    const { data: images, error: imgError } = await supabase
        .from('images')
        .select('*')
        .eq('order_id', orderId)
        // Show approved, bonus, AND pending images so customer can see them immediately
        .or('status.eq.approved,status.eq.pending,is_bonus.eq.true')
        .order('display_order', { ascending: true });

    console.log(`[Server Gallery] Order: ${orderId}, Images Found: ${images?.length}`);
    if (images && images.length > 0) {
        console.log(`[Server Gallery] Sample Status: ${images[0].status}, Bonus: ${images[0].is_bonus}`);
    }

    if (imgError || !images) {
        console.error('Failed to fetch images:', imgError);
        return <div className="p-8 text-center">Failed to load gallery. Please contact support.</div>;
    }

    // 3. Split Images
    // Base: Primary images only (exclude bonus and upsell/mockups)
    const baseImages = (images || []).filter((img: Image) => img.type === 'primary' && !img.is_bonus);

    // Bonus: Any image marked is_bonus (usually type=upsell)
    const bonusImages = (images || []).filter((img: Image) => img.is_bonus);

    // Mockups: type=upsell or type=mockup but NOT bonus (Admin generated or Manual mockups)
    const mockupImages = (images || []).filter((img: Image) => (img.type === 'upsell' || img.type === 'mockup') && !img.is_bonus);

    console.log(`[Gallery Debug] Base: ${baseImages.length}, Bonus: ${bonusImages.length}, Mockups: ${mockupImages.length}`);

    return (
        <CustomerGallery
            order={order}
            baseImages={baseImages}
            bonusImages={bonusImages}
            mockupImages={mockupImages}
        />
    );
}
