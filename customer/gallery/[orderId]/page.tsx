import { notFound } from 'next/navigation';
import { getOrderById, getImagesByOrderId } from '@/lib/api/orders';
import CustomerGallery from '@/components/CustomerGallery';

interface PageProps {
  params: Promise<{ orderId: string }>;
}

export default async function CustomerGalleryPage({ params }: PageProps) {
  const { orderId } = await params;

  const order = await getOrderById(orderId);
  if (!order) {
    notFound();
  }

  const images = await getImagesByOrderId(orderId);
  const baseImages = images.filter((img) => img.type === 'primary');
  const bonusImages = images.filter((img) => img.type === 'upsell');

  return (
    <CustomerGallery
      order={order}
      baseImages={baseImages}
      bonusImages={bonusImages}
    />
  );
}
