import { NextResponse } from 'next/server';
// import { createOrder } from '@/lib/api/orders';
import { generateImagesForOrder } from '@/lib/ai/generation';
// import { mockDb } from '@/lib/mock-db';
import { createAdminClient } from '@/lib/supabase/server';
import { sendCustomerNotification } from '@/lib/email';
import { uploadFile, getPublicUrl } from '@/lib/supabase/storage';
// import fs from 'fs';
// import path from 'path';
import { z } from 'zod';

// Define Validation Schema
const imageMetadataSchema = z.object({
  url: z.string().url(),
  storagePath: z.string(),
  type: z.string(),
});

const createOrderSchema = z.object({
  customerName: z.string().min(2, "Name must be at least 2 characters").max(100, "Name must be less than 100 characters"),
  customerEmail: z.string().email("Invalid email address"),
  productType: z.string().max(50, "Product type too long").optional(),
  petBreed: z.string().optional(),
  petDetails: z.string().optional(),
  imageMetadata: z.array(imageMetadataSchema).optional(),
});

export async function POST(req: Request) {
  try {
    const contentType = req.headers.get('content-type') || '';

    let payload: any = {};
    let petPhotoFile: File | null = null;
    let autoApprove = false;

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      payload.customerName = formData.get('customerName');
      payload.customerEmail = formData.get('customerEmail');
      payload.productType = formData.get('productType');
      payload.petBreed = formData.get('petBreed');
      payload.petDetails = formData.get('petDetails');

      petPhotoFile = formData.get('petPhoto') as File;
      autoApprove = formData.get('autoApprove') === 'true';

      // Handle imageMetadata if present in formData (expecting JSON string)
      const imageMetadataStr = formData.get('imageMetadata');
      if (imageMetadataStr && typeof imageMetadataStr === 'string') {
        try {
          payload.imageMetadata = JSON.parse(imageMetadataStr);
        } catch (e) {
          return NextResponse.json(
            { error: 'Invalid format for imageMetadata' },
            { status: 400 }
          );
        }
      }

    } else {
      // JSON payload
      const body = await req.json();
      payload = body;
      // Map body fields to payload if they differ, but here they seem consistent
      // autoApprove might be in body
      if (body.autoApprove !== undefined) autoApprove = body.autoApprove;
    }

    // Validate Payload with Zod
    const result = createOrderSchema.safeParse(payload);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: result.error.format() },
        { status: 400 }
      );
    }

    const { customerName, customerEmail, productType, petBreed, petDetails } = result.data;
    let petPhotoUrl = (payload as any).petPhotoUrl; // Allow direct URL from JSON

    // Specific check for petPhoto requirement if not provided in JSON
    if (!petPhotoUrl && !petPhotoFile) {
      return NextResponse.json(
        { error: 'Pet photo is required (either as file or URL)' },
        { status: 400 }
      );
    }


    // Save the pet photo if provided via FormData
    if (petPhotoFile) {
      // Upload to Supabase Storage instead of local FS
      const buffer = Buffer.from(await petPhotoFile.arrayBuffer());
      const safeName = `pet-${Date.now()}-${petPhotoFile.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      const storagePath = `uploads/pets/${safeName}`;

      await uploadFile(storagePath, buffer);
      petPhotoUrl = getPublicUrl(storagePath);
    } else if (!petPhotoUrl) {
      // Should be caught by check above, but as fallback/placeholder logic from original code
      petPhotoUrl = 'https://placeholder/dog.jpg';
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
