'use client';

import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { X, ChevronLeft, ChevronRight, Download } from 'lucide-react';
import { useEffect } from 'react';

interface ImageLightboxProps {
  images: Array<{ id: string; url: string }>;
  currentIndex: number;
  onClose: () => void;
  onNavigate: (direction: 'prev' | 'next') => void;
  onDownload: (imageId: string) => void;
}

export default function ImageLightbox({
  images,
  currentIndex,
  onClose,
  onNavigate,
  onDownload,
}: ImageLightboxProps) {
  const currentImage = images[currentIndex];

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') onNavigate('prev');
      if (e.key === 'ArrowRight') onNavigate('next');
    };

    window.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'auto';
    };
  }, [onClose, onNavigate]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm flex items-center justify-center"
        onClick={onClose}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-50 p-2 rounded-full bg-zinc-900/80 hover:bg-zinc-800 transition-colors"
        >
          <X className="w-6 h-6 text-zinc-100" />
        </button>

        {images.length > 1 && (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onNavigate('prev');
              }}
              className="absolute left-4 z-50 p-3 rounded-full bg-zinc-900/80 hover:bg-zinc-800 transition-colors"
              disabled={currentIndex === 0}
            >
              <ChevronLeft className="w-6 h-6 text-zinc-100" />
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                onNavigate('next');
              }}
              className="absolute right-4 z-50 p-3 rounded-full bg-zinc-900/80 hover:bg-zinc-800 transition-colors"
              disabled={currentIndex === images.length - 1}
            >
              <ChevronRight className="w-6 h-6 text-zinc-100" />
            </button>
          </>
        )}

        <motion.div
          key={currentImage.id}
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="relative max-w-7xl max-h-[90vh] w-full mx-4"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="relative aspect-square w-full">
            <Image
              src={currentImage.url}
              alt={`Portrait ${currentIndex + 1}`}
              fill
              className="object-contain"
              priority
            />
          </div>

          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6 flex items-center justify-between">
            <div className="text-zinc-100">
              <p className="text-sm text-zinc-400">
                {currentIndex + 1} of {images.length}
              </p>
            </div>

            <button
              onClick={() => onDownload(currentImage.id)}
              className="btn-amber flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Download HD
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
