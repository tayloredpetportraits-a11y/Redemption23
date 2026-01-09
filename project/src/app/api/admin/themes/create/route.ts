import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(req: Request) {
    const { name } = await req.json();
    const safeName = name.toLowerCase().replace(/[^a-z0-9]/g, '');

    const themeDir = path.join(process.cwd(), 'public', 'templates', safeName);

    if (!fs.existsSync(themeDir)) {
        fs.mkdirSync(themeDir, { recursive: true });
        return NextResponse.json({ success: true, id: safeName });
    }

    return NextResponse.json({ error: 'Theme already exists' }, { status: 400 });
}
