import { supabase } from '@/lib/supabase/client';
import type { Order, Image } from '@/lib/supabase/client';

export async function getPendingOrders(): Promise<Order[]> {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('status', 'pending')
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function getOrderById(orderId: string): Promise<Order | null> {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function getImagesByOrderId(orderId: string): Promise<Image[]> {
  const { data, error } = await supabase
    .from('images')
    .select('*')
    .eq('order_id', orderId)
    .eq('status', 'approved') // Only show approved images to customer
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function updateOrderStatus(orderId: string, status: 'ready' | 'failed'): Promise<void> {
  const { error } = await supabase
    .from('orders')
    .update({ status })
    .eq('id', orderId);

  if (error) throw error;
}

export async function updatePaymentStatus(orderId: string, paymentStatus: 'paid'): Promise<void> {
  const { error } = await supabase
    .from('orders')
    .update({ payment_status: paymentStatus })
    .eq('id', orderId);

  if (error) throw error;
}

export async function selectImage(imageId: string, orderId: string): Promise<void> {
  await supabase
    .from('images')
    .update({ is_selected: false })
    .eq('order_id', orderId)
    .eq('type', 'primary');

  const { error } = await supabase
    .from('images')
    .update({ is_selected: true })
    .eq('id', imageId);

  if (error) throw error;
}

export async function createOrder(
  customerName: string,
  customerEmail: string,
  productType: string
): Promise<string> {
  const { data, error } = await supabase
    .from('orders')
    .insert({
      customer_name: customerName,
      customer_email: customerEmail,
      product_type: productType,
      status: 'ready',
      payment_status: 'unpaid',
    })
    .select('id')
    .single();

  if (error) throw error;
  return data.id;
}

export async function uploadImage(
  file: File,
  orderId: string,
  type: 'primary' | 'upsell'
): Promise<void> {
  const bucket = type === 'primary' ? 'primary-images' : 'upsell-images';
  const fileName = `${orderId}/${Date.now()}-${file.name}`;

  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(fileName, file);

  if (uploadError) throw uploadError;

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

  if (dbError) throw dbError;
}
