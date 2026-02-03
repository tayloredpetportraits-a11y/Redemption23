import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

export async function POST(request: Request) {
    try {
        const { orderId, productType, portraitUrl } = await request.json();

        if (!orderId || !productType || !portraitUrl) {
            return NextResponse.json(
                { error: 'Missing required fields: orderId, productType, portraitUrl' },
                { status: 400 }
            );
        }

        // Get product details from database
        const supabase = await createClient();
        const { data: product, error: productError } = await supabase
            .from('printify_product_configs')
            .select('product_name, price_cents')
            .eq('product_type', productType)
            .eq('is_active', true)
            .single();

        if (productError || !product) {
            console.error('[Upsell] Product not found:', productType, productError);
            return NextResponse.json(
                { error: 'Product not found or inactive' },
                { status: 404 }
            );
        }

        // Create Stripe checkout session
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [
                {
                    price_data: {
                        currency: 'usd',
                        product_data: {
                            name: product.product_name,
                            description: `Upgrade your digital portrait to a physical ${product.product_name}`,
                        },
                        unit_amount: product.price_cents,
                    },
                    quantity: 1,
                },
            ],
            mode: 'payment',
            success_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/order/${orderId}?upsell=success`,
            cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/order/${orderId}?upsell=cancel`,
            metadata: {
                orderId,
                productType,
                portraitUrl,
                upsell: 'true'
            },
        });

        return NextResponse.json({ checkoutUrl: session.url });
    } catch (error) {
        console.error('[Upsell] Checkout error:', error);
        return NextResponse.json(
            { error: 'Failed to create checkout session' },
            { status: 500 }
        );
    }
}
