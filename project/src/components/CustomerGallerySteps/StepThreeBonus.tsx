'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { Lock, Sparkles, Share2, Check, Star } from 'lucide-react';
import type { Order, Image as ImageType } from '@/lib/supabase/client';
import { useToast } from '@/components/ui/Toast';
import { logger } from '@/lib/logger';
// UpsellFunnel removed

interface StepThreeBonusProps {
    order: Order;
    petName: string;
    bonusImages: ImageType[];
    bonusUnlocked: boolean;
    setBonusUnlocked: (unlocked: boolean) => void;
    onImageClick: (index: number) => void;
    selectedImage: ImageType | undefined;
    printProduct: string;
}

import { useRouter } from 'next/navigation';

export default function StepThreeBonus({
    order,
    petName,
    bonusImages,
    bonusUnlocked,
    setBonusUnlocked,
    // onImageClick removed
    // selectedImage removed
    // selectedImage removed
    printProduct,
}: StepThreeBonusProps) {
    const [checkoutLoading, setCheckoutLoading] = useState(false);
    const router = useRouter(); // Initialize hook
    const { addToast } = useToast();
    // showUpsellInfo removed

    const bonusTheme = bonusImages[0]?.theme_name || 'Artistic Style';

    const handleUnlockBonus = async () => {
        // Simulate Payment Flow
        // Simulate Payment Flow (for demo/dev purposes, or production mock)
        addToast('Processing $4.99 payment...', 'info');


        setCheckoutLoading(true);
        logger.info('Starting bonus unlock flow', { orderId: order.id });

        try {
            const response = await fetch(`/api/customer/${order.id}/unlock`, {
                method: 'POST',
            });

            if (response.ok) {
                setBonusUnlocked(true); // Optimistic UI update
                router.refresh(); // Fetch clean URLs from server
                addToast('Bonus themes unlocked successfully!', 'success');
                logger.info('Bonus unlocked successfully', { orderId: order.id });
                // confetti call moved to parent or we import it here?
            } else {
                addToast('Failed to unlock bonus. Please try again.', 'error');
                logger.error('Unlock failed response', { status: response.status });
            }
        } catch (err) {
            addToast('An error occurred during unlock.', 'error');
            logger.error('Unlock exception', err);
        } finally {
            setCheckoutLoading(false);
        }
    };

    const handleShare = async () => {
        const shareText = `Check out ${petName}'s custom pet portrait from Taylored Pet Portraits! 🐾`;
        const shareUrl = window.location.href;

        if (navigator.share) {
            try {
                await navigator.share({ title: `${petName}'s Portrait`, text: shareText, url: shareUrl });
                await fetch(`/api/customer/${order.id}/track-share`, { method: 'POST' });
                logger.info('Share initiated via native API');
            } catch (err) {
                logger.warn('Share cancelled or failed', err);
            }
        } else {
            navigator.clipboard.writeText(shareUrl);
            addToast('Link copied to clipboard!', 'success');
        }
    };

    return (
        <div className="space-y-12 max-w-5xl mx-auto px-4 sm:px-0">

            {/* Success Banner */}
            {/* Success Banner */}
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="glass-card p-8 text-center space-y-4 relative overflow-hidden group"
            >
                <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-emerald-400 via-emerald-500 to-emerald-400" />
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100/50 text-emerald-600 mb-2 shadow-inner">
                    <Check className="w-8 h-8" />
                </div>
                <h2 className="text-3xl font-bold text-brand-navy font-playfair">Redemption Confirmed!</h2>
                <p className="text-brand-navy/70 text-lg max-w-2xl mx-auto">
                    Your <strong>{printProduct}</strong> featuring <strong>{petName}</strong> is being processed.
                </p>
                <div className="text-emerald-600 text-sm font-medium bg-emerald-50 inline-block px-3 py-1 rounded-full border border-emerald-100">
                    Check your email for tracking info
                </div>
            </motion.div>

            {/* Bonus Section */}
            <section className="space-y-8">
                <div className="text-center space-y-4">
                    <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        className="inline-flex items-center gap-2 px-4 py-1.5 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-100 rounded-full shadow-sm"
                    >
                        <Sparkles className="w-4 h-4 text-amber-500" />
                        <span className="text-sm font-bold text-amber-700 tracking-wide uppercase">New Theme Available</span>
                    </motion.div>
                    <h2 className="text-4xl md:text-5xl font-bold text-brand-navy font-playfair">
                        Unlock the <span className="text-amber-600">&quot;{bonusTheme}&quot;</span> Collection
                    </h2>
                    <p className="text-brand-navy/70 max-w-2xl mx-auto text-lg leading-relaxed font-light">
                        Get <strong>{bonusImages.length} additional portraits</strong> in this exclusive style.
                        <br />Available for a limited time for just <span className="font-semibold text-brand-navy">$4.99</span>.
                    </p>
                </div>

                {/* Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    {bonusImages.map((image, idx) => (
                        <motion.div
                            key={image.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            className="relative aspect-square rounded-2xl overflow-hidden group shadow-lg border border-brand-navy/5 bg-white"
                        >
                            <Image
                                src={bonusUnlocked ? image.url : (image.watermarked_url || image.url)}
                                alt="Bonus"
                                fill
                                className={`object-cover transition-all duration-700 ease-out 
                                    ${!bonusUnlocked ? 'blur-[2px] grayscale-[30%] scale-105 group-hover:scale-110 group-hover:grayscale-0 group-hover:blur-0' : 'group-hover:scale-110'}
                                `}
                            />
                            {!bonusUnlocked && (
                                <div className="absolute inset-0 flex items-center justify-center bg-brand-navy/20 backdrop-blur-[1px] transition-all group-hover:bg-brand-navy/10">
                                    <div className="bg-white/90 p-3 rounded-full shadow-lg backdrop-blur text-brand-navy">
                                        <Lock className="w-6 h-6" />
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    ))}
                </div>

                {/* Call to Action */}
                {!bonusUnlocked ? (
                    <div className="flex flex-col items-center gap-6 pt-4">
                        <button
                            onClick={handleUnlockBonus}
                            disabled={checkoutLoading}
                            className="btn-primary px-16 py-6 text-xl rounded-full shadow-lg shadow-amber-900/20 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 border-none text-white font-bold relative overflow-hidden group"
                        >
                            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                            {checkoutLoading ? <span className="animate-pulse">Processing...</span> : `Unlock All for $4.99`}
                        </button>
                        <div className="flex items-center gap-2 text-brand-navy/60 text-sm">
                            <div className="flex gap-0.5">
                                {[1, 2, 3, 4, 5].map(i => <Star key={i} className="w-4 h-4 text-amber-400 fill-amber-400" />)}
                            </div>
                            <span className="font-medium">4.9/5 rating by other pet parents</span>
                        </div>
                    </div>
                ) : (
                    <div className="text-center p-8 bg-brand-blue/10 rounded-2xl border border-brand-blue/20">
                        <h3 className="text-xl font-bold text-brand-navy mb-2">🎉 You&apos;ve unlocked everything!</h3>
                        <p className="text-zinc-600">Click any bonus image above to view and download in HD.</p>
                    </div>
                )}
            </section>

            <hr className="border-zinc-200" />

            {/* Share Section */}
            <section className="text-center space-y-6 pb-12">
                <h3 className="text-xl font-bold text-brand-navy font-playfair">Share the Love</h3>
                <p className="text-zinc-500">Help us spread the word about Taylored Pet Portraits!</p>
                <button
                    onClick={handleShare}
                    className="btn-secondary inline-flex items-center gap-2 px-8 py-3 rounded-full text-base bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-50 hover:text-brand-navy transition-colors"
                >
                    <Share2 className="w-5 h-5" />
                    Share on Social Media
                </button>
            </section>

        </div>
    );
}
