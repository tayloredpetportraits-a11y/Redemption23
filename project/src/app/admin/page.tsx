import { createAdminClient } from '@/lib/supabase/server';
import AdminDashboard from './AdminDashboard';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const supabase = createAdminClient();

  // Fetch Orders WITH Images Relation (Explicit FK to avoid ambiguity with selected_image_id)
  const { data: orders, error: orderError } = await supabase
    .from('orders')
    .select('*, images:images!images_order_id_fkey(*)')
    .order('created_at', { ascending: false });

  if (orderError) {
    console.error("Order fetch error:", orderError);
    return <div>Error loading orders.</div>;
  }

  // Flatten images from orders for the dashboard view
  // @ts-ignore - Supabase types might not fully infer the nested images array without a generated type
  const allImages = orders?.flatMap(o => o.images || []) || [];

  return (
    <AdminDashboard
      initialOrders={orders || []}
      images={allImages}
    />
  );
}
