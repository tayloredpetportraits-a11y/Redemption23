import { createAdminClient } from './server';

const BUCKET_NAME = 'primary-images'; // Central bucket for all app assets

export async function uploadFile(path: string, file: Buffer | Blob, contentType: string = 'image/png') {
    const supabase = createAdminClient();
    const { data, error } = await supabase
        .storage
        .from(BUCKET_NAME)
        .upload(path, file, {
            contentType,
            upsert: true
        });

    if (error) {
        console.error(`[Storage] Upload failed for ${path}:`, error);
        throw error;
    }

    return data;
}

export async function downloadFile(path: string): Promise<Buffer | null> {
    const supabase = createAdminClient();
    const { data, error } = await supabase
        .storage
        .from(BUCKET_NAME)
        .download(path);

    if (error) {
        console.error(`[Storage] Download failed for ${path}:`, error);
        return null;
    }

    return Buffer.from(await data.arrayBuffer());
}

export function getPublicUrl(path: string) {
    const supabase = createAdminClient();
    const { data } = supabase
        .storage
        .from(BUCKET_NAME)
        .getPublicUrl(path);

    return data.publicUrl;
}

export async function deleteFile(path: string) {
    const supabase = createAdminClient();
    const { error } = await supabase
        .storage
        .from(BUCKET_NAME)
        .remove([path]);

    if (error) {
        console.error(`[Storage] Delete failed for ${path}:`, error);
        throw error;
    }
}
