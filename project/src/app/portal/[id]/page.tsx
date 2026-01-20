import { createAdminClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import CustomerGallery from '@/components/CustomerGallery';
import type { Image } from '@/lib/supabase/client';

export const dynamic = 'force-dynamic';

export default async function Page({ params }: { params: { id: string } }) {
    const supabase = createAdminClient();
    const { id: orderId } = params;

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

    // 2. Fetch Images
    const { data: images, error: imgError } = await supabase
        .from('images')
        .select('*')
        .eq('order_id', orderId)
        .or('status.eq.approved,status.eq.pending,is_bonus.eq.true')
        .order('display_order', { ascending: true });

    if (imgError || !images) {
        console.error('Failed to fetch images:', imgError);
        return <div className="p-8 text-center">Failed to load gallery.</div>;
    }

    // 3. Fetch Product Templates (NEW)
    const { data: productTemplates, error: prodError } = await supabase
        .from('product_templates')
        .select('*')
        .eq('is_active', true);

    if (prodError) {
        console.error('Failed to fetch products:', prodError);
    }

    // 4. Split Images
    const baseImages = (images || []).filter((img: Image) => img.type === 'primary' && !img.is_bonus);
    const bonusImages = (images || []).filter((img: Image) => img.is_bonus);
    const upsellImages = (images || []).filter((img: Image) => img.type === 'upsell'); // Distinct upsell images
    const mockupImages = (images || []).filter((img: Image) => img.type === 'mockup');

    return (
        <CustomerGallery
            order={order}
            baseImages={baseImages}
            bonusImages={bonusImages}
            mockupImages={mockupImages}
            upsellImages={upsellImages}
            productTemplates={productTemplates || []} // Pass down new templates
        />
    );
}
