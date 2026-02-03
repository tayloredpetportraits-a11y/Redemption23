'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, Sparkles, CheckCircle2 } from 'lucide-react';
import SwipeCard from '@/components/shared/SwipeCard';
import PugLoader from '@/components/PugLoader';
import type { Order, Image } from '@/lib/supabase/client';

interface ImageCurationViewProps {
    order: Order;
    images: Image[]; // Images with status='generated'
    onApproveImage: (imageId: string) => Promise<void>;
    onRejectImage: (imageId: string, shouldRegenerate: boolean) => Promise<void>;
    onFinalizeOrder: () => Promise<void>;
}

interface RegenerationState {
    imageId: string;
    status: 'queued' | 'processing' | 'complete';
    terminalMessages: string[];
}

export default function ImageCurationView({
    order,
    images,
    onApproveImage,
    onRejectImage,
    onFinalizeOrder,
}: ImageCurationViewProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [approvedCount, setApprovedCount] = useState(0);
    const [rejectedCount, setRejectedCount] = useState(0);
    const [regenerating, setRegenerating] = useState<RegenerationState | null>(null);
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');

    const currentImage = images[currentIndex];
    const hasMoreImages = currentIndex < images.length - 1;
    const canFinalize = approvedCount >= 5;

    // Terminal messages simulation
    const simulateTerminalMessages = (imageId: string) => {
        const messages = [
            '> INITIATING_GEMINI_PROTOCOL...',
            '> ANALYZING_NEGATIVE_PROMPT...',
            '> GENERATING_ALTERNATIVE_VARIATION...',
            '> RENDERING_VARIATION_V2...',
            '> UPLOADING_TO_SUPABASE_STORAGE...',
            '> COMPLETE ✓',
        ];

        setRegenerating({
            imageId,
            status: 'processing',
            terminalMessages: [],
        });

        let messageIndex = 0;
        const interval = setInterval(() => {
            if (messageIndex < messages.length) {
                setRegenerating((prev) => prev ? {
                    ...prev,
                    terminalMessages: [...prev.terminalMessages, messages[messageIndex]],
                } : null);
                messageIndex++;
            } else {
                clearInterval(interval);
                setRegenerating((prev) => prev ? { ...prev, status: 'complete' } : null);
            }
        }, 800);
    };

    const handleApprove = async () => {
        if (!currentImage) return;

        await onApproveImage(currentImage.id);
        setApprovedCount((prev) => prev + 1);

        // Move to next image
        if (hasMoreImages) {
            setCurrentIndex((prev) => prev + 1);
        }

        // Show toast
        setToastMessage('✓ Image approved');
        setShowToast(true);
        setTimeout(() => setShowToast(false), 2000);
    };

    const handleReject = async (shouldRegenerate: boolean) => {
        if (!currentImage) return;

        await onRejectImage(currentImage.id, shouldRegenerate);
        setRejectedCount((prev) => prev + 1);

        if (shouldRegenerate) {
            // Show toast
            setToastMessage('Image rejected. Queuing regeneration...');
            setShowToast(true);
            setTimeout(() => setShowToast(false), 3000);

            // Simulate regeneration with terminal animation
            simulateTerminalMessages(currentImage.id);
        }

        // Move to next image
        if (hasMoreImages) {
            setCurrentIndex((prev) => prev + 1);
        }
    };

    const handleFinalize = async () => {
        if (!canFinalize) return;
        await onFinalizeOrder();
    };

    return (
        <div className="min-h-screen bg-zinc-950 p-8">
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Header with progress */}
                <div className="glass-card p-6 rounded-lg">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h2 className="text-2xl font-bold text-white">Review Images</h2>
                            <p className="text-zinc-400">
                                Order: {order.pet_name} • {order.customer_name}
                            </p>
                        </div>
                        <div className="flex gap-4">
                            <div className="text-center">
                                <div className="text-3xl font-bold text-green-400">{approvedCount}</div>
                                <div className="text-xs text-zinc-500">Approved</div>
                            </div>
                            <div className="text-center">
                                <div className="text-3xl font-bold text-red-400">{rejectedCount}</div>
                                <div className="text-xs text-zinc-500">Rejected</div>
                            </div>
                            <div className="text-center">
                                <div className="text-3xl font-bold text-zinc-400">
                                    {currentIndex + 1}/{images.length}
                                </div>
                                <div className="text-xs text-zinc-500">Progress</div>
                            </div>
                        </div>
                    </div>

                    {/* Progress bar */}
                    <div className="w-full bg-zinc-800 rounded-full h-2">
                        <motion.div
                            className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${((currentIndex + 1) / images.length) * 100}%` }}
                            transition={{ duration: 0.3 }}
                        />
                    </div>
                </div>

                {/* Image Stack */}
                <div className="relative">
                    <AnimatePresence mode="wait">
                        {regenerating && regenerating.status === 'processing' ? (
                            // Ghost Card: Terminal Animation
                            <motion.div
                                key="regenerating"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                className="glass-card p-8 rounded-lg space-y-6"
                            >
                                <div className="flex items-center justify-center">
                                    <PugLoader text="Regenerating with Gemini..." />
                                </div>

                                {/* Terminal Output */}
                                <div className="bg-black/50 rounded-lg p-4 font-mono text-sm space-y-1 max-h-48 overflow-y-auto">
                                    {regenerating.terminalMessages.map((msg, idx) => (
                                        <motion.div
                                            key={idx}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            className="text-green-400"
                                        >
                                            {msg}
                                        </motion.div>
                                    ))}
                                </div>
                            </motion.div>
                        ) : currentImage ? (
                            // Active SwipeCard
                            <motion.div
                                key={currentImage.id}
                                initial={{ opacity: 0, x: 100 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -100 }}
                                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                            >
                                {/* REGENERATED Badge */}
                                {currentImage.prompt?.includes('regenerated') && (
                                    <div className="absolute top-4 right-4 z-10">
                                        <div className="bg-amber-500 text-black px-4 py-2 rounded-full font-bold text-sm flex items-center gap-2 shadow-lg">
                                            <Sparkles className="w-4 h-4" />
                                            REGENERATED
                                        </div>
                                    </div>
                                )}

                                <SwipeCard
                                    order={order}
                                    primaryImage={images.find(img => img.type === 'primary') || null}
                                    aiResultImage={currentImage}
                                    context="admin"
                                    onApprove={handleApprove}
                                    onReject={() => {
                                        // Show regeneration modal
                                        const shouldRegenerate = confirm(
                                            'Reject this image?\n\nYes = Reject & Regenerate\nNo = Just Reject'
                                        );
                                        handleReject(shouldRegenerate);
                                    }}
                                />
                            </motion.div>
                        ) : (
                            // All images reviewed
                            <div className="glass-card p-12 rounded-lg text-center space-y-4">
                                <CheckCircle2 className="w-16 h-16 mx-auto text-green-400" />
                                <h3 className="text-2xl font-bold text-white">All Images Reviewed!</h3>
                                <p className="text-zinc-400">
                                    {approvedCount} approved • {rejectedCount} rejected
                                </p>
                            </div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Actions */}
                <div className="flex gap-4">
                    {hasMoreImages && !regenerating && (
                        <button
                            onClick={() => setCurrentIndex((prev) => Math.min(prev + 1, images.length - 1))}
                            className="flex-1 px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg font-semibold transition-colors"
                        >
                            Skip to Next →
                        </button>
                    )}

                    <button
                        onClick={handleFinalize}
                        disabled={!canFinalize}
                        className={`px-8 py-3 rounded-lg font-bold text-lg transition-all ${canFinalize
                                ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white shadow-lg shadow-purple-500/50'
                                : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                            }`}
                    >
                        {canFinalize ? '✓ Finalize Order & Notify Customer' : `Need ${5 - approvedCount} More Approvals`}
                    </button>
                </div>

                {/* Warning if low approvals */}
                {!canFinalize && (
                    <div className="glass-card p-4 rounded-lg flex items-start gap-3 border border-amber-500/20">
                        <AlertCircle className="w-5 h-5 text-amber-500 mt-0.5" />
                        <div className="text-sm">
                            <p className="text-amber-400 font-semibold">Minimum 5 approvals required</p>
                            <p className="text-zinc-400">
                                Customers need at least 5 images to choose from. You have {approvedCount} approved.
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* Toast Notification */}
            <AnimatePresence>
                {showToast && (
                    <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 50 }}
                        className="fixed bottom-8 right-8 bg-zinc-900 text-white px-6 py-3 rounded-lg shadow-xl border border-zinc-700"
                    >
                        {toastMessage}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
