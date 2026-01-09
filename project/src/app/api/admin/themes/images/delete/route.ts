import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(req: Request) {
    try {
        const { themeId, filename, type } = await req.json();

        if (!themeId || !filename || !type) {
            return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
        }

        const baseDir = type === 'portrait' ? 'templates' : 'mockup-templates';
        const filePath = path.join(process.cwd(), 'public', baseDir, themeId, filename);

        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            return NextResponse.json({ success: true });
        } else {
            return NextResponse.json({ error: 'Image not found' }, { status: 404 });
        }
    } catch (error) {
        console.error('Delete Image Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
