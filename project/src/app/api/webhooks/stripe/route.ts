import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

// Inits moved inside handler

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature');

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2025-12-15.clover',
  });

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  if (!signature) {
    return NextResponse.json(
      { error: 'No signature provided' },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 400 }
    );
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;

        if (session.metadata?.productType === 'bonus_theme') {
          const orderId = session.metadata.orderId;

          // 1. Update Order Status
          const { error: orderError } = await supabase
            .from('orders')
            .update({
              bonus_unlocked: true,
              bonus_payment_status: 'paid',
              stripe_session_id: session.id,
            })
            .eq('id', orderId);

          if (orderError) {
            console.error('Failed to update order:', orderError);
            return NextResponse.json({ error: 'Failed to update order' }, { status: 500 });
          }

          // 2. Unlock Images
          // Fetch locked bonus images
          const { data: images, error: imagesError } = await supabase
            .from('images')
            .select('*')
            .eq('order_id', orderId)
            .eq('is_bonus', true);

          if (!imagesError && images) {
            for (const img of images) {
              // Swap URL with the clean storage path if available
              // Assuming 'storage_path' contains the clean relative path like 'generated/...'
              // And 'url' was pointing to a watermarked version.
              if (img.storage_path && img.storage_path.includes('secret')) {
                // Simplistic logic: We assume the secret file is at the root or publicly serveable
                // This matches the logic found in the previous "unlock" endpoint
                const cleanUrl = '/' + img.storage_path;

                await supabase
                  .from('images')
                  .update({
                    url: cleanUrl,
                    status: 'approved'
                  })
                  .eq('id', img.id);
              }
            }
          }

          console.log(`Bonus theme unlocked for order ${orderId}`);
        } else if (session.metadata?.productType === 'physical_good') {
          console.log(`Physical product purchased for order ${session.metadata.orderId}: ${session.metadata.productName}`);
          // Future: Create a Fulfillment record or similar
        }
        break;
      }

      case 'checkout.session.expired': {
        const session = event.data.object as Stripe.Checkout.Session;
        console.log(`Checkout session expired: ${session.id}`);
        break;
      }

      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log(`Payment succeeded: ${paymentIntent.id}`);
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log(`Payment failed: ${paymentIntent.id}`);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error('Error processing webhook:', err);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}
