import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createAdminClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const adminToken = cookieStore.get('admin-token')?.value;

    if (adminToken !== 'authenticated') {
      return NextResponse.json(
        { error: 'Unauthorized. Please log in as admin.' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const customerName = formData.get('customerName') as string;
    const customerEmail = formData.get('customerEmail') as string;
    const productType = formData.get('productType') as string | null;
    const primaryImages = formData.getAll('primaryImages') as File[];
    const upsellImages = formData.getAll('upsellImages') as File[];

    if (!customerName || !customerEmail) {
      return NextResponse.json(
        { error: 'Customer name and email are required.' },
        { status: 400 }
      );
    }

    if (primaryImages.length === 0) {
      return NextResponse.json(
        { error: 'Please upload at least one primary image.' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        customer_name: customerName,
        customer_email: customerEmail,
        product_type: productType || null,
        status: 'ready',
        payment_status: 'unpaid',
      })
      .select('id')
      .single();

    if (orderError) {
      console.error('Order creation error:', orderError);
      return NextResponse.json(
        { error: 'Failed to create order. Please try again.' },
        { status: 500 }
      );
    }

    const orderId = order.id;

    const uploadImage = async (file: File, type: 'primary' | 'upsell') => {
      const bucket = type === 'primary' ? 'primary-images' : 'upsell-images';
      const fileName = `${orderId}/${Date.now()}-${file.name}`;

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(fileName, file);

      if (uploadError) {
        throw new Error(`Failed to upload ${type} image: ${uploadError.message}`);
      }

      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(fileName);

      const { error: dbError } = await supabase
        .from('images')
        .insert({
          order_id: orderId,
          url: publicUrl,
          storage_path: fileName,
          type,
          is_selected: false,
        });

      if (dbError) {
        throw new Error(`Failed to save ${type} image to database: ${dbError.message}`);
      }
    };

    try {
      await Promise.all([
        ...primaryImages.map((file) => uploadImage(file, 'primary')),
        ...upsellImages.map((file) => uploadImage(file, 'upsell')),
      ]);
    } catch (uploadError) {
      console.error('Image upload error:', uploadError);

      await supabase.from('orders').delete().eq('id', orderId);

      return NextResponse.json(
        { error: 'Failed to upload images. Please check your connection and try again.' },
        { status: 500 }
      );
    }

    const customerUrl = `/order/${orderId}`;

    return NextResponse.json({
      success: true,
      orderId,
      customerUrl,
    });
  } catch (error) {
    console.error('Order creation error:', error);
    return NextResponse.json(
      { error: 'Something went wrong. Please try again later.' },
      { status: 500 }
    );
  }
}
