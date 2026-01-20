'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Check, X as XContext, Loader2, Maximize2, XCircle, Eye, RefreshCw, PenTool,
    ChevronLeft, ChevronRight, CheckCircle, MoreHorizontal
} from 'lucide-react';
import Image from 'next/image';
import type { Image as ImageType, Order } from '@/lib/supabase/client';
import { regenerateSingleImage } from '@/app/actions/gen-actions';
import PugLoader from '@/components/PugLoader';

interface ReviewGridProps {
    images: ImageType[];
    orders: Record<string, Order>;
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

export default function ReviewGrid({ images, orders, onApprove, onReject, loading }: ReviewGridProps) {
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
    // We need to navigate within the CURRENT ORDER CONTEXT when modal is open
    // We should build a flat list of images for the current order to navigate properly

    // Derived state for current navigation list
    const currentNavList = focusedImage
        ? (groups.find(g => g.orderId === focusedImage.order_id)?.allImages || [])
        : [];

    const openFocus = (image: ImageType) => {
        setFocusedImage(image);
    };

    const handleNextFocus = () => {
        if (!focusedImage || currentNavList.length === 0) return;
        const currentIdx = currentNavList.findIndex(i => i.id === focusedImage.id);
        if (currentIdx < currentNavList.length - 1) {
            setFocusedImage(currentNavList[currentIdx + 1]);
        } else {
            // Optional: Loop or Close? Let's close for now or stop.
            // Let's loop back to start? No, usually end of roll.
            // setFocusedImage(null); 
        }
    };

    const handlePrevFocus = () => {
        if (!focusedImage || currentNavList.length === 0) return;
        const currentIdx = currentNavList.findIndex(i => i.id === focusedImage.id);
        if (currentIdx > 0) {
            setFocusedImage(currentNavList[currentIdx - 1]);
        }
    };

    // Keyboard Shortcuts
    useEffect(() => {
        if (!focusedImage) return;

        const handleKeys = (e: KeyboardEvent) => {
            if (e.key === 'ArrowRight') {
                // Next
                handleNextFocus();
            } else if (e.key === 'ArrowLeft') {
                // Prev
                handlePrevFocus();
            } else if (e.key.toLowerCase() === 'a') {
                // Key: A -> Approve & Next
                onApprove([focusedImage.id]);
                handleNextFocus();
            } else if (e.key.toLowerCase() === 'r') {
                // Key: R -> Reject
                onReject(focusedImage.id);
                // Stay on rejected image to allow Regen click? Or move next?
                // User said: "Bind 'R' to Reject". Logic choice: Stay to hit Regen? 
                // "Regenerate" is a separate click. 
                // Let's stay put so they can see the red border and click Regenerate if they want.
            } else if (e.key === 'Escape') {
                setFocusedImage(null);
            }
        };

        window.addEventListener('keydown', handleKeys);
        return () => window.removeEventListener('keydown', handleKeys);
    }, [focusedImage, focusIndex, images]);

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

    // Non-blocking loading approach
    // if (loading) { ... } removed to prevent lockout

    if (!images || images.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] text-zinc-400">
                {loading ? (
                    <div className="flex flex-col items-center gap-4">
                        {/* PugLoader for personality */}
                        <div className="scale-75"><PugLoader /></div>
                        <p className="animate-pulse font-mono text-brand-blue">Generating magic...</p>
                    </div>
                ) : (
                    <>
                        <CheckCircle className="w-12 h-12 mb-4 text-zinc-800" />
                        <p>No images found for this order.</p>
                        <p className="text-xs mt-2">Check the filters or regeneration status.</p>
                    </>
                )}
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6 min-h-screen bg-white">

            {/* Header / Toolbar */}
            <div className="flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur z-40 py-4 border-b border-zinc-100">
                <div>
                    <h1 className="text-2xl font-bold text-zinc-900 font-playfair">Review Queue</h1>
                    <div className="flex items-center gap-2">
                        <p className="text-zinc-500 text-sm">{images.length} images pending across {groups.length} groups</p>
                        {/* Debug Visual */}
                        <span className="text-[10px] bg-red-100 text-red-600 px-1 rounded border border-red-200">
                            DEBUG: {images.length} items
                        </span>
                    </div>
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
                {groups.map(group => {
                    const order = orders[group.orderId];
                    return (
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
                                    <div className="text-sm font-bold text-zinc-800 truncate max-w-[150px]">
                                        {order?.customer_name || order?.pet_name || 'Unknown User'}
                                    </div>
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
                                        <XContext className="w-4 h-4" />
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
                    )
                })}
            </div>

            {/* Focus Modal (Lightroom Style) */}
            <AnimatePresence>
                {focusedImage && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-black/95 flex flex-col"
                    >
                        {/* 1. Main Stage (Image) */}
                        <div className="flex-1 relative flex items-center justify-center p-4 overflow-hidden" onClick={() => setFocusedImage(null)}>
                            {/* Close Button */}
                            <button
                                onClick={() => setFocusedImage(null)}
                                className="absolute top-4 right-4 z-50 bg-black/50 text-zinc-400 hover:text-white p-2 rounded-full backdrop-blur-md"
                            >
                                <XCircle className="w-8 h-8" />
                            </button>

                            {/* Nav Buttons (Visible) */}
                            <button
                                onClick={(e) => { e.stopPropagation(); handlePrevFocus(); }}
                                className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 p-4 rounded-full text-white hover:bg-white/10 transition-colors z-40 hidden md:block"
                            >
                                <ChevronLeft className="w-8 h-8" />
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); handleNextFocus(); }}
                                className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 p-4 rounded-full text-white hover:bg-white/10 transition-colors z-40 hidden md:block"
                            >
                                <ChevronRight className="w-8 h-8" />
                            </button>

                            <motion.div
                                className="relative w-full h-full max-w-[90vw] max-h-[85vh]"
                                onClick={(e) => e.stopPropagation()} // Click image shouldn't close
                                key={focusedImage.id}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.2 }}
                            >
                                <Image
                                    src={focusedImage.url}
                                    alt="Focus"
                                    fill
                                    className="object-contain" // "Lightroom" fit
                                    quality={100}
                                    priority
                                />
                                {/* Text Stamp Visibility Check: Bottom Center Overlay */}
                                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 px-3 py-1 rounded text-[10px] text-zinc-400 font-mono tracking-widest backdrop-blur-md">
                                    {orders[focusedImage.order_id]?.pet_name?.toUpperCase() || 'NO NAME'}
                                </div>
                            </motion.div>
                        </div>

                        {/* 2. Bottom Filmstrip & Controls */}
                        <div className="h-auto md:h-28 bg-zinc-900 border-t border-zinc-800 flex flex-col md:flex-row divide-y md:divide-y-0 divide-zinc-800">

                            {/* Left: Filmstrip */}
                            <div className="flex-1 overflow-x-auto p-4 flex gap-2 items-center justify-start md:justify-center bg-black/20">
                                {groups.find(g => g.orderId === focusedImage.order_id)?.allImages.filter(i => i.status !== 'archived').map((img, idx) => (
                                    <button
                                        key={img.id}
                                        onClick={(e) => { e.stopPropagation(); openFocus(img); }}
                                        className={`relative w-20 h-20 shrink-0 rounded overflow-hidden border-2 transition-all ${focusedImage.id === img.id ? 'scale-110 z-10 shadow-xl' : 'opacity-80 hover:opacity-100'
                                            } ${img.status === 'approved' ? 'border-4 border-green-500' :
                                                img.status === 'rejected' ? 'border-4 border-red-500 opacity-60' :
                                                    focusedImage.id === img.id ? 'border-brand-blue' : 'border-zinc-700'
                                            }`}
                                    >
                                        <Image src={img.url} alt="thumb" fill className="object-cover" />

                                        {/* Status Overlays */}
                                        {img.status === 'approved' && (
                                            <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center">
                                                <div className="bg-green-500 text-white rounded-full p-1 shadow-sm">
                                                    <Check className="w-3 h-3" strokeWidth={4} />
                                                </div>
                                            </div>
                                        )}
                                        {img.status === 'rejected' && (
                                            <div className="absolute inset-0 bg-red-500/30 flex items-center justify-center">
                                                <div className="bg-red-500 text-white rounded-full p-1 shadow-sm">
                                                    <XContext className="w-3 h-3" strokeWidth={4} />
                                                </div>
                                            </div>
                                        )}
                                    </button>
                                ))}
                            </div>

                            {/* Right: Sidebar / Controls */}
                            <div className="w-full md:w-96 bg-zinc-900 p-4 flex flex-col gap-3 justify-center shrink-0 z-20">
                                {/* Order Info Row */}
                                <div className="flex justify-between items-center text-sm">
                                    <div className="flex flex-col">
                                        <div className="flex items-center gap-2">
                                            <span className="text-white font-bold">{orders[focusedImage.order_id]?.customer_name || 'Unknown'}</span>
                                            {/* Count Badge */}
                                            <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${(groups.find(g => g.orderId === focusedImage.order_id)?.allImages.filter(i => i.status === 'approved').length || 0) === 10
                                                ? 'bg-green-900 text-green-300'
                                                : 'bg-zinc-800 text-zinc-400'
                                                }`}>
                                                {groups.find(g => g.orderId === focusedImage.order_id)?.allImages.filter(i => i.status === 'approved').length || 0}/10 Appr
                                            </span>
                                        </div>
                                        <span className="text-zinc-500 text-xs">Pet: {orders[focusedImage.order_id]?.pet_name}</span>
                                    </div>
                                    <a
                                        href={`/portal/${focusedImage.order_id}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="flex items-center gap-1.5 text-xs bg-zinc-800 hover:bg-zinc-700 text-brand-blue px-2 py-1.5 rounded transition-colors"
                                    >
                                        <Eye className="w-3 h-3" /> Portal
                                    </a>
                                </div>

                                {/* Action Buttons */}
                                {focusedImage.status === 'rejected' ? (
                                    <div className="flex flex-col gap-2">
                                        <RegenControls
                                            imageId={focusedImage.id}
                                            onRegenSuccess={() => { setFocusedImage(null); window.location.reload(); }} // Simple reload or callback
                                        />
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-2 gap-3">
                                        <button
                                            onClick={() => { onReject(focusedImage.id); handleNextFocus(); }}
                                            className="btn-secondary justify-center text-xs bg-zinc-800 border-zinc-700 text-zinc-300 hover:text-red-400 hover:border-red-900/50 hover:bg-red-950/20"
                                        >
                                            <XContext className="w-4 h-4 mr-2" /> REJECT (←)
                                        </button>
                                        <button
                                            onClick={() => { onApprove([focusedImage.id]); handleNextFocus(); }}
                                            className="btn-primary justify-center text-xs"
                                        >
                                            <Check className="w-4 h-4 mr-2" /> APPROVE (→)
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

        </div>
    );
}

