'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SwipeCard from '@/components/SwipeCard';
import { getPendingOrders, getImagesByOrderId, updateOrderStatus } from '@/lib/api/orders';
import type { Order, Image } from '@/lib/supabase/client';

interface OrderWithImages {
  order: Order;
  primaryImage: Image | null;
  aiResultImage: Image | null;
}

export default function ReviewQueuePage() {
  const [ordersWithImages, setOrdersWithImages] = useState<OrderWithImages[]>([]);
  const [allOrders, setAllOrders] = useState<OrderWithImages[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [showOnlySocialApproved, setShowOnlySocialApproved] = useState(false);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      const orders = await getPendingOrders();
      const withImages = await Promise.all(
        orders.map(async (order) => {
          const images = await getImagesByOrderId(order.id);
          const primaryImage = images.find((img) => img.type === 'primary') || null;
          const aiResultImage = images.find((img) => img.type === 'upsell') || null;
          return { order, primaryImage, aiResultImage };
        })
      );
      setAllOrders(withImages);
      applyFilter(withImages, showOnlySocialApproved);
    } catch (error) {
      showToast('Failed to load orders', 'error');
    } finally {
      setLoading(false);
    }
  };

  const applyFilter = (orders: OrderWithImages[], socialOnly: boolean) => {
    if (socialOnly) {
      setOrdersWithImages(orders.filter((o) => o.order.social_consent));
    } else {
      setOrdersWithImages(orders);
    }
    setCurrentIndex(0);
  };

  useEffect(() => {
    applyFilter(allOrders, showOnlySocialApproved);
  }, [showOnlySocialApproved]);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleApprove = async () => {
    const currentOrder = ordersWithImages[currentIndex];
    try {
      await updateOrderStatus(currentOrder.order.id, 'ready');
      showToast('Order approved', 'success');
      moveToNext();
    } catch (error) {
      showToast('Failed to approve order', 'error');
    }
  };

  const handleReject = async () => {
    const currentOrder = ordersWithImages[currentIndex];
    try {
      await updateOrderStatus(currentOrder.order.id, 'failed');
      showToast('Order rejected', 'success');
      moveToNext();
    } catch (error) {
      showToast('Failed to reject order', 'error');
    }
  };

  const moveToNext = () => {
    setCurrentIndex((prev) => prev + 1);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (currentIndex >= ordersWithImages.length) return;

      if (e.key === 'ArrowRight' || e.key === 'y' || e.key === 'Y') {
        handleApprove();
      } else if (e.key === 'ArrowLeft' || e.key === 'n' || e.key === 'N') {
        handleReject();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, ordersWithImages]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-[#7C3AED] border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-zinc-400">Loading orders...</p>
        </div>
      </div>
    );
  }

  const currentOrder = ordersWithImages[currentIndex];
  const hasOrders = ordersWithImages.length > 0;
  const isComplete = currentIndex >= ordersWithImages.length;

  return (
    <div className="min-h-screen px-4 py-12">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center space-y-4">
          <h1>Review Queue</h1>
          {hasOrders && !isComplete && (
            <p className="text-zinc-400">
              {currentIndex + 1} of {ordersWithImages.length} orders
            </p>
          )}
          <div className="flex items-center justify-center gap-3">
            <label className="flex items-center gap-2 px-4 py-2 rounded-lg bg-zinc-800/50 border border-zinc-700 hover:border-zinc-600 transition-colors cursor-pointer">
              <input
                type="checkbox"
                checked={showOnlySocialApproved}
                onChange={(e) => setShowOnlySocialApproved(e.target.checked)}
                className="w-4 h-4 rounded border-zinc-700 bg-zinc-900 text-green-500 focus:ring-green-500 focus:ring-offset-0"
              />
              <span className="text-sm text-zinc-300">Show only social-approved orders</span>
            </label>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {isComplete ? (
            <motion.div
              key="complete"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="glass-card p-12 rounded-lg text-center space-y-4"
            >
              <div className="text-6xl">🎉</div>
              <h2>All Done!</h2>
              <p className="text-zinc-400">
                You've reviewed all pending orders. Great work!
              </p>
              <button
                onClick={() => {
                  setCurrentIndex(0);
                  loadOrders();
                }}
                className="btn-primary rounded-lg"
              >
                Refresh Queue
              </button>
            </motion.div>
          ) : currentOrder ? (
            <motion.div
              key={currentOrder.order.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
            >
              <SwipeCard
                order={currentOrder.order}
                primaryImage={currentOrder.primaryImage}
                aiResultImage={currentOrder.aiResultImage}
                onApprove={handleApprove}
                onReject={handleReject}
              />
            </motion.div>
          ) : null}
        </AnimatePresence>

        {!isComplete && hasOrders && (
          <div className="text-center text-sm text-zinc-500">
            <p>Swipe right or press Y to approve</p>
            <p>Swipe left or press N to reject</p>
          </div>
        )}
      </div>

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className={`fixed bottom-8 left-1/2 -translate-x-1/2 px-6 py-3 rounded-lg ${
              toast.type === 'success'
                ? 'bg-green-500/20 border border-green-500/50 text-green-400'
                : 'bg-red-500/20 border border-red-500/50 text-red-400'
            }`}
          >
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
