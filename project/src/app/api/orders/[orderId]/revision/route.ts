import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params;
    const body = await request.json();
    const { revision_notes, revision_status, selected_image_ids, reference_photo_urls } = body;

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Validation: At least 1 portrait must be selected
    if (!selected_image_ids || selected_image_ids.length === 0) {
      return NextResponse.json(
        { error: 'At least one portrait must be selected for revision' },
        { status: 400 }
      );
    }

    // Validation: Verify selected image IDs exist in this order
    const { data: images, error: imageError } = await supabase
      .from('images')
      .select('id')
      .eq('order_id', orderId)
      .in('id', selected_image_ids);

    if (imageError) {
      console.error('Error fetching images:', imageError);
      return NextResponse.json(
        { error: 'Failed to validate selected portraits' },
        { status: 500 }
      );
    }

    // Check if all selected IDs are valid
    const validImageIds = images?.map((img) => img.id) || [];
    const invalidIds = selected_image_ids.filter(
      (id: string) => !validImageIds.includes(id)
    );

    if (invalidIds.length > 0) {
      return NextResponse.json(
        { error: `Invalid portrait IDs: ${invalidIds.join(', ')}` },
        { status: 400 }
      );
    }

    // Create metadata object with structured revision info
    const revision_metadata = {
      selected_image_ids: selected_image_ids || [],
      reference_photo_urls: reference_photo_urls || [],
      requested_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('orders')
      .update({
        revision_notes,
        revision_status,
        // Store metadata as JSON (requires revision_metadata JSONB column in orders table)
        revision_metadata: JSON.stringify(revision_metadata),
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId)
      .select()
      .single();

    if (error) {
      console.error('Error updating revision:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, order: data });
  } catch (error) {
    console.error('Error submitting revision request:', error);
    return NextResponse.json(
      { error: 'Failed to submit revision request' },
      { status: 500 }
    );
  }
}
