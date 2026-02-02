import { NextRequest, NextResponse } from 'next/server';
import { PrintifyService } from '@/lib/printify/service';

/**
 * Generates a real Printify mockup showing the customer's specific portrait
 * on their chosen product (canvas, mug, etc.)
 */
export async function POST(request: NextRequest) {
    try {
        const { portraitUrl, productType } = await request.json();

        if (!portraitUrl || !productType) {
            return NextResponse.json(
                { error: 'Missing portraitUrl or productType' },
                { status: 400 }
            );
        }

        console.log(`[Mockup API] Generating mockup for ${productType} with portrait: ${portraitUrl}`);

        // This generates a mockup with THIS SPECIFIC portrait on the product
        const mockupUrl = await PrintifyService.generateMockupImage(
            portraitUrl,    // The customer's specific portrait URL
            productType     // e.g., 'canvas-11x14'
        );

        if (!mockupUrl) {
            throw new Error('Mockup generation failed - Printify returned null');
        }

        console.log(`[Mockup API] Success! Mockup URL: ${mockupUrl}`);

        return NextResponse.json({ mockupUrl });

    } catch (error: any) {
        console.error('[Mockup API] Error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to generate mockup' },
            { status: 500 }
        );
    }
}
