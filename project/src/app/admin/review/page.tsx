'use client';

import { useState, useEffect } from 'react';
// import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, Grid, Maximize2, CheckCheck } from 'lucide-react';
import Image from 'next/image';
import type { Image as ImageType, Order } from '@/lib/supabase/client';

export default function ReviewPage() {
  const [loading, setLoading] = useState(true);
  // const [ordersWithPending, setOrdersWithPending] = useState<Order[]>([]);
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);
  const [pendingImages, setPendingImages] = useState<ImageType[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [viewMode, setViewMode] = useState<'grid' | 'swipe'>('grid');

  useEffect(() => {
    loadPendingWork();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only active if we have images and aren't loading
      if (loading || pendingImages.length === 0) return;

      switch (e.key.toLowerCase()) {
        case 'arrowright':
        case 'a':
          handleDecision('approve');
          break;
        case 'arrowleft':
        case 'x':
          handleDecision('reject');
          break;
        // Optional: Add space to skip/next if needed, but approve/reject moves widely enough
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [loading, pendingImages, currentImageIndex]); // Re-bind when state changes to avoid stale closures

  const loadPendingWork = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/review-queue');
      const data = await res.json();
      if (!res.ok) {
        console.error('Review queue error:', data.error);
        setLoading(false);
        return;
      }

      const { orders = [], images = [] } = data;

      if (!orders || orders.length === 0) {
        // setOrdersWithPending([]);
        setCurrentOrder(null);
        setLoading(false);
        return;
      }

      // setOrdersWithPending(orders);
      selectOrder(orders[0], images.filter((img: ImageType) => img.order_id === orders[0].id));
    } catch (e) {
      console.error("Failed to load queue", e);
    } finally {
      setLoading(false);
    }
  };

  const selectOrder = (order: Order, images?: ImageType[]) => {
    setCurrentOrder(order);
    if (images) {
      setPendingImages(images);
    }
    setCurrentImageIndex(0);
    setViewMode('grid'); // Default to grid for overview
  };

  const handleDecision = async (decision: 'approve' | 'reject', imageId?: string) => {
    const idToUpdate = imageId || pendingImages[currentImageIndex]?.id;
    if (!idToUpdate) return;

    const newStatus = decision === 'approve' ? 'approved' : 'rejected';

    // Optimistic UI update
    setPendingImages(prev => prev.filter(img => img.id !== idToUpdate));

    await fetch('/api/admin/review-queue', {
      method: 'POST',
      body: JSON.stringify({ imageId: idToUpdate, status: newStatus })
    });

    // If swiping, move to next index automatically (handled by list shrinking)
    if (viewMode === 'swipe' && pendingImages.length <= 1) {
      // Last image handled
      checkNextOrder();
    }
  };

  const approveAll = async () => {
    if (!pendingImages.length) return;
    const ids = pendingImages.map(img => img.id);
    setPendingImages([]); // Clear UI immediately

    await Promise.all(ids.map(id =>
      fetch('/api/admin/review-queue', {
        method: 'POST',
        body: JSON.stringify({ imageId: id, status: 'approved' })
      })
    ));
    checkNextOrder();
  };

  const checkNextOrder = () => {
    // Simple reload to fetch next order
    loadPendingWork();
  };

  // ... (Header and loading states similar to before)

  if (loading) return <div className="min-h-screen grid place-items-center text-zinc-500">Loading...</div>;

  if (!currentOrder || pendingImages.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center space-y-4">
        <h1 className="text-2xl font-bold text-zinc-100">All Caught Up! 🎉</h1>
        <button onClick={loadPendingWork} className="btn-secondary">Refresh Queue</button>
        {/* Testing buttons ... */}
        <div className="pt-8 border-t border-zinc-800 flex flex-col items-center gap-2">
          <h3 className="text-zinc-500 text-sm">Testing Tools</h3>
          <div className="flex gap-2">
            <button
              onClick={() => fetch('/api/admin/seed', { method: 'POST', body: JSON.stringify({ theme: 'royalty' }) }).then(loadPendingWork)}
              className="px-4 py-2 bg-amber-500/10 text-amber-500 rounded hover:bg-amber-500/20 text-sm"
            >+ Test Royalty Order</button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-zinc-800 bg-zinc-900/80 backdrop-blur flex justify-between items-center z-10 sticky top-0">
        <div className="flex items-center gap-4">
          {currentOrder.pet_image_url && (
            <div className="w-12 h-12 relative rounded-full overflow-hidden border border-zinc-700">
              <Image src={currentOrder.pet_image_url} alt="Pet" fill className="object-cover" unoptimized />
            </div>
          )}
          <div>
            <h2 className="font-bold text-zinc-100">{currentOrder.customer_name}</h2>
            <div className="flex gap-2 text-xs">
              <span className="text-zinc-500">{currentOrder.pet_name || 'Pet Swap'}</span>
              <span className="text-zinc-600">•</span>
              <span className="text-amber-500">{currentOrder.product_type}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded ${viewMode === 'grid' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
          >
            <Grid className="w-5 h-5" />
          </button>
          <button
            onClick={() => setViewMode('swipe')}
            className={`p-2 rounded ${viewMode === 'swipe' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
          >
            <Maximize2 className="w-5 h-5" />
          </button>

          <div className="h-6 w-px bg-zinc-800 mx-2" />

          <button onClick={approveAll} className="flex items-center gap-2 px-4 py-2 bg-green-500/10 text-green-500 hover:bg-green-500/20 rounded-lg text-sm font-medium transition-colors">
            <CheckCheck className="w-4 h-4" />
            Approve All
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {/* Reference Card */}
            {currentOrder.pet_image_url && (
              <div className="aspect-[3/4] rounded-xl overflow-hidden relative ring-2 ring-blue-500/50 group">
                <Image src={currentOrder.pet_image_url} alt="Reference" fill className="object-cover" unoptimized />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <span className="px-3 py-1 bg-blue-500 text-white text-xs font-bold rounded-full">Source Pet</span>
                </div>
              </div>
            )}

            {/* Candidates */}
            {pendingImages.map(img => (
              <div key={img.id} className="aspect-[3/4] rounded-xl overflow-hidden relative group ring-1 ring-zinc-800 hover:ring-amber-500 transition-all">
                <Image src={img.url} alt="Candidate" fill className="object-cover" />
                <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/90 to-transparent">
                  <p className="text-xs text-white font-medium truncate">{img.theme_name || img.type}</p>
                </div>

                {/* Quick Actions */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 backdrop-blur-sm">
                  <button onClick={() => handleDecision('reject', img.id)} className="p-3 rounded-full bg-red-500/20 text-red-500 hover:bg-red-500 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
                  <button onClick={() => handleDecision('approve', img.id)} className="p-3 rounded-full bg-green-500/20 text-green-500 hover:bg-green-500 hover:text-white transition-colors"><Check className="w-5 h-5" /></button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="h-full flex items-center justify-center gap-8">
            {/* Reference (Sidebar) */}
            {currentOrder.pet_image_url && (
              <div className="hidden lg:block w-64 aspect-[3/4] rounded-2xl overflow-hidden relative ring-1 ring-zinc-700 shadow-xl opacity-50 hover:opacity-100 transition-opacity">
                <Image src={currentOrder.pet_image_url} alt="Reference" fill className="object-cover" unoptimized />
                <div className="absolute top-4 left-4 px-2 py-1 bg-black/60 text-white text-xs rounded">Original</div>
              </div>
            )}

            {/* Swipe Card */}
            <div className="relative w-full max-w-md aspect-[3/4] bg-zinc-900 rounded-2xl overflow-hidden shadow-2xl ring-1 ring-zinc-800">
              {pendingImages[currentImageIndex] && (
                <>
                  <Image src={pendingImages[currentImageIndex].url} alt="Candidate" fill className="object-cover" />
                  <div className="absolute bottom-0 inset-x-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
                    <h3 className="text-xl font-bold text-white">{pendingImages[currentImageIndex].theme_name}</h3>
                    <p className="text-zinc-400 text-sm capitalize">{pendingImages[currentImageIndex].type} Generation</p>
                  </div>
                </>
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-4">
              <button onClick={() => handleDecision('approve')} className="p-4 rounded-full bg-green-500/10 text-green-500 hover:bg-green-500 hover:text-white"><Check className="w-8 h-8" /></button>
              <button onClick={() => handleDecision('reject')} className="p-4 rounded-full bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white"><X className="w-8 h-8" /></button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
