import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(req: Request) {
    try {
        const { themeId, type } = await req.json();

        if (!themeId || !type) {
            return NextResponse.json({ error: 'Missing themeId or type' }, { status: 400 });
        }

        const baseDir = type === 'portrait' ? 'templates' : 'mockup-templates';
        const themeDir = path.join(process.cwd(), 'public', baseDir, themeId);

        if (fs.existsSync(themeDir)) {
            fs.rmSync(themeDir, { recursive: true, force: true });
            return NextResponse.json({ success: true });
        } else {
            return NextResponse.json({ error: 'Theme not found' }, { status: 404 });
        }
    } catch (error) {
        console.error('Delete Theme Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
