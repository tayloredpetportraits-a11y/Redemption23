import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await context.params;
    const { selectedImageId, printProduct, notes } = await request.json();

    if (!selectedImageId || !printProduct) {
      return NextResponse.json(
        { error: 'Selected image and print product are required' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('orders')
      .update({
        selected_image_id: selectedImageId,
        selected_print_product: printProduct,
        customer_notes: notes || null,
      })
      .eq('id', orderId);

    if (error) {
      return NextResponse.json(
        { error: 'Failed to update order' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Confirm selection error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
