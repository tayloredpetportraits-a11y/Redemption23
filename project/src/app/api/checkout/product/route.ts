import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

export async function POST(req: NextRequest) {
    try {
        const { orderId, productId, productName, price, imageId } = await req.json();

        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
            apiVersion: '2025-12-15.clover',
        });

        if (!orderId || !productId || !price) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [
                {
                    price_data: {
                        currency: 'usd',
                        product_data: {
                            name: productName || 'Custom Pet Portrait Product',
                            metadata: {
                                productId,
                                imageId
                            }
                        },
                        unit_amount: Math.round(price * 100), // Convert to cents
                    },
                    quantity: 1,
                },
            ],
            mode: 'payment',
            success_url: `${req.headers.get('origin')}/customer/gallery/${orderId}?payment=success&product=${productId}`,
            cancel_url: `${req.headers.get('origin')}/customer/gallery/${orderId}?payment=cancelled`,
            metadata: {
                orderId,
                productType: 'physical_good', // Distinct from 'bonus_theme'
                productId,
                imageId,
                productName
            },
        });

        return NextResponse.json({ sessionId: session.id, url: session.url });
    } catch (error) {
        console.error('Stripe checkout error:', error);
        return NextResponse.json(
            { error: 'Failed to create checkout session' },
            { status: 500 }
        );
    }
}
