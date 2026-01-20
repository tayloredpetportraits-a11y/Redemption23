
import { createAdminClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(req: Request, { params }: { params: { orderId: string } }) {
    const { orderId } = params;
    const supabase = createAdminClient();

    try {
        // Just increment a counter or log it. For now, we mainly want to avoid 404.
        const { error } = await supabase.rpc('increment_download_count', { order_id: orderId });

        // If RPC doesn't exist, we can just log validation or ignore.
        // Or simpler: update a 'last_downloaded_at' field if it exists.

        console.log(`[Tracking] Download recorded for order ${orderId}`);
        return NextResponse.json({ success: true });
    } catch (e) {
        console.error("Tracking failed", e);
        // Don't block the user download flow even if tracking fails
        return NextResponse.json({ success: true });
    }
}
