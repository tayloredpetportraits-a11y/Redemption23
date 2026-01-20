'use server';

import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';

// Initialize Supabase with Service Role Key for Admin Access
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface Theme {
    id: string;
    name: string;
    cover_image_url: string | null;
    reference_images: string[];
    trigger_word: string | null;
    is_active: boolean;
    created_at?: string;
}

export async function getThemes() {
    const { data, error } = await supabase
        .from('themes')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return data as Theme[];
}

export async function saveThemeToDB(themeData: {
    name: string;
    id: string;
    trigger_word: string;
    reference_images: string[];
    cover_image_url: string;
}) {
    const { name, id, trigger_word, reference_images, cover_image_url } = themeData;

    if (!name || !id) throw new Error('Name and ID are required');

    // Double check sanity
    const safeId = id.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9_-]/g, '');

    const { error } = await supabase.from('themes').insert({
        id: safeId,
        name,
        cover_image_url,
        reference_images,
        trigger_word: trigger_word || safeId,
        is_active: true
    });

    if (error) {
        console.error('Database Insertion Error:', error);
        throw new Error(error.message);
    }

    revalidatePath('/admin/themes');
    return { success: true };
}

export async function deleteTheme(themeId: string) {
    const { error } = await supabase
        .from('themes')
        .delete()
        .eq('id', themeId);

    if (error) throw new Error(error.message);

    revalidatePath('/admin/themes');
    return { success: true };
}

export async function toggleThemeStatus(themeId: string, isActive: boolean) {
    const { error } = await supabase.from('themes').update({ is_active: isActive }).eq('id', themeId);
    if (error) throw new Error(error.message);
    revalidatePath('/admin/themes');
}
