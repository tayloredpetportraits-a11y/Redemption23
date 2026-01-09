'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check } from 'lucide-react';
import Image from 'next/image';
import type { Image as ImageType } from '@/lib/supabase/client';

interface SwipeReviewModalProps {
    images: ImageType[];
    isOpen: boolean;
    onClose: () => void;
    onReview: (imageId: string, status: 'approved' | 'rejected') => void;
    onComplete?: () => void;
}

export default function SwipeReviewModal({ images, isOpen, onClose, onReview, onComplete }: SwipeReviewModalProps) {
    // Only show pending images
    const [queue, setQueue] = useState<ImageType[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [direction, setDirection] = useState<'left' | 'right' | null>(null);

    useEffect(() => {
        if (isOpen) {
            setQueue(images.filter(img => img.status === 'pending_review'));
            setCurrentIndex(0);
            setDirection(null);
        }
    }, [isOpen, images]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!isOpen || queue.length === 0) return;

            switch (e.key.toLowerCase()) {
                case 'arrowright':
                case 'a':
                    handleSwipe('right');
                    break;
                case 'arrowleft':
                case 'x':
                    handleSwipe('left');
                    break;
                case 'escape':
                    onClose();
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, queue, currentIndex]);

    const handleSwipe = (dir: 'left' | 'right') => {
        if (direction) return; // Debounce

        setDirection(dir);
        const currentImg = queue[currentIndex];
        const status = dir === 'right' ? 'approved' : 'rejected';

        // Trigger parent review action
        onReview(currentImg.id, status);

        // Animate and move to next
        setTimeout(() => {
            setDirection(null);
            if (currentIndex < queue.length - 1) {
                setCurrentIndex(prev => prev + 1);
            } else {
                // End of queue
                if (onComplete) onComplete();
                onClose();
            }
        }, 300); // Wait for animation
    };

    if (!isOpen) return null;

    const currentImage = queue[currentIndex];

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-brand-navy/80 backdrop-blur-xl z-[100] flex items-center justify-center p-4"
            >
                <button
                    onClick={onClose}
                    className="absolute top-6 right-6 p-2 rounded-full bg-white/10 text-white/50 hover:text-white transition-colors"
                >
                    <X className="w-6 h-6" />
                </button>

                {queue.length === 0 ? (
                    <div className="text-center">
                        <h2 className="text-2xl font-bold text-white mb-2 font-playfair">All Caught Up!</h2>
                        <p className="text-brand-blue/70">No pending images to review.</p>
                    </div>
                ) : (
                    <div className="relative w-full max-w-md aspect-[3/4] perspective-1000">
                        {/* Progress Bar */}
                        <div className="absolute -top-12 inset-x-0 h-1 bg-white/20 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-brand-blue transition-all duration-300 shadow-[0_0_10px_rgba(217,225,252,0.5)]"
                                style={{ width: `${((currentIndex) / queue.length) * 100}%` }}
                            />
                        </div>

                        <div className="absolute -top-8 text-brand-blue/70 text-sm w-full text-center">
                            {currentIndex + 1} of {queue.length}
                        </div>

                        <motion.div
                            key={currentImage.id}
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{
                                scale: 1,
                                x: direction === 'left' ? -200 : direction === 'right' ? 200 : 0,
                                rotate: direction === 'left' ? -20 : direction === 'right' ? 20 : 0,
                                opacity: direction ? 0 : 1
                            }}
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            className="w-full h-full bg-white rounded-3xl overflow-hidden shadow-2xl relative border border-brand-blue/20"
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
                                <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center">
                                    <div className="border-4 border-green-500 text-green-500 font-bold text-4xl px-8 py-2 rounded-xl -rotate-12 bg-white/80 backdrop-blur-md shadow-lg">
                                        APPROVED
                                    </div>
                                </div>
                            )}
                            {direction === 'left' && (
                                <div className="absolute inset-0 bg-ros-500/20 flex items-center justify-center">
                                    <div className="border-4 border-rose-500 text-rose-500 font-bold text-4xl px-8 py-2 rounded-xl rotate-12 bg-white/80 backdrop-blur-md shadow-lg">
                                        REJECTED
                                    </div>
                                </div>
                            )}

                            {/* Info Gradient */}
                            <div className="absolute bottom-0 inset-x-0 p-8 bg-gradient-to-t from-white via-white/80 to-transparent pt-24 text-brand-navy">
                                <h3 className="text-2xl font-bold font-playfair mb-1">{currentImage.theme_name}</h3>
                                <div className="flex items-center gap-2">
                                    <span className={`px-2 py-0.5 rounded textxs font-bold uppercase tracking-wider ${currentImage.type === 'primary' ? 'bg-brand-navy/10 text-brand-navy' : 'bg-purple-100 text-purple-600'
                                        }`}>
                                        {currentImage.type}
                                    </span>
                                </div>
                            </div>
                        </motion.div>

                        {/* Controls */}
                        <div className="absolute -bottom-24 inset-x-0 flex items-center justify-center gap-6">
                            <button
                                onClick={() => handleSwipe('left')}
                                className="p-4 rounded-full bg-white border border-rose-100 text-rose-500 hover:bg-rose-500 hover:text-white hover:scale-110 transition-all shadow-xl"
                            >
                                <X className="w-8 h-8" />
                            </button>

                            <button
                                onClick={() => handleSwipe('right')}
                                className="p-4 rounded-full bg-brand-navy border border-brand-navy/50 text-white hover:bg-brand-blue hover:text-brand-navy hover:scale-110 transition-all shadow-xl"
                            >
                                <Check className="w-8 h-8" />
                            </button>
                        </div>
                    </div>
                )}
            </motion.div>
        </AnimatePresence>
    );
}
