
import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { uploadFile, getPublicUrl } from '@/lib/supabase/storage';

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;
        const name = formData.get('name') as string;
        const keywords = formData.get('keywords') as string; // comma separated

        if (!file || !name) {
            return NextResponse.json({ error: 'Missing file or name' }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const filename = `templates/mockups/${Date.now()}_${file.name.replace(/[^a-z0-9.]/gi, '_')}`;

        // 1. Upload to Storage
        await uploadFile(filename, buffer, file.type);
        const publicUrl = getPublicUrl(filename);

        // 2. Insert into DB
        const supabase = createAdminClient();
        const keywordArray = keywords ? keywords.split(',').map(k => k.trim()).filter(Boolean) : [];

        const { data, error } = await supabase
            .from('mockup_templates')
            .insert({
                name,
                image_url: publicUrl,
                keywords: keywordArray,
                is_active: true
            })
            .select()
            .single();

        if (error) {
            throw error;
        }

        return NextResponse.json({ success: true, template: data });

    } catch (e) {
        console.error('Upload failed:', e);
        return NextResponse.json({ error: (e as Error).message }, { status: 500 });
    }
}
