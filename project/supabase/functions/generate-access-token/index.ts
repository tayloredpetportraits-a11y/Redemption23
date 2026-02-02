// Supabase Edge Function: generate-access-token
// Purpose: Generate secure JWT access tokens for orders

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import * as jose from 'https://deno.land/x/jose@v5.2.0/index.ts';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RequestBody {
    orderId: string;
}

serve(async (req) => {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        // Parse request body
        const { orderId }: RequestBody = await req.json();

        if (!orderId) {
            return new Response(
                JSON.stringify({ error: 'orderId is required' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // Verify order exists
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );

        const { data: order, error: orderError } = await supabaseClient
            .from('orders')
            .select('id')
            .eq('id', orderId)
            .single();

        if (orderError || !order) {
            return new Response(
                JSON.stringify({ error: 'Order not found' }),
                { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // Generate JWT token (90 days expiration)
        const jwtSecret = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
        const secret = new TextEncoder().encode(jwtSecret);

        const token = await new jose.SignJWT({ orderId })
            .setProtectedHeader({ alg: 'HS256' })
            .setIssuedAt()
            .setExpirationTime('90d')
            .sign(secret);

        // Calculate expiration date
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 90);

        return new Response(
            JSON.stringify({
                token,
                expiresAt: expiresAt.toISOString(),
            }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            }
        );
    } catch (error) {
        console.error('Error generating token:', error);
        return new Response(
            JSON.stringify({ error: error.message || 'Internal server error' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
});
