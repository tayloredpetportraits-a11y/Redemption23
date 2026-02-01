
import { NextResponse } from 'next/server';
import sharp from 'sharp';

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const imageUrl = searchParams.get('url');

    if (!imageUrl) {
        return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 });
    }

    try {
        // 1. Fetch the original image
        const response = await fetch(imageUrl);
        if (!response.ok) throw new Error('Failed to fetch image');

        const arrayBuffer = await response.arrayBuffer();
        const inputBuffer = Buffer.from(arrayBuffer);

        // 2. Resize/Crop to 9:16 aspect ratio (e.g. 1080x1920)
        // We use fit: 'cover' to crop the center
        const wallpaperBuffer = await sharp(inputBuffer)
            .resize(1080, 1920, {
                fit: 'cover',
                position: 'center'
            })
            .jpeg({ quality: 90 })
            .toBuffer();

        // 3. Return the image directly
        // @ts-ignore
        return new NextResponse(wallpaperBuffer, {
            headers: {
                'Content-Type': 'image/jpeg',
                'Content-Disposition': `attachment; filename="mobile-wallpaper.jpg"`,
            },
        });

    } catch (error) {
        console.error('Wallpaper generation failed:', error);
        return NextResponse.json({ error: 'Failed to generate wallpaper' }, { status: 500 });
    }
}
