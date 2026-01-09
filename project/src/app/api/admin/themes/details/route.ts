import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const themeId = searchParams.get('id');
        const type = searchParams.get('type');

        if (!themeId || !type) {
            return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
        }

        const baseDir = type === 'portrait' ? 'templates' : 'mockup-templates';
        const themeDir = path.join(process.cwd(), 'public', baseDir, themeId);

        if (!fs.existsSync(themeDir)) {
            return NextResponse.json({ error: 'Theme not found' }, { status: 404 });
        }

        const images = fs.readdirSync(themeDir).filter(f => /\.(jpg|png|jpeg|webp)$/i.test(f));
        const items = images.map(img => ({
            name: img,
            url: `/${baseDir}/${themeId}/${img}`
        }));

        return NextResponse.json({ images: items });

    } catch (error) {
        console.error('Theme Details Error:', error);
        return NextResponse.json({ error: 'Internal server error: ' + error }, { status: 500 });
    }
}
