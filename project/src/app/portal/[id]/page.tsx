import { createAdminClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import CustomerGallery from '@/components/CustomerGallery';
import type { Image } from '@/lib/supabase/client';

export const dynamic = 'force-dynamic';

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
    const supabase = createAdminClient();
    const { id: orderId } = await params;

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

    // 2. Fetch Images (SECURITY: Only show approved images)
    const { data: images, error: imgError } = await supabase
        .from('images')
        .select('*')
        .eq('order_id', orderId)
        .eq('status', 'approved') // CRITICAL: Customers only see admin-approved images
        .order('display_order', { ascending: true });

    if (imgError || !images) {
        console.error('Failed to fetch images:', imgError);
        return <div className="p-8 text-center">Failed to load gallery.</div>;
    }


    // 4. Split Images
    const baseImages = (images || []).filter((img: Image) => img.type === 'primary' && !img.is_bonus);
    const bonusImages = (images || []).filter((img: Image) => img.is_bonus);
    const upsellImages = (images || []).filter((img: Image) => img.type === 'upsell'); // Distinct upsell images
    const mockupImages = (images || []).filter((img: Image) => img.type === 'mockup');

    return (
        <div className="min-h-screen bg-white">
            {/* Branding Header */}
            <header className="w-full py-8 flex flex-col items-center justify-center border-b border-zinc-100 bg-white">
                <div className="relative w-24 h-24 mb-4 rounded-full overflow-hidden shadow-lg border-4 border-white ring-1 ring-zinc-100">
                    <img
                        src="/logo.gif"
                        alt="Taylored Pet Portraits"
                        className="w-full h-full object-cover"
                    />
                </div>
                <h1 className="text-3xl font-bold text-zinc-900 font-playfair tracking-tight">Taylored Pet Portraits</h1>
                <p className="text-zinc-500 font-medium tracking-wide text-sm mt-1 uppercase text-opacity-80">Your Pet, Reimagined.</p>
            </header>

            <CustomerGallery
                order={order}
                baseImages={baseImages}
                bonusImages={bonusImages}
                mockupImages={mockupImages}
                upsellImages={upsellImages}
                mobileImages={(images || []).filter((img: Image) => img.type === 'mobile_wallpaper')}
            />
        </div>
    );
}
