'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Check, X as XContext, XCircle, ChevronLeft, ChevronRight,
    Loader2, RefreshCw, PenTool
} from 'lucide-react';
import Image from 'next/image';
import type { Image as ImageType, Order } from '@/lib/supabase/client';
import { regenerateSingleImage } from '@/app/actions/gen-actions';

interface ProReviewModalProps {
    focusedImage: ImageType | null;
    onClose: () => void;
    // We need the full list for navigation
    currentGroupImages: ImageType[];
    // We need order info
    order: Order | undefined;
    onApprove: (ids: string[]) => void;
    onReject: (id: string) => void;
    // Navigation handlers
    onNext: () => void;
    onPrev: () => void;
    onSelect: (img: ImageType) => void;
}

export default function ProReviewModal({
    focusedImage,
    onClose,
    currentGroupImages,
    order,
    onApprove,
    onReject,
    onNext,
    onPrev,
    onSelect
}: ProReviewModalProps) {

    // Keyboard Shortcuts handled by parent ReviewGrid? 
    // Usually better to handle here if it's a modal, BUT ReviewGrid managed state.
    // Let's rely on parent for state management (focusedImage) but we might need local handlers?
    // ReviewGrid already has a keyboard listener.
    // Actually, ReviewGrid's listener depends on `focusedImage` being set.
    // If we move the UI here, the logic remains in ReviewGrid. 
    // So this component is just the VIEW.

    if (!focusedImage) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] bg-zinc-950 flex flex-col text-zinc-200"
            >
                {/* 1. TOP BAR (Subtle) */}
                <div className="absolute top-0 inset-x-0 h-16 z-50 flex items-center justify-between px-6 bg-gradient-to-b from-black/80 to-transparent pointer-events-none">
                    <div className="pointer-events-auto">
                        {/* Maybe breadcrumbs? */}
                    </div>
                    <button
                        onClick={onClose}
                        className="pointer-events-auto bg-black/40 hover:bg-red-900/50 hover:text-red-200 text-zinc-400 p-2 rounded-full backdrop-blur transition-all"
                    >
                        <XCircle className="w-8 h-8" />
                    </button>
                </div>

                {/* 2. CENTER STAGE (Image) */}
                <div className="flex-1 relative flex items-center justify-center overflow-hidden bg-zinc-950" onClick={onClose}>

                    {/* Nav Buttons */}
                    <button
                        onClick={(e) => { e.stopPropagation(); onPrev(); }}
                        className="absolute left-4 z-40 p-4 rounded-full bg-black/20 hover:bg-white/10 text-white/50 hover:text-white transition-all backdrop-blur"
                    >
                        <ChevronLeft className="w-10 h-10" />
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); onNext(); }}
                        className="absolute right-4 z-40 p-4 rounded-full bg-black/20 hover:bg-white/10 text-white/50 hover:text-white transition-all backdrop-blur"
                    >
                        <ChevronRight className="w-10 h-10" />
                    </button>

                    <motion.div
                        key={focusedImage.id}
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.2 }}
                        className="relative w-full h-full max-w-[calc(100vw-320px)] max-h-[calc(100vh-140px)] p-4"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <Image
                            src={focusedImage.url}
                            alt="Focus"
                            fill
                            className="object-contain drop-shadow-2xl"
                            quality={100}
                            priority
                        />

                        {/* Hover Overlay: Pet Name */}
                        <div className="absolute top-8 left-1/2 -translate-x-1/2 opacity-0 hover:opacity-100 transition-opacity bg-black/60 px-4 py-2 rounded-full text-white font-bold backdrop-blur">
                            {order?.pet_name || 'Pet Name'}
                        </div>
                    </motion.div>
                </div>

                {/* 3. BOTTOM PANE (Filmstrip) & RIGHT PANE (Inspector) WRAPPER */}
                <div className="h-64 md:h-48 border-t border-zinc-900 bg-zinc-900 flex flex-col md:flex-row divide-x divide-zinc-900">

                    {/* PANE B: Filmstrip (Left/Bottom) */}
                    <div className="flex-1 bg-zinc-925 relative group">
                        <div className="absolute inset-0 overflow-x-auto flex items-center px-4 gap-3 bg-zinc-950/50">
                            {currentGroupImages.map((img) => (
                                <button
                                    key={img.id}
                                    onClick={(e) => { e.stopPropagation(); onSelect(img); }}
                                    className={`relative w-24 h-24 shrink-0 rounded-lg overflow-hidden border-2 transition-all duration-200 ${focusedImage.id === img.id
                                        ? 'border-white scale-110 z-10 shadow-[0_0_15px_rgba(255,255,255,0.3)]'
                                        : 'border-transparent opacity-60 hover:opacity-100'
                                        }`}
                                >
                                    <Image src={img.url} alt="thumb" fill className="object-cover" />
                                    {/* Status Indicators */}
                                    {img.status === 'approved' && (
                                        <div className="absolute top-1 right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white" />
                                    )}
                                    {img.status === 'rejected' && (
                                        <div className="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white" />
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* PANE C: Inspector (Right) - Fixed Width */}
                    <div className="w-full md:w-[360px] bg-zinc-900 p-6 flex flex-col justify-between shrink-0 shadow-[-10px_0_20px_rgba(0,0,0,0.5)] z-50">
                        {/* Top: Info */}
                        <div>
                            <h3 className="text-white font-bold text-lg mb-1">{order?.customer_name || 'Customer'}</h3>
                            <p className="text-zinc-500 text-sm mb-4">Pet: <span className="text-zinc-300">{order?.pet_name}</span></p>

                            <div className="grid grid-cols-2 gap-4 text-xs font-mono text-zinc-500 mb-6">
                                <div>
                                    <span className="block text-zinc-600">Theme</span>
                                    <span className="text-zinc-300">{focusedImage.theme_name || 'N/A'}</span>
                                </div>
                                <div>
                                    <span className="block text-zinc-600">Type</span>
                                    <span className="text-zinc-300">{focusedImage.type}</span>
                                </div>
                            </div>
                        </div>

                        {/* Middle: Actions */}
                        <div className="space-y-3">
                            {focusedImage.status === 'rejected' ? (
                                <RegenControls
                                    imageId={focusedImage.id}
                                    onRegenSuccess={() => { onSelect(focusedImage); window.location.reload(); }} // Dirty reload for now
                                />
                            ) : (
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        onClick={() => { onReject(focusedImage.id); onNext(); }}
                                        className="h-12 rounded-xl bg-zinc-800 border border-zinc-700 hover:bg-red-900/20 hover:border-red-500/50 hover:text-red-400 text-zinc-400 font-bold transition-all flex items-center justify-center gap-2 group"
                                    >
                                        <XContext className="w-5 h-5 group-hover:scale-125 transition-transform" />
                                        REJECT (R)
                                    </button>
                                    <button
                                        onClick={() => { onApprove([focusedImage.id]); onNext(); }}
                                        className="h-12 rounded-xl bg-white text-black hover:bg-green-400 hover:text-black font-bold transition-all flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(255,255,255,0.1)] group"
                                    >
                                        <Check className="w-5 h-5 group-hover:scale-125 transition-transform" />
                                        APPROVE (A)
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Bottom: Shortcuts */}
                        <div className="mt-4 pt-4 border-t border-zinc-800 text-[10px] text-zinc-600 flex justify-between font-mono">
                            <span>[←/→] Navigate</span>
                            <span>[A] Approve</span>
                            <span>[R] Reject</span>
                            <span>[Esc] Close</span>
                        </div>
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}

// Inline RegenControls (Modified for Dark Theme)
function RegenControls({ imageId, onRegenSuccess }: { imageId: string, onRegenSuccess: () => void }) {
    const [mode, setMode] = useState<'quick' | 'refine' | null>(null);
    const [feedback, setFeedback] = useState('');
    const [loading, setLoading] = useState(false);

    const handleRun = async () => {
        setLoading(true);
        try {
            const res = await regenerateSingleImage(imageId, feedback);
            if (res.success) {
                // Toast needed here? User usually sees loading.
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
            <div className="flex flex-col gap-2 bg-zinc-800 p-3 rounded-xl border border-zinc-700">
                <input
                    className="bg-black/50 text-white text-xs p-3 rounded-lg border border-zinc-600 w-full mb-1 focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="e.g. Fix left eye..."
                    value={feedback}
                    onChange={e => setFeedback(e.target.value)}
                    autoFocus
                />
                <div className="flex gap-2">
                    <button onClick={() => setMode(null)} className="flex-1 text-xs text-zinc-400 py-2 hover:text-white">Cancel</button>
                    <button
                        onClick={handleRun}
                        disabled={loading}
                        className="flex-1 bg-indigo-600 text-white text-xs py-2 rounded-lg font-bold hover:bg-indigo-500"
                    >
                        {loading ? 'Running...' : 'Run Regen'}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-2 gap-3">
            <button
                onClick={handleRun}
                disabled={loading}
                className="h-10 bg-zinc-800 text-zinc-200 text-xs rounded-lg hover:bg-zinc-700 flex items-center justify-center gap-2 border border-zinc-700"
            >
                {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                Quick Redo
            </button>
            <button
                onClick={() => setMode('refine')}
                className="h-10 bg-zinc-800 text-indigo-400 text-xs rounded-lg hover:bg-zinc-700 border border-indigo-900/30 flex items-center justify-center gap-2"
            >
                <PenTool className="w-3 h-3" />
                Refine...
            </button>
        </div>
    );
}
