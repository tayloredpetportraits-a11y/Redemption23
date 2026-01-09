import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { sendCustomerNotification } from '@/lib/email';

export async function POST(request: Request) {
    try {
        const { orderId } = await request.json();
        const supabase = createAdminClient();

        const { data: order } = await supabase
            .from('orders')
            .select('customer_email, customer_name')
            .eq('id', orderId)
            .single();

        if (!order) throw new Error("Order not found");

        await sendCustomerNotification(order.customer_email, order.customer_name, orderId, 'ready');

        return NextResponse.json({ success: true });
    } catch (e: unknown) {
        return NextResponse.json({ error: (e as Error).message }, { status: 500 });
    }
}
