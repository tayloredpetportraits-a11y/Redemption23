import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
    const templatesDir = path.join(process.cwd(), 'public', 'templates');

    if (!fs.existsSync(templatesDir)) {
        return NextResponse.json({ themes: [] });
    }

    const themes = fs.readdirSync(templatesDir).filter(file => {
        return fs.statSync(path.join(templatesDir, file)).isDirectory();
    }).map(themeId => {
        // Count images
        const themeDir = path.join(templatesDir, themeId);
        const images = fs.readdirSync(themeDir).filter(f => /\.(jpg|png|jpeg|webp)$/i.test(f));

        return {
            id: themeId,
            name: themeId.charAt(0).toUpperCase() + themeId.slice(1),
            imageCount: images.length,
            previewImage: images.length > 0 ? `/templates/${themeId}/${images[0]}` : null
        };
    });

    return NextResponse.json({ themes });
}
