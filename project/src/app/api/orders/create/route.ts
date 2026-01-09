import { NextResponse } from 'next/server';
// import { createOrder } from '@/lib/api/orders';
import { generateImagesForOrder } from '@/lib/ai/generation';
// import { mockDb } from '@/lib/mock-db';
import { createAdminClient } from '@/lib/supabase/server';
import { sendCustomerNotification } from '@/lib/email';
import fs from 'fs';
import path from 'path';

export async function POST(req: Request) {
  try {
    const contentType = req.headers.get('content-type') || '';

    let customerName, customerEmail, productType, petPhotoUrl, petBreed, petDetails;
    let autoApprove = false;

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      customerName = formData.get('customerName') as string;
      customerEmail = formData.get('customerEmail') as string;
      productType = formData.get('productType') as string;
      const petPhoto = formData.get('petPhoto') as File;
      petBreed = formData.get('petBreed') as string;
      petDetails = formData.get('petDetails') as string;
      autoApprove = formData.get('autoApprove') === 'true';

      if (!customerName || !customerEmail || !productType || !petPhoto) {
        return NextResponse.json(
          { error: 'Missing required form fields: customerName, customerEmail, productType, petPhoto' },
          { status: 400 }
        );
      }

      // Save the pet photo if provided
      if (petPhoto) {
        const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'pets');
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }
        const buffer = Buffer.from(await petPhoto.arrayBuffer());
        const safeName = `pet-${Date.now()}-${petPhoto.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
        fs.writeFileSync(path.join(uploadDir, safeName), buffer);
        petPhotoUrl = `/uploads/pets/${safeName}`;
      } else {
        petPhotoUrl = 'https://placeholder/dog.jpg';
      }

    } else {
      // JSON fallback
      const body = await req.json();
      customerName = body.customerName;
      customerEmail = body.customerEmail;
      productType = body.productType;
      petPhotoUrl = body.petPhotoUrl;
    }

    // 1. Create Order
    const supabase = createAdminClient();
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        customer_name: customerName,
        customer_email: customerEmail,
        product_type: productType,
        pet_image_url: petPhotoUrl,
        status: 'pending',
        pet_breed: petBreed || null,
        pet_details: petDetails || null
      })
      .select()
      .single();

    if (orderError) {
      console.error("DB Insert Error", orderError);
      throw new Error(`Order creation failed: ${orderError.message}`);
    }

    const orderId = order.id;

    // 2. Send "Order Started" Email
    // Don't await to keep UI fast
    sendCustomerNotification(customerEmail, customerName, orderId, 'ordered').catch(e => console.error("Failed to send welcome email:", e));

    // 4. Trigger AI Generation (Background)
    // We intentionally don't await this so the UI returns fast
    generateImagesForOrder(order.id, petPhotoUrl, productType, petBreed, petDetails, autoApprove).catch(err => {
      console.error("Background Generation Failed:", err);
    });

    return NextResponse.json({
      success: true,
      customerUrl: `/customer/gallery/${orderId}`
    });

  } catch (error: unknown) {
    console.error('Order creation failed:', error);
    return NextResponse.json(
      { error: (error as Error).message || 'Internal server error' },
      { status: 500 }
    );
  }
}
