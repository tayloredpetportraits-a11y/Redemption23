'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { Check, X, Undo, RefreshCw, Star } from 'lucide-react';
import Image from 'next/image';
import type { Image as ImageType } from '@/lib/supabase/client';
import { regenerateImageAction } from './actions';

interface ReviewDeckProps {
    images: ImageType[];
    onApprove: (id: string) => void;
    onReject: (id: string) => void;
    loading: boolean;
}

export default function ReviewDeck({ images, onApprove, onReject, loading }: ReviewDeckProps) {
    const [index, setIndex] = useState(0);
    const [history, setHistory] = useState<string[]>([]); // Keep track of swiped IDs for undo (optional)
    const [direction, setDirection] = useState<'left' | 'right' | null>(null);
    const [isRegenerating, setIsRegenerating] = useState(false);

    // Local state to support in-place updates (e.g. regeneration)
    const [localImages, setLocalImages] = useState(images);

    useEffect(() => {
        setLocalImages(images);
    }, [images]);

    // If queue is empty
    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen bg-zinc-950 text-white">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-blue"></div>
            </div>
        );
    }

    if (index >= localImages.length) {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-zinc-950 text-white p-8 text-center space-y-6">
                <div className="bg-green-500/10 p-6 rounded-full">
                    <Check className="w-16 h-16 text-green-500" />
                </div>
                <h2 className="text-3xl font-bold font-playfair">All Caught Up!</h2>
                <p className="text-zinc-400 max-w-md">
                    You&apos;ve reviewed all pending images. Great job clearing the queue.
                </p>
                <button
                    onClick={() => window.location.reload()}
                    className="flex items-center gap-2 px-6 py-3 bg-zinc-800 rounded-full hover:bg-zinc-700 transition"
                >
                    <RefreshCw className="w-4 h-4" />
                    Check for New
                </button>
            </div>
        );
    }

    const currentImage = localImages[index];
    const progress = Math.min(((index) / localImages.length) * 100, 100);

    const handleSwipe = (dir: 'left' | 'right') => {
        setDirection(dir);
        // Delay actual action to allow animation
        setTimeout(() => {
            if (dir === 'right') {
                onApprove(currentImage.id);
            } else {
                onReject(currentImage.id);
            }
            setHistory([...history, currentImage.id]);
            setIndex(prev => prev + 1);
            setDirection(null);
        }, 200);
    };

    const handleRegenerate = async () => {
        if (isRegenerating) return;
        setIsRegenerating(true);

        try {
            const res = await regenerateImageAction(currentImage.id);
            if (res.success && res.newImage) {
                // Update local state with new URL to show it immediately
                const updated = [...localImages];
                updated[index] = {
                    ...updated[index],
                    url: res.newImage.url,
                    created_at: new Date().toISOString() // Force refresh
                };
                setLocalImages(updated);
            } else {
                alert("Failed to regenerate");
            }
        } catch (e) {
            console.error(e);
            alert("Error regenerating");
        } finally {
            setIsRegenerating(false);
        }
    };

    return (
        <div className="relative flex flex-col items-center justify-center h-screen bg-zinc-950 overflow-hidden">
            {/* Header / Progress */}
            <div className="absolute top-0 w-full z-10 p-6 flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent">
                <div>
                    <h1 className="text-white font-playfair text-xl font-bold">Review Queue</h1>
                    <p className="text-zinc-400 text-xs mt-1">
                        {localImages.length - index} remaining • Order #{currentImage.order_id?.slice(0, 8)}
                    </p>
                </div>
                <div className="w-1/3 max-w-[200px] h-2 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-brand-blue transition-all duration-300"
                        style={{ width: `${progress}%` }}
                    />
                </div>
            </div>

            {/* Card Stack */}
            <div className="relative w-full max-w-md aspect-[3/4] flex items-center justify-center">
                <AnimatePresence>
                    {localImages.slice(index, index + 2).reverse().map((img, i) => {
                        const isCurrent = img.id === currentImage.id;
                        return (
                            <Card
                                key={`${img.id}-${img.created_at}`} // Force re-render on regen
                                image={img}
                                isCurrent={isCurrent}
                                onSwipe={handleSwipe}
                                direction={direction}
                            />
                        );
                    })}
                </AnimatePresence>

                {isRegenerating && (
                    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm rounded-2xl">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
                    </div>
                )}
            </div>

            {/* Controls */}
            <div className="absolute bottom-10 flex items-center gap-8 z-20">
                <button
                    onClick={() => handleSwipe('left')}
                    className="p-4 rounded-full bg-zinc-900 border border-zinc-800 text-rose-500 hover:scale-110 active:scale-95 transition-all shadow-xl hover:bg-rose-950/20"
                >
                    <X className="w-8 h-8" />
                </button>

                <button
                    onClick={handleRegenerate}
                    disabled={isRegenerating}
                    className="p-3 rounded-full bg-zinc-900 border border-zinc-800 text-amber-400 hover:text-white hover:bg-zinc-800 hover:scale-105 transition-all shadow-lg"
                    title="Regenerate"
                >
                    <RefreshCw className={`w-5 h-5 ${isRegenerating ? 'animate-spin' : ''}`} />
                </button>

                <button
                    onClick={() => handleSwipe('right')}
                    className="p-4 rounded-full bg-brand-blue text-white hover:scale-110 active:scale-95 transition-all shadow-xl shadow-brand-blue/20"
                >
                    <Check className="w-8 h-8" />
                </button>
            </div>

            <p className="absolute bottom-4 text-zinc-600 text-xs">
                Press <span className="font-mono text-zinc-400">←</span> to Reject, <span className="font-mono text-zinc-400">→</span> to Approve
            </p>
        </div>
    );
}

