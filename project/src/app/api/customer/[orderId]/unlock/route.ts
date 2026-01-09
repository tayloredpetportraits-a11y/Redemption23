import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export async function POST(request: Request, { params }: { params: { orderId: string } }) {
  const { orderId } = params;
  const supabase = createAdminClient();

  try {
    // 1. Get Bonus Images
    const { data: images } = await supabase
      .from('images')
      .select('*')
      .eq('order_id', orderId)
      .eq('is_bonus', true);

    if (!images) throw new Error("No bonus images found");

    // 2. Reveal Clean URLs
    // We stored the clean path in 'storage_path' (secret path).
    // We stored watermarked path in 'url'.
    // To unlock, we swap them? Or just update 'url' to point to 'storage_path'?
    // The frontend uses 'url'.
    // So we update 'url' = 'storage_path'.
    // Wait, 'storage_path' currently holds "generated/uuid/secret.png".
    // Public URL needs slash prefix: "/generated/uuid/secret.png".

    for (const img of images) {
      // Check if it looks locked (url is watermarked version)
      // We assume storage_path has the secret CLEAN path.
      if (img.storage_path && img.storage_path.includes('secret')) {
        const cleanUrl = '/' + img.storage_path; // simplistic

        // Update DB
        await supabase.from('images').update({
          url: cleanUrl,
          status: 'approved' // Ensure it's approved
        }).eq('id', img.id);
      }
    }

    // 3. Mark Order as Bonus Unlocked
    await supabase.from('orders').update({ bonus_unlocked: true }).eq('id', orderId);

    return NextResponse.json({ success: true });
  } catch (e: unknown) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
