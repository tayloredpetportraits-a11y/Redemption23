import { notFound } from 'next/navigation';
import { getOrderById, getImagesByOrderId } from '@/lib/api/orders';
import OrderPage from '@/components/OrderPage';

export default async function CustomerOrderPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = await params;
  const order = await getOrderById(orderId);

  if (!order) {
    notFound();
  }

  const images = await getImagesByOrderId(orderId);
  const primaryImages = images.filter((img) => img.type === 'primary');
  const upsellImages = images.filter((img) => img.type === 'upsell');

  return (
    <OrderPage
      order={order}
      primaryImages={primaryImages}
      upsellImages={upsellImages}
    />
  );
}
