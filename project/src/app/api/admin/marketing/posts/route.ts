
import { NextResponse } from 'next/server';
import { getSocialPosts } from '@/lib/marketing/service';

export async function GET() {
    try {
        const posts = await getSocialPosts('all');
        return NextResponse.json({ posts });
    } catch (error) {
        console.error("Failed to fetch social posts:", error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
