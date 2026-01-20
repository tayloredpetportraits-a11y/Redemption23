import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { generateImagesForOrder } from '@/lib/ai/generation';
import { uploadFile, getPublicUrl } from '@/lib/supabase/storage';

export async function POST(req: Request) {
    try {
        const formData = await req.formData();
        const supabase = createAdminClient();

        const customerName = formData.get('customerName') as string;
        const customerEmail = formData.get('customerEmail') as string;
        const productType = formData.get('productType') as string || 'Manual Order';
        const files = formData.getAll('files') as File[];
        // Mockups not strictly handled here yet, can be added if needed, but primary focus is generation

        if (files.length === 0) {
            return NextResponse.json({ error: 'No files provided' }, { status: 400 });
        }

        const file = files[0]; // Take first file for generation
        const buffer = Buffer.from(await file.arrayBuffer());
        const timestamp = Date.now();
        const safeName = `manual_${timestamp}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
        const storagePath = `uploads/manual/${safeName}`;

        // 1. Upload to Real Storage
        await uploadFile(storagePath, buffer);
        const publicUrl = getPublicUrl(storagePath);

        // 2. Create Real Order
        const { data: order, error: orderError } = await supabase.from('orders').insert({
            customer_name: customerName,
            customer_email: customerEmail,
            product_type: productType,
            status: 'pending', // Pending generation
            pet_image_url: publicUrl,
            pet_name: 'Manual Order Pet'
        }).select().single();

        if (orderError || !order) {
            console.error("Order creation failed:", orderError);
            throw new Error("Failed to create order");
        }

        // 3. Trigger Async Generation (Fire and Forget)
        // We don't await this so the UI returns quickly
        generateImagesForOrder(
            order.id,
            publicUrl,
            productType,
            '', // Breed unknown
            '', // Details unknown
            false // Auto approve off by default for manual
        ).catch(e => console.error("Async generation failed:", e));

        return NextResponse.json({
            success: true,
            orderId: order.id,
            customerUrl: `/customer/gallery/${order.id}`
        });

    } catch (error) {
        console.error('Manual order failed:', error);
        return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
    }
}
