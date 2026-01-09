import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
    const templatesDir = path.join(process.cwd(), 'public', 'mockup-templates');

    if (!fs.existsSync(templatesDir)) {
        return NextResponse.json({ themes: [] });
    }

    const themes = fs.readdirSync(templatesDir).filter(file => {
        try {
            return fs.statSync(path.join(templatesDir, file)).isDirectory();
        } catch {
            return false;
        }
    }).map(themeId => {
        try {
            // Count images
            const themeDir = path.join(templatesDir, themeId);
            const images = fs.readdirSync(themeDir).filter(f => /\.(jpg|png|jpeg|webp)$/i.test(f));

            return {
                id: themeId,
                name: themeId.charAt(0).toUpperCase() + themeId.slice(1),
                imageCount: images.length,
                previewImage: images.length > 0 ? `/mockup-templates/${themeId}/${images[0]}` : null
            };
        } catch (err) {
            console.error(`Error processing theme ${themeId}:`, err);
            return null;
        }
    }).filter(t => t !== null); // Filter out failed themes

    return NextResponse.json({ themes });
}
