import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(req: Request) {
    const formData = await req.formData();
    const themeId = formData.get('themeId') as string;
    const files = formData.getAll('files') as File[];

    console.log(`[Upload] Mockup Theme: ${themeId}, Files: ${files.length}`);

    if (!themeId || files.length === 0) {
        return NextResponse.json({ error: 'Missing themeId or files' }, { status: 400 });
    }

    const themeDir = path.join(process.cwd(), 'public', 'mockup-templates', themeId);

    // Ensure directory exists
    if (!fs.existsSync(themeDir)) {
        fs.mkdirSync(themeDir, { recursive: true });
    }

    for (const file of files) {
        const filePath = path.join(themeDir, file.name);
        // Basic unique name to prevent overwrite if uploading same name
        // actually existing logic just overwrites, maybe we keep that for simplicity or add timestamp
        // Let's stick to existing logic but maybe we should be careful with filenames
        // Ideally we might want unique filenames but let's mirror existing behavior for consistency first
        // But to avoid caching issues or overwrites, maybe prefix? 
        // For simplicity, let's just write.
        const buffer = Buffer.from(await file.arrayBuffer());
        fs.writeFileSync(filePath, buffer);
    }

    return NextResponse.json({ success: true, count: files.length });
}
