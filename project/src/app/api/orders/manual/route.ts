import { NextResponse } from 'next/server';
import { mockDb } from '@/lib/mock-db';
import fs from 'fs';
import path from 'path';

export async function POST(req: Request) {
    try {
        const formData = await req.formData();

        const customerName = formData.get('customerName') as string;
        const customerEmail = formData.get('customerEmail') as string;
        const productType = formData.get('productType') as string || 'Manual Order';
        const files = formData.getAll('files') as File[];
        const mockups = formData.getAll('mockups') as File[];

        // 1. Create Order
        const order = await mockDb.insertOrder({
            customer_name: customerName,
            customer_email: customerEmail,
            product_type: productType,
            status: 'ready' // Ready for customer immediately
        });

        // 2. Save Images
        const uploadDir = path.join(process.cwd(), 'public', 'uploads', order.id);
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }

        const saveFile = async (file: File, type: 'primary' | 'mockup', index: number) => {
            const buffer = Buffer.from(await file.arrayBuffer());
            // Sanitize filename
            const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
            const filePath = path.join(uploadDir, safeName);
            fs.writeFileSync(filePath, buffer);

            return {
                order_id: order.id,
                url: `/uploads/${order.id}/${safeName}`,
                storage_path: `uploads/${order.id}/${safeName}`,
                type: type,
                status: 'approved', // Auto-approve manual uploads
                display_order: index,
                is_selected: false,
                is_bonus: false
            };
        };

        const primaryImages = await Promise.all(files.map((f, i) => saveFile(f, 'primary', i)));
        const mockupImages = await Promise.all(mockups.map((f, i) => saveFile(f, 'mockup', i)));

        const allImages = [...primaryImages, ...mockupImages];

        // 3. Insert Image Records
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await mockDb.insertImages(allImages as any);

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
