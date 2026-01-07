import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params;
    const body = await request.json();
    const { socialConsent, socialHandle, marketingConsent } = body;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const updateData: Record<string, any> = {
      social_consent: socialConsent || false,
      social_handle: socialHandle || null,
      marketing_consent: marketingConsent || false,
    };

    if (socialConsent || marketingConsent) {
      updateData.consent_date = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', orderId)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, order: data });
  } catch (error) {
    console.error('Error updating consent:', error);
    return NextResponse.json(
      { error: 'Failed to update consent' },
      { status: 500 }
    );
  }
}