function Card({ image, isCurrent, onSwipe, direction }: { image: ImageType, isCurrent: boolean, onSwipe: (d: 'left' | 'right') => void, direction: 'left' | 'right' | null }) {
    const x = useMotionValue(0);
    const rotate = useTransform(x, [-200, 200], [-25, 25]);
    const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0, 1, 1, 1, 0]);

    // Keyboard support
    useEffect(() => {
        if (!isCurrent) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowLeft') onSwipe('left');
            if (e.key === 'ArrowRight') onSwipe('right');
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isCurrent, onSwipe]);

    const handleDragEnd = (_: any, info: any) => {
        if (info.offset.x > 100) {
            onSwipe('right');
        } else if (info.offset.x < -100) {
            onSwipe('left');
        }
    };

    return (
        <motion.div
            style={{
                x: isCurrent ? x : 0,
                rotate: isCurrent ? rotate : 0,
                opacity: isCurrent ? opacity : 1, // Only fade out if current card being swiped
                zIndex: isCurrent ? 10 : 0,
                scale: isCurrent ? 1 : 0.95,
                y: isCurrent ? 0 : -20,
            }}
            drag={isCurrent ? "x" : false}
            dragConstraints={{ left: 0, right: 0 }}
            onDragEnd={handleDragEnd}
            animate={isCurrent && direction ? { x: direction === 'right' ? 500 : -500, opacity: 0 } : {}}
            className="absolute w-full h-full rounded-2xl overflow-hidden shadow-2xl border border-zinc-800 bg-zinc-900 cursor-grab active:cursor-grabbing"
        >
            <Image
                src={image.url}
                alt="Review"
                fill
                className="object-cover pointer-events-none"
                sizes="500px"
                priority={isCurrent}
            />

            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent pointer-events-none" />

            {/* Info */}
            <div className="absolute bottom-0 w-full p-6 text-white pointer-events-none">
                <div className="flex items-center gap-2 mb-2">
                    <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${image.is_bonus ? 'bg-purple-500/20 text-purple-300 border border-purple-500/50' : 'bg-brand-blue/20 text-blue-300 border border-brand-blue/50'}`}>
                        {image.is_bonus ? 'Upsell Theme' : 'Primary Theme'}
                    </span>
                    <span className="text-xs text-zinc-400 font-mono">
                        {image.theme_name || 'Generic'}
                    </span>
                </div>
                {image.prompt && (
                    <p className="text-xs text-zinc-500 line-clamp-2">
                        {/* Mock prompt display or real if available */}
                        Prompt: {image.prompt || "No prompt data available"}
                    </p>
                )}
            </div>

            {/* Swipe Indicators */}
            {isCurrent && (
                <>
                    <motion.div
                        style={{ opacity: useTransform(x, [20, 100], [0, 1]) }}
                        className="absolute top-8 left-8 -rotate-12 border-4 border-green-500 rounded-lg px-4 py-2 text-green-500 font-bold text-2xl uppercase tracking-widest bg-black/20 backdrop-blur-sm"
                    >
                        Approve
                    </motion.div>
                    <motion.div
                        style={{ opacity: useTransform(x, [-100, -20], [1, 0]) }}
                        className="absolute top-8 right-8 rotate-12 border-4 border-rose-500 rounded-lg px-4 py-2 text-rose-500 font-bold text-2xl uppercase tracking-widest bg-black/20 backdrop-blur-sm"
                    >
                        Reject
                    </motion.div>
                </>
            )}
        </motion.div>
    );
}