// Sub-component for Regeneration (Colocated for now)
function RegenControls({ imageId, onRegenSuccess }: { imageId: string, onRegenSuccess: () => void }) {
    const [mode, setMode] = useState<'quick' | 'refine' | null>(null);
    const [feedback, setFeedback] = useState('');
    const [loading, setLoading] = useState(false);

    const handleRun = async () => {
        setLoading(true);
        try {
            const res = await regenerateSingleImage(imageId, feedback);
            if (res.success) {
                alert("Regeneration Started!");
                onRegenSuccess();
            } else {
                alert("Error: " + res.error);
            }
        } catch (e: any) {
            alert("Error: " + e.message);
        } finally {
            setLoading(false);
        }
    };

    if (mode === 'refine') {
        return (
            <div className="flex flex-col gap-2 bg-zinc-800 p-2 rounded">
                <input
                    className="bg-black/50 text-white text-xs p-2 rounded border border-zinc-700 w-full mb-1"
                    placeholder="e.g. Make eyes symmetrical"
                    value={feedback}
                    onChange={e => setFeedback(e.target.value)}
                    autoFocus
                />
                <div className="flex gap-2">
                    <button onClick={() => setMode(null)} className="flex-1 text-xs text-zinc-400 py-1 hover:text-white">Cancel</button>
                    <button
                        onClick={handleRun}
                        disabled={loading}
                        className="flex-1 bg-brand-blue text-white text-xs py-1 rounded font-bold hover:bg-brand-blue/90"
                    >
                        {loading ? 'Running...' : 'Run Regen'}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-2 gap-2">
            <button
                onClick={handleRun}
                disabled={loading}
                className="bg-zinc-800 text-white text-xs py-2 rounded hover:bg-zinc-700 flex items-center justify-center gap-2"
            >
                {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                Quick Rerun
            </button>
            <button
                onClick={() => setMode('refine')}
                className="bg-zinc-800 text-brand-blue text-xs py-2 rounded hover:bg-zinc-700 border border-brand-blue/30 flex items-center justify-center gap-2"
            >
                <PenTool className="w-3 h-3" />
                Refine...
            </button>
        </div>
    );
}
