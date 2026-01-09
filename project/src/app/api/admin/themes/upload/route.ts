import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
// import { pipeline } from 'stream';
// import { promisify } from 'util';

// const pump = promisify(pipeline);

export async function POST(req: Request) {
    const formData = await req.formData();
    const themeId = formData.get('themeId') as string;
    const files = formData.getAll('files') as File[];

    if (!themeId || files.length === 0) {
        return NextResponse.json({ error: 'Missing themeId or files' }, { status: 400 });
    }

    const themeDir = path.join(process.cwd(), 'public', 'templates', themeId);

    // Ensure directory exists
    if (!fs.existsSync(themeDir)) {
        fs.mkdirSync(themeDir, { recursive: true });
    }

    for (const file of files) {
        const filePath = path.join(themeDir, file.name);
        const buffer = Buffer.from(await file.arrayBuffer());
        fs.writeFileSync(filePath, buffer);
    }

    return NextResponse.json({ success: true, count: files.length });
}
