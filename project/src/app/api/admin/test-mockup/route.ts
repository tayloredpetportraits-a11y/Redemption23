import { NextResponse } from 'next/server';
import { PrintifyService } from '@/lib/printify/service';

export async function POST(request: Request) {
    try {
        const { productType } = await request.json();

        if (!productType) {
            return NextResponse.json(
                { error: 'Product type is required' },
                { status: 400 }
            );
        }

        // Use a placeholder image for testing
        const placeholderImage = 'https://placehold.co/1000x1000/FF9AC4/FFFFFF?text=Test+Portrait';

        const mockupUrl = await PrintifyService.generateMockupImage(
            placeholderImage,
            productType
        );

        if (!mockupUrl) {
            return NextResponse.json(
                { error: 'Failed to generate mockup. Check product configuration and Printify credentials.' },
                { status: 500 }
            );
        }

        return NextResponse.json({ mockupUrl });
    } catch (error) {
        console.error('[API] Test mockup error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
