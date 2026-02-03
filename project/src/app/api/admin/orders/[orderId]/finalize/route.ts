import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(
    _req: NextRequest,
    { params }: { params: Promise<{ orderId: string }> }
) {
    try {
        const { orderId } = await params;
        const supabase = createAdminClient();

        // 1. Get order details
        const { data: order, error: orderError } = await supabase
            .from('orders')
            .select('*')
            .eq('id', orderId)
            .single();

        if (orderError || !order) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        }

        // 2. Verify minimum approved images (≥5)
        const { data: approvedImages, error: imagesError } = await supabase
            .from('images')
            .select('id')
            .eq('order_id', orderId)
            .eq('status', 'approved');

        if (imagesError) {
            return NextResponse.json(
                { error: 'Failed to verify approved images' },
                { status: 500 }
            );
        }

        if (!approvedImages || approvedImages.length < 5) {
            return NextResponse.json(
                { error: `Minimum 5 approved images required. Current: ${approvedImages?.length || 0}` },
                { status: 400 }
            );
        }

        // 3. Update order status to 'ready'
        const { error: updateError } = await supabase
            .from('orders')
            .update({ status: 'ready' })
            .eq('id', orderId);

        if (updateError) {
            console.error('Error updating order status:', updateError);
            return NextResponse.json(
                { error: 'Failed to update order status' },
                { status: 500 }
            );
        }

        // 4. Send customer notification email via Resend
        try {
            const portalLink = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/portal/${orderId}`;

            await resend.emails.send({
                from: 'Pet Portraits <noreply@tayloredsolutions.ai>',
                to: order.customer_email,
                subject: `🎨 Your ${order.pet_name || 'Pet'} Portraits Are Ready!`,
                html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #7C3AED;">Hi ${order.customer_name}!</h1>
            <p style="font-size: 16px; line-height: 1.6;">
              Great news! Your custom <strong>${order.pet_name || 'pet'}</strong> portraits are ready to view.
            </p>
            <p style="font-size: 16px; line-height: 1.6;">
              Click the button below to browse your gallery and select your favorite:
            </p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${portalLink}" style="background: linear-gradient(135deg, #7C3AED 0%, #EC4899 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                View Your Gallery →
              </a>
            </div>
            <p style="font-size: 14px; color: #666;">
              In your gallery, you'll be able to:<br>
              ✓ Browse all your portrait variations<br>
              ✓ Select your favorite<br>
              ✓ Download high-resolution images<br>
              ✓ Unlock bonus themes (optional)
            </p>
            <p style="font-size: 14px; color: #999; margin-top: 30px;">
              Questions? Reply to this email and we'll help!
            </p>
          </div>
        `,
            });

            console.log(`[Finalize] Email sent to ${order.customer_email} for order ${orderId}`);
        } catch (emailError) {
            console.error('Failed to send email:', emailError);
            // Don't fail the entire request if email fails, log it
            return NextResponse.json({
                success: true,
                warning: 'Order finalized but email failed to send',
            });
        }

        return NextResponse.json({
            success: true,
            message: 'Order finalized and customer notified',
            approvedCount: approvedImages.length,
        });
    } catch (error) {
        console.error('Finalize order error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
