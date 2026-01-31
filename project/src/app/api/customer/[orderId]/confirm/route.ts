import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { PrintifyService } from '@/lib/printify/service';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params;

    // Log intent
    console.log(`[ConfirmAPI] Confiming order ${orderId} ...`);

    const body = await request.json();
    console.log('[ConfirmAPI] Body:', body);
    console.log('[ConfirmAPI] Social Data:', {
      consent: body.socialConsent,
      handle: body.socialHandle
    });
    const { selectedImageId, printProduct, notes, socialConsent, socialHandle } = body;

    const supabase = createAdminClient();

    if (!selectedImageId || !printProduct) {
      return NextResponse.json(
        { error: 'Selected image and print product are required' },
        { status: 400 }
      );
    }

    // 1. Update Order Selection
    const { error } = await supabase
      .from('orders')
      .update({
        selected_image_id: selectedImageId,
        selected_print_product: printProduct,
        customer_notes: notes || null,
        social_consent: socialConsent || false,
        social_handle: socialHandle || null,
        status: 'processing_print' // Update status to indicate fulfillment started
      })
      .eq('id', orderId);

    if (error) {
      console.error('DB Update Error:', error);
      return NextResponse.json({ error: 'Failed to update order' }, { status: 500 });
    }

    // 2. Automate Printify Fulfillment
    // Fetch full order details + Image URL
    const { data: order } = await supabase
      .from('orders')
      .select('*, customer_email, customer_name')
      .eq('id', orderId)
      .single();

    const { data: image } = await supabase
      .from('images')
      .select('url')
      .eq('id', selectedImageId)
      .single();

    if (order && image && printProduct !== 'digital') {
      // Trigger generic "createOrder"
      // In a real app, you'd pass shipping info here if you collected it in a previous step.
      // For now, we use the fallback in the service or assume digital-first flow.
      const printifyId = await PrintifyService.createOrder({
        orderId: orderId,
        customerEmail: order.customer_email,
        customerName: order.customer_name,
        imageUrl: image.url,
        productType: printProduct,
        shippingAddress: order.shipping_address // Assuming this column exists or is undefined
      });

      if (printifyId) {
        console.log(`[Fulfillment] Started Printify Order: ${printifyId}`);
        // Optionally verify/save this ID back to DB
        await supabase.from('orders').update({
          print_provider_order_id: printifyId,
          fulfillment_status: 'sent_to_printify'
        }).eq('id', orderId);
      }
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
