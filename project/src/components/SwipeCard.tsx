'use client';

// useState and useRef removed
import { motion, useMotionValue, useTransform } from 'framer-motion';
import { Check, X, Instagram, Lock } from 'lucide-react';
import Image from 'next/image';
import type { Order, Image as ImageType } from '@/lib/supabase/client';

interface SwipeCardProps {
  order: Order;
  primaryImage: ImageType | null;
  aiResultImage: ImageType | null;
  onApprove: () => void;
  onReject: () => void;
}

export default function SwipeCard({
  order,
  primaryImage,
  aiResultImage,
  onApprove,
  onReject,
}: SwipeCardProps) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-25, 25]);
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0, 1, 1, 1, 0]);

  const handleDragEnd = (_event: unknown, info: { offset: { x: number } }) => {
    if (Math.abs(info.offset.x) > 150) {
      if (info.offset.x > 0) {
        onApprove();
      } else {
        onReject();
      }
    }
  };

  return (
    <motion.div
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      style={{ x, rotate, opacity }}
      onDragEnd={handleDragEnd}
      className="glass-card p-6 rounded-lg cursor-grab active:cursor-grabbing"
    >
      <div className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-2xl">{order.customer_name}</h3>
              <p className="text-zinc-400">{order.customer_email}</p>
              <p className="text-zinc-500">Product: {order.product_type}</p>
            </div>
            <div className="flex flex-col gap-2">
              {order.social_consent ? (
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-500/10 border border-green-500/20 rounded-full text-green-400 text-sm whitespace-nowrap">
                  <Check className="w-3 h-3" />
                  Social Approved
                </div>
              ) : (
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-zinc-700/30 border border-zinc-700 rounded-full text-zinc-500 text-sm whitespace-nowrap">
                  <Lock className="w-3 h-3" />
                  Private
                </div>
              )}
              {order.social_handle && (
                <div className="inline-flex items-center gap-1 px-3 py-1 bg-purple-500/10 border border-purple-500/20 rounded-full text-purple-400 text-xs whitespace-nowrap">
                  <Instagram className="w-3 h-3" />
                  {order.social_handle}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <p className="text-sm text-zinc-400">Original Photo</p>
            {primaryImage ? (
              <div className="relative aspect-square rounded-lg overflow-hidden bg-zinc-800/50">
                <Image
                  src={primaryImage.url}
                  alt="Original"
                  fill
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="aspect-square rounded-lg bg-zinc-800/50 flex items-center justify-center">
                <p className="text-zinc-600">No image</p>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <p className="text-sm text-zinc-400">AI Result</p>
            {aiResultImage ? (
              <div className="relative aspect-square rounded-lg overflow-hidden bg-zinc-800/50">
                <Image
                  src={aiResultImage.url}
                  alt="AI Result"
                  fill
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="aspect-square rounded-lg bg-zinc-800/50 flex items-center justify-center">
                <p className="text-zinc-600">No image</p>
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-4 pt-4">
          <button
            onClick={onReject}
            className="flex-1 px-6 py-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 transition-colors flex items-center justify-center gap-2"
          >
            <X className="w-5 h-5" />
            Reject
          </button>
          <button
            onClick={onApprove}
            className="flex-1 px-6 py-3 rounded-lg bg-green-500/10 border border-green-500/30 text-green-400 hover:bg-green-500/20 transition-colors flex items-center justify-center gap-2"
          >
            <Check className="w-5 h-5" />
            Approve
          </button>
        </div>
      </div>
    </motion.div>
  );
}
