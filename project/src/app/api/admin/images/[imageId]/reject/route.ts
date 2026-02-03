import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export async function POST(
    _req: NextRequest,
    { params }: { params: Promise<{ imageId: string }> }
) {
    try {
        const { imageId } = await params;
        const supabase = createAdminClient();

        // Update image status to 'rejected'
        const { data, error } = await supabase
            .from('images')
            .update({ status: 'rejected' })
            .eq('id', imageId)
            .select()
            .single();

        if (error) {
            console.error('Error rejecting image:', error);
            return NextResponse.json(
                { error: 'Failed to reject image' },
                { status: 500 }
            );
        }

        // TODO: Optionally trigger regeneration workflow here
        // For now, just mark as rejected

        return NextResponse.json({ success: true, image: data });
    } catch (error) {
        console.error('Reject image error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
