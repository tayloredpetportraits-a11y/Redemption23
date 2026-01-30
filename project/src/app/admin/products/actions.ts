'use server';

import { createAdminClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function deleteProduct(id: string) {
    const supabase = createAdminClient();

    // Hard delete or Soft delete? The page uses is_active=false (soft).
    // Let's stick to soft delete for safety, or hard delete if they want it GONE.
    // The user said "not letting me delete them", implying they want them gone.
    // But soft delete is safer. Let's do soft delete first.

    const { error } = await supabase
        .from('product_templates')
        .update({ is_active: false })
        .eq('id', id);

    if (error) {
        console.error('Delete error:', error);
        throw new Error(error.message);
    }

    revalidatePath('/admin/products');
    revalidatePath('/customer/gallery/[orderId]'); // invalidates gallery cache too
}

export async function createProduct(formData: FormData) {
    // We can move creation here too later, but for now let's fix delete.
}
