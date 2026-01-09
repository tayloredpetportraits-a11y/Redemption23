import { NextRequest, NextResponse } from 'next/server';
// import { createOrder } from '@/lib/api/orders';
import { generateImagesForOrder } from '@/lib/ai/generation';
// import { mockDb } from '@/lib/mock-db';
import { createAdminClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
    try {
        console.log("SEED: Starting...");
        const { theme = 'royalty' } = await request.json();
        console.log("SEED: Theme selected:", theme);

        const randomSuffix = Math.floor(Math.random() * 1000);

        console.log("SEED: Calling Supabase insert...");
        const supabase = createAdminClient();
        const { data: order, error: orderError } = await supabase.from('orders').insert({
            customer_name: `Test User ${randomSuffix}`,
            customer_email: `test${randomSuffix}@example.com`,
            product_type: theme,
            status: 'pending',
            order_number: `SEED-${Date.now()}`
        }).select().single();

        if (orderError) throw orderError;
        const orderId = order.id;
        console.log("SEED: Order created:", orderId);

        console.log("SEED: Triggering generation...");
        await generateImagesForOrder(orderId, 'https://placeholder/dog.jpg', theme);
        console.log("SEED: Generation complete.");

        return NextResponse.json({ success: true, orderId });
    } catch (error) {
        console.error('SEED FAILED:', error);
        return NextResponse.json({ error: 'Internal server error', details: String(error) }, { status: 500 });
    }
}
