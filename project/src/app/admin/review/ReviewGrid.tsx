'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Check, X, Loader2, Maximize2, XCircle,
    ChevronLeft, ChevronRight, CheckCircle, MoreHorizontal
} from 'lucide-react';
import Image from 'next/image';
import type { Image as ImageType } from '@/lib/supabase/client';

interface ReviewGridProps {
    images: ImageType[];
    onApprove: (ids: string[]) => void;
    onReject: (id: string) => void;
    loading: boolean;
}

// Group interface
interface OrderGroup {
    orderId: string;
    primaryImage: ImageType | null;
    bonusImages: ImageType[];
    allImages: ImageType[];
}

export default function ReviewGrid({ images, onApprove, onReject, loading }: ReviewGridProps) {
    const [groups, setGroups] = useState<OrderGroup[]>([]);
    const [selectedGroups, setSelectedGroups] = useState<Set<string>>(new Set());
    const [focusedImage, setFocusedImage] = useState<ImageType | null>(null);
    const [focusIndex, setFocusIndex] = useState(0);

    // Group images by Order
    useEffect(() => {
        const grouped: Record<string, OrderGroup> = {};

        images.forEach(img => {
            const oid = img.order_id || 'unknown';
            if (!grouped[oid]) {
                grouped[oid] = {
                    orderId: oid,
                    primaryImage: null,
                    bonusImages: [],
                    allImages: []
                };
            }

            grouped[oid].allImages.push(img);
            if (img.type === 'primary' && !img.is_bonus) {
                grouped[oid].primaryImage = img;
            } else {
                grouped[oid].bonusImages.push(img);
            }
        });

        // Ensure every group has a primary to show (fallback to first)
        const list = Object.values(grouped).map(g => {
            if (!g.primaryImage && g.allImages.length > 0) {
                g.primaryImage = g.allImages[0];
            }
            return g;
        });

        setGroups(list);
    }, [images]);

    // Focus Mode Logic
    const openFocus = (image: ImageType) => {
        const idx = images.findIndex(i => i.id === image.id);
        setFocusIndex(idx);
        setFocusedImage(image);
    };

    const handleNextFocus = () => {
        if (focusIndex < images.length - 1) {
            const nextIdx = focusIndex + 1;
            setFocusIndex(nextIdx);
            setFocusedImage(images[nextIdx]);
        } else {
            setFocusedImage(null); // Close if at end
        }
    };

    const handlePrevFocus = () => {
        if (focusIndex > 0) {
            const prevIdx = focusIndex - 1;
            setFocusIndex(prevIdx);
            setFocusedImage(images[prevIdx]);
        }
    };

    // Keyboard Shortcuts
    useEffect(() => {
        if (!focusedImage) return;

        const handleKeys = (e: KeyboardEvent) => {
            if (e.key === 'ArrowRight') {
                // Approve and Next
                onApprove([focusedImage.id]);
                handleNextFocus();
            } else if (e.key === 'ArrowLeft') {
                // Reject
                onReject(focusedImage.id);
                // Optionally move next or stay? Let's move next for speed
                handleNextFocus();
            } else if (e.key === 'Escape') {
                setFocusedImage(null);
            }
        };

        window.addEventListener('keydown', handleKeys);
        return () => window.removeEventListener('keydown', handleKeys);
    }, [focusedImage, focusIndex, images]); // Deps need to be correct for stable callbacks

    const toggleSelectGroup = (orderId: string) => {
        const newSet = new Set(selectedGroups);
        if (newSet.has(orderId)) {
            newSet.delete(orderId);
        } else {
            newSet.add(orderId);
        }
        setSelectedGroups(newSet);
    };

    const handleBulkApprove = () => {
        const idsToApprove: string[] = [];
        selectedGroups.forEach(oid => {
            const g = groups.find(x => x.orderId === oid);
            if (g) {
                g.allImages.forEach(img => idsToApprove.push(img.id));
            }
        });
        if (idsToApprove.length > 0) {
            onApprove(idsToApprove);
            setSelectedGroups(new Set());
        }
    };

    if (loading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-zinc-400" />
            </div>
        );
    }

    if (images.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-zinc-400">
                <CheckCircle className="w-12 h-12 mb-4 text-zinc-800" />
                <p>All caught up!</p>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6 bg-zinc-50 min-h-screen">

            {/* Header / Toolbar */}
            <div className="flex items-center justify-between sticky top-0 bg-zinc-50/95 backdrop-blur z-40 py-4 border-b border-zinc-200">
                <div>
                    <h1 className="text-2xl font-bold text-zinc-900 font-playfair">Review Queue</h1>
                    <p className="text-zinc-500 text-sm">{images.length} images pending across {groups.length} orders</p>
                </div>

                {selectedGroups.size > 0 && (
                    <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-zinc-600">{selectedGroups.size} orders selected</span>
                        <button
                            onClick={handleBulkApprove}
                            className="bg-zinc-900 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-zinc-800 transition-colors flex items-center gap-2"
                        >
                            <Check className="w-4 h-4" />
                            Approve All
                        </button>
                    </div>
                )}
            </div>

            {/* Masonry Grid (CSS Columns) */}
            <div className="columns-1 md:columns-2 lg:columns-3 xl:columns-4 gap-6 space-y-6">
                {groups.map(group => (
                    <motion.div
                        layout
                        key={group.orderId}
                        className={`break-inside-avoid bg-white rounded-xl border transition-all duration-200 overflow-hidden group ${selectedGroups.has(group.orderId) ? 'border-brand-blue shadow-md ring-1 ring-brand-blue' : 'border-zinc-200 shadow-sm hover:shadow-md'
                            }`}
                        onClick={() => toggleSelectGroup(group.orderId)}
                    >
                        {/* Header */}
                        <div className="p-3 border-b border-zinc-100 flex justify-between items-start bg-zinc-50/50">
                            <div>
                                <div className="text-xs font-mono text-zinc-400">#{group.orderId.slice(0, 8)}</div>
                                {/* We don't have pet name here unless we fetch/join orders, maybe later optimization */}
                            </div>
                            <input
                                type="checkbox"
                                checked={selectedGroups.has(group.orderId)}
                                onChange={() => toggleSelectGroup(group.orderId)}
                                className="w-4 h-4 rounded border-zinc-300 text-brand-blue"
                            />
                        </div>

                        {/* Main Image */}
                        <div className="relative aspect-square bg-zinc-100 cursor-zoom-in group-hover:brightness-95 transition-all"
                            onClick={(e) => { e.stopPropagation(); if (group.primaryImage) openFocus(group.primaryImage); }}
                        >
                            {group.primaryImage && (
                                <Image
                                    src={group.primaryImage.url}
                                    alt="Primary"
                                    fill
                                    className="object-cover"
                                    sizes="(max-width: 768px) 100vw, 33vw"
                                />
                            )}
                            {/* Action Overlay */}
                            <div className="absolute inset-x-0 bottom-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2 justify-center bg-gradient-to-t from-black/50 to-transparent pt-8">
                                <button
                                    onClick={(e) => { e.stopPropagation(); group.primaryImage && onReject(group.primaryImage.id); }}
                                    className="bg-white/90 p-2 rounded-full text-rose-600 hover:scale-110 transition-transform shadow-sm"
                                    title="Reject"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); group.primaryImage && onApprove([group.primaryImage.id]); }}
                                    className="bg-brand-blue/90 p-2 rounded-full text-white hover:scale-110 transition-transform shadow-sm"
                                    title="Approve"
                                >
                                    <Check className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* Bonus Row */}
                        {group.bonusImages.length > 0 && (
                            <div className="p-2 grid grid-cols-4 gap-1 bg-white">
                                {group.bonusImages.slice(0, 4).map(img => (
                                    <div
                                        key={img.id}
                                        className="relative aspect-square rounded overflow-hidden cursor-pointer hover:opacity-80"
                                        onClick={(e) => { e.stopPropagation(); openFocus(img); }}
                                    >
                                        <Image src={img.url} alt="Bonus" fill className="object-cover" />
                                    </div>
                                ))}
                                {group.bonusImages.length > 4 && (
                                    <div className="aspect-square flex items-center justify-center bg-zinc-100 text-xs text-zinc-500 rounded">
                                        +{group.bonusImages.length - 4}
                                    </div>
                                )}
                            </div>
                        )}

                    </motion.div>
                ))}
            </div>

            {/* Focus Modal */}
            <AnimatePresence>
                {focusedImage && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm flex items-center justify-center p-4 sm:p-12"
                    >
                        {/* Close */}
                        <button
                            onClick={() => setFocusedImage(null)}
                            className="absolute top-6 right-6 text-zinc-400 hover:text-white p-2"
                        >
                            <XCircle className="w-8 h-8" />
                        </button>

                        <div className="flex w-full h-full gap-8 max-w-7xl mx-auto">
                            {/* Main Display */}
                            <div className="flex-1 relative bg-zinc-900 rounded-lg overflow-hidden flex items-center justify-center border border-zinc-800">
                                <Image
                                    src={focusedImage.url}
                                    alt="Focus"
                                    fill
                                    className="object-contain"
                                    quality={100}
                                />
                            </div>

                            {/* Sidebar Info */}
                            <div className="w-80 bg-zinc-900/50 border border-zinc-800 rounded-lg p-6 space-y-6 hidden lg:block">
                                <div>
                                    <h3 className="text-zinc-400 text-xs uppercase font-bold tracking-wider mb-2">Prompt Context</h3>
                                    <p className="text-zinc-300 text-sm leading-relaxed font-mono bg-black/30 p-3 rounded border border-zinc-800/50">
                                        {/* Mock Prompt Data if invalid/missing */}
                                        {/* In real app, we fetch this. For now showing placeholder or parsing if stored */}
                                        "Generative portrait of {focusedImage.type}..."
                                    </p>
                                </div>

                                <div className="space-y-3">
                                    <h3 className="text-zinc-400 text-xs uppercase font-bold tracking-wider">Keyboard Actions</h3>
                                    <div className="grid grid-cols-2 gap-2 text-sm text-zinc-500">
                                        <div className="flex items-center gap-2"><div className="kbd">→</div> Approve</div>
                                        <div className="flex items-center gap-2"><div className="kbd">←</div> Reject</div>
                                        <div className="flex items-center gap-2"><div className="kbd">Esc</div> Close</div>
                                    </div>
                                </div>

                                <div className="pt-8 border-t border-zinc-800 flex flex-col gap-3">
                                    <button
                                        onClick={() => { onReject(focusedImage.id); handleNextFocus(); }}
                                        className="btn-secondary w-full justify-center bg-rose-950/30 text-rose-500 border-rose-900/50 hover:bg-rose-900/50"
                                    >
                                        <X className="w-4 h-4 mr-2" />
                                        Reject
                                    </button>
                                    <button
                                        onClick={() => { onApprove([focusedImage.id]); handleNextFocus(); }}
                                        className="btn-primary w-full justify-center bg-brand-blue hover:bg-brand-blue/90 border-transparent text-white"
                                    >
                                        <Check className="w-4 h-4 mr-2" />
                                        Approve
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

        </div>
    );
}
