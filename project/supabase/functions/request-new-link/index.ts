// Supabase Edge Function: request-new-link
// Purpose: Handle customer requests for new access links

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import * as jose from 'https://deno.land/x/jose@v5.2.0/index.ts';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RequestBody {
    email: string;
}

serve(async (req) => {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        // Parse request body
        const { email }: RequestBody = await req.json();

        if (!email) {
            return new Response(
                JSON.stringify({ error: 'Email is required' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // Normalize email
        const normalizedEmail = email.trim().toLowerCase();

        // Find order by email
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );

        const { data: order, error: orderError } = await supabaseClient
            .from('orders')
            .select('id, customer_name, customer_email, status')
            .eq('customer_email', normalizedEmail)
            .in('status', ['ready', 'fulfilled'])
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        if (orderError || !order) {
            return new Response(
                JSON.stringify({
                    success: false,
                    message: 'No orders found for this email address. Please check your email or contact support.'
                }),
                { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // Generate new JWT token (90 days expiration)
        const jwtSecret = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
        const secret = new TextEncoder().encode(jwtSecret);

        const token = await new jose.SignJWT({ orderId: order.id })
            .setProtectedHeader({ alg: 'HS256' })
            .setIssuedAt()
            .setExpirationTime('90d')
            .sign(secret);

        // Send email with new link using Resend
        const resendApiKey = Deno.env.get('RESEND_API_KEY');
        const baseUrl = Deno.env.get('NEXT_PUBLIC_SITE_URL') || 'https://redemption.tayloredpetportraits.com';
        const accessUrl = `${baseUrl}/order/${token}`;

        if (resendApiKey) {
            try {
                await fetch('https://api.resend.com/emails', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${resendApiKey}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        from: 'Taylored Pet Portraits <noreply@tayloredpetportraits.com>',
                        to: order.customer_email,
                        subject: '🔗 Your New Taylored Pet Portraits Link',
                        html: getEmailTemplate(order.customer_name, accessUrl),
                    }),
                });
            } catch (emailError) {
                console.error('Failed to send email:', emailError);
                // Continue anyway - we'll still return the token
            }
        }

        return new Response(
            JSON.stringify({
                success: true,
                message: 'Check your email for a new access link!',
            }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            }
        );
    } catch (error) {
        console.error('Error requesting new link:', error);
        return new Response(
            JSON.stringify({
                success: false,
                message: 'An error occurred. Please try again later.'
            }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
});

function getEmailTemplate(customerName: string, accessUrl: string): string {
    return `
<!DOCTYPE html>
<html lang="en">
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f9fafb;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden;">
          <tr>
            <td style="background: linear-gradient(135deg, #7C3AED 0%, #A78BFA 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px;">🔗 Your New Access Link</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px 30px;">
              <p style="margin: 0 0 20px 0; color: #111827; font-size: 16px;">Hi <strong>${customerName}</strong>,</p>
              <p style="margin: 0 0 20px 0; color: #111827; font-size: 16px;">As requested, here's a fresh link to access your pet portraits:</p>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 0 0 30px 0;">
                    <a href="${accessUrl}" style="display: inline-block; background: linear-gradient(135deg, #7C3AED 0%, #A78BFA 100%); color: #ffffff; text-decoration: none; font-weight: bold; font-size: 18px; padding: 16px 40px; border-radius: 12px;">Access My Portraits</a>
                  </td>
                </tr>
              </table>
              <p style="margin: 0 0 20px 0; color: #111827; font-size: 14px; background-color: #fef3c7; padding: 15px; border-radius: 8px;">⏰ <strong>Important:</strong> This link will remain active for 90 days from today.</p>
              <p style="margin: 0; color: #111827; font-size: 16px;">– Tay<br><span style="color: #6b7280; font-size: 14px;">Taylored Pet Portraits</span></p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}
