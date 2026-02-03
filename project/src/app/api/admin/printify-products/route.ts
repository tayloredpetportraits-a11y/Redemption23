/**
 * @deprecated SOFT DEPRECATION - Printify Product Configuration Management
 * 
 * This endpoint manages Printify product configurations for manual fulfillment.
 * Note: Printify is NO LONGER used for mockup generation (now CSS-based).
 * 
 * Consider renaming to "Fulfillment Settings" to clarify purpose.
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get('active') === 'true';

    const supabase = await createClient();

    let query = supabase
        .from('printify_product_configs')
        .select('*')
        .order('display_order', { ascending: true });

    if (activeOnly) {
        query = query.eq('is_active', true);
    }

    const { data, error } = await query;

    if (error) {
        console.error('[API] Failed to fetch products:', error);
        return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
    }

    return NextResponse.json({ products: data });
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const {
            product_name,
            product_type,
            description,
            price_cents,
            printify_blueprint_id,
            printify_print_provider_id,
            printify_variant_id,
            is_active = true,
            display_order = 0
        } = body;

        // Validate required fields
        if (!product_name || !product_type || price_cents === undefined ||
            !printify_blueprint_id || !printify_print_provider_id || !printify_variant_id) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        const supabase = await createClient();

        const { data, error } = await supabase
            .from('printify_product_configs')
            .insert({
                product_name,
                product_type,
                description,
                price_cents,
                printify_blueprint_id,
                printify_print_provider_id,
                printify_variant_id,
                is_active,
                display_order
            })
            .select()
            .single();

        if (error) {
            console.error('[API] Failed to create product:', error);
            return NextResponse.json(
                { error: error.message || 'Failed to create product' },
                { status: 500 }
            );
        }

        return NextResponse.json({ product: data }, { status: 201 });
    } catch (error) {
        console.error('[API] Error creating product:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
