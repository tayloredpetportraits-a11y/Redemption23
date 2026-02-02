import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(
    request: NextRequest,
    { params }: { params: { orderId: string } }
) {
    try {
        const { social_consent, social_handle } = await request.json();
        const supabase = await createClient();

        const { data, error } = await supabase
            .from('orders')
            .update({
                social_consent,
                social_handle,
                consent_date: social_consent ? new Date().toISOString() : null,
            })
            .eq('id', params.orderId)
            .select()
            .single();

        if (error) {
            console.error('[Social Consent API] Error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, data });
    } catch (error: any) {
        console.error('[Social Consent API] Exception:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
