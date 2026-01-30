
import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { unlockBonusContent } from '@/lib/orders/unlock';

export async function POST(request: Request, { params }: { params: { orderId: string } }) {
  const { orderId } = params;

  try {
    // Call the shared unlock logic
    await unlockBonusContent(orderId);
    return NextResponse.json({ success: true });
  } catch (e: unknown) {
    console.error('Unlock API Error:', e);
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
