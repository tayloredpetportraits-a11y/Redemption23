import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { rateLimiter } from '@/lib/rate-limiter';
import { withCors, handleOptions } from '@/lib/cors';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const OPTIONS = handleOptions;

export const POST = withCors(async (request: NextRequest) => {
  try {
    const ip = request.headers.get('x-forwarded-for') || 'unknown';

    // Rate limit: 10 requests per 10 seconds
    const isAllowed = rateLimiter.check(ip, 10, 10000);

    if (!isAllowed) {
      return NextResponse.json(
        { error: 'Too many verification attempts. Please try again later.' },
        { status: 429 }
      );
    }

    const { orderNumber, email } = await request.json();

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    if (!orderNumber || !email) {
      return NextResponse.json(
        { error: 'Order number and email are required' },
        { status: 400 }
      );
    }

    const { data: order, error } = await supabase
      .from('orders')
      .select('id, customer_email')
      .eq('order_number', orderNumber)
      .maybeSingle();

    if (error || !order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    if (order.customer_email.toLowerCase() !== email.toLowerCase()) {
      return NextResponse.json(
        { error: 'Email does not match order' },
        { status: 403 }
      );
    }

    return NextResponse.json({ orderId: order.id });
  } catch (error) {
    console.error('Customer verification error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});
