'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Loader2, RefreshCw } from 'lucide-react';
import Image from 'next/image';
import type { Image as ImageType } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function AdminReviewPage() {
  const [queue, setQueue] = useState<ImageType[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState<'left' | 'right' | null>(null);
  const supabase = createClient();
  const router = useRouter();

  const fetchPendingImages = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('images')
      .select('*')
      .eq('status', 'pending_review')
      .order('created_at', { ascending: true }); // Oldest first

    if (error) {
      console.error('Error fetching images:', error);
    } else {
      setQueue(data || []);
      setCurrentIndex(0);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPendingImages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (loading || queue.length === 0) return;

      switch (e.key.toLowerCase()) {
        case 'arrowright':
        case 'a':
          handleSwipe('right');
          break;
        case 'arrowleft':
        case 'x':
          handleSwipe('left');
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, queue, currentIndex]);

  const handleSwipe = async (dir: 'left' | 'right') => {
    if (direction) return; // Debounce
    // Safety check if we ran out of images
    if (currentIndex >= queue.length) return;

    setDirection(dir);
    const currentImg = queue[currentIndex];
    const status = dir === 'right' ? 'approved' : 'rejected';

    // Optimistic UI: Move to next immediately, update in background
    const nextIndex = currentIndex + 1;

    // Perform Update
    const { error } = await supabase
      .from('images')
      .update({ status: status })
      .eq('id', currentImg.id);

    if (error) {
      console.error('Failed to update status:', error);
      // Ideally revert UI state here, but for now we log
      alert('Failed to update image status');
      setDirection(null);
      return;
    }

    // Animate and move to next
    setTimeout(() => {
      setDirection(null);
      setCurrentIndex(nextIndex);

      // If we are at the end, maybe refresh to see if new ones came in?
      // Or just show "Done" state
    }, 300);
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-zinc-950">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
      </div>
    );
  }

  // Logic for "No more items"
  if (currentIndex >= queue.length) {
    return (
      <div className="flex flex-col h-screen items-center justify-center bg-zinc-950 text-zinc-200">
        <div className="w-24 h-24 mb-6 rounded-full bg-zinc-900/50 flex items-center justify-center border border-zinc-800">
          <Check className="w-10 h-10 text-green-500" />
        </div>
        <h1 className="text-3xl font-bold font-playfair mb-2">All Caught Up!</h1>
        <p className="text-zinc-500 mb-8">No more pending images directly in the queue.</p>
        <div className="flex gap-4">
          <button
            onClick={fetchPendingImages}
            className="flex items-center gap-2 px-6 py-3 bg-zinc-900 hover:bg-zinc-800 rounded-lg transition-colors border border-zinc-800"
          >
            <RefreshCw className="w-4 h-4" />
            Check Again
          </button>
          <button
            onClick={() => router.push('/admin/orders')}
            className="px-6 py-3 bg-amber-600 hover:bg-amber-500 text-white rounded-lg transition-colors font-medium"
          >
            Back to Orders
          </button>
        </div>
      </div>
    );
  }

  const currentImage = queue[currentIndex];

  // Safety check just in case
  if (!currentImage) return null;

  // For progress bar
  const progress = Math.min(100, (currentIndex / queue.length) * 100);

  return (
    <div className="flex flex-col h-screen items-center justify-center bg-zinc-950 overflow-hidden relative">
      <div className="absolute top-8 left-8 z-50">
        <button
          onClick={() => router.push('/admin/orders')}
          className="text-zinc-500 hover:text-white transition-colors"
        >
          &larr; Back to Orders
        </button>
      </div>

      <div className="relative w-full max-w-md aspect-[3/4] perspective-1000">
        {/* Progress Bar */}
        <div className="absolute -top-12 inset-x-0 h-1 bg-zinc-800 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-amber-500"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>

        <div className="absolute -top-8 text-zinc-500 text-sm w-full text-center">
          Image {currentIndex + 1} of {queue.length}
        </div>

        <AnimatePresence>
          <motion.div
            key={currentImage.id} // use unique key to force re-render/animate on change? 
            // Actually, since we keep the same container and just swipe it away, 
            // we need to be careful. The "swiped away" one needs to animate out, 
            // and the *next* one needs to be visible behind it?
            // Simple "stack" approach: Render current on top.
            // But sticking to the specific requested logic:
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{
              scale: 1,
              x: direction === 'left' ? -200 : direction === 'right' ? 200 : 0,
              rotate: direction === 'left' ? -20 : direction === 'right' ? 20 : 0,
              opacity: direction ? 0 : 1
            }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="w-full h-full bg-zinc-900 rounded-3xl overflow-hidden shadow-2xl relative border border-zinc-800"
          >
            <Image
              src={currentImage.url}
              alt="Candidate"
              fill
              className="object-cover"
              priority
            />

            {/* Overlays for Swipe */}
            {direction === 'right' && (
              <div className="absolute inset-0 bg-green-500/20 z-10 flex items-center justify-center">
                <div className="border-4 border-green-500 text-green-500 font-bold text-4xl px-8 py-2 rounded-xl -rotate-12 bg-black/50 backdrop-blur-md shadow-lg">
                  APPROVED
                </div>
              </div>
            )}
            {direction === 'left' && (
              <div className="absolute inset-0 bg-rose-500/20 z-10 flex items-center justify-center">
                <div className="border-4 border-rose-500 text-rose-500 font-bold text-4xl px-8 py-2 rounded-xl rotate-12 bg-black/50 backdrop-blur-md shadow-lg">
                  REJECTED
                </div>
              </div>
            )}

            {/* Info Gradient */}
            <div className="absolute bottom-0 inset-x-0 p-8 bg-gradient-to-t from-black/90 via-black/60 to-transparent pt-32 text-white">
              <h3 className="text-2xl font-bold font-playfair mb-1">{currentImage.theme_name || 'Untitled'}</h3>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${currentImage.type === 'primary' ? 'bg-amber-500/20 text-amber-500' : 'bg-purple-500/20 text-purple-400'
                  }`}>
                  {currentImage.type}
                </span>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Controls */}
        <div className="absolute -bottom-24 inset-x-0 flex items-center justify-center gap-6">
          <button
            onClick={() => handleSwipe('left')}
            className="p-4 rounded-full bg-zinc-900 border border-zinc-800 text-rose-500 hover:bg-rose-500 hover:text-white hover:scale-110 transition-all shadow-xl"
          >
            <X className="w-8 h-8" />
          </button>

          <button
            onClick={() => handleSwipe('right')}
            className="p-4 rounded-full bg-zinc-900 border border-zinc-800 text-green-500 hover:bg-green-500 hover:text-white hover:scale-110 transition-all shadow-xl"
          >
            <Check className="w-8 h-8" />
          </button>
        </div>

        {/* Keyboard hints */}
        <div className="absolute top-full mt-4 w-full text-center text-zinc-600 text-xs">
          Shortcuts: Left Arrow / Right Arrow
        </div>
      </div>
    </div>
  );
}
