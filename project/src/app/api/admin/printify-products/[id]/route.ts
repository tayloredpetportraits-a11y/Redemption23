import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();

        const supabase = await createClient();

        const { data, error } = await supabase
            .from('printify_product_configs')
            .update(body)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('[API] Failed to update product:', error);
            return NextResponse.json(
                { error: error.message || 'Failed to update product' },
                { status: 500 }
            );
        }

        return NextResponse.json({ product: data });
    } catch (error) {
        console.error('[API] Error updating product:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

export async function DELETE(
    _request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const supabase = await createClient();

        const { error } = await supabase
            .from('printify_product_configs')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('[API] Failed to delete product:', error);
            return NextResponse.json(
                { error: error.message || 'Failed to delete product' },
                { status: 500 }
            );
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('[API] Error deleting product:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
