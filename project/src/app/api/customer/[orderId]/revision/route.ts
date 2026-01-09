import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export async function POST(
    request: NextRequest,
    context: { params: Promise<{ orderId: string }> }
) {
    try {
        const { orderId } = await context.params;
        const { selectedImageId, notes } = await request.json();

        if (!selectedImageId) {
            return NextResponse.json(
                { error: 'Selected image is required' },
                { status: 400 }
            );
        }

        if (!notes) {
            return NextResponse.json(
                { error: 'Revision notes are required' },
                { status: 400 }
            );
        }

        const supabase = createAdminClient();

        // Update Order to Revision Status
        const { error } = await supabase
            .from('orders')
            .update({
                selected_image_id: selectedImageId,
                customer_notes: null, // Clear redemption notes if any
                revision_notes: notes,
                status: 'revising',
                revision_status: 'requested'
            })
            .eq('id', orderId);

        if (error) {
            console.error('DB Update Error:', error);
            return NextResponse.json({ error: 'Failed to submit revision' }, { status: 500 });
        }

        // Optional: Send email notification to Admin (TODO)

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Revision request error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
