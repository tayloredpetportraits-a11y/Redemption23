'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { Lock, Sparkles, Share2, Check, Star, Download, Printer, ZoomIn, Archive, Clock, ShoppingBag } from 'lucide-react';
import type { Order, Image as ImageType } from '@/lib/supabase/client';
import { useToast } from '@/components/ui/Toast';
import { logger } from '@/lib/logger';
import JSConfetti from 'js-confetti';
import { useRouter } from 'next/navigation';


interface StepThreeBonusProps {
    order: Order;
    petName: string;
    bonusImages: ImageType[];
    bonusUnlocked: boolean;
    setBonusUnlocked: (unlocked: boolean) => void;
    onImageClick: (index: number) => void;
    selectedImage: ImageType | undefined;
    printProduct: string;
    mockupImages: ImageType[];
    products: { id: string; name: string; price: number; description: string }[];
}

const CountdownTimer = ({ initialMinutes = 15 }: { initialMinutes?: number }) => {
    const [timeLeft, setTimeLeft] = useState(initialMinutes * 60);

    useEffect(() => {
        // Try to get saved end time from local storage to persist across refreshes
        const savedEndTime = localStorage.getItem('bonusOfferEndTime');
        const now = Date.now();

        let endTime: number;

        if (savedEndTime && parseInt(savedEndTime) > now) {
            endTime = parseInt(savedEndTime);
        } else {
            // Set new end time
            endTime = now + initialMinutes * 60 * 1000;
            localStorage.setItem('bonusOfferEndTime', endTime.toString());
        }

        const interval = setInterval(() => {
            const currentNow = Date.now();
            const remaining = Math.max(0, Math.ceil((endTime - currentNow) / 1000));
            setTimeLeft(remaining);

            if (remaining <= 0) {
                clearInterval(interval);
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [initialMinutes]);

    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;

    return (
        <span className="flex items-center gap-2 text-amber-700 bg-amber-50 px-3 py-1 rounded-full border border-amber-100 text-sm font-semibold animate-pulse">
            <Clock className="w-4 h-4" />
            <span>Special Offer Expires in {minutes}:{seconds.toString().padStart(2, '0')}</span>
        </span>
    );
};

export default function StepThreeBonus({
    order,
    petName,
    bonusImages,
    bonusUnlocked,
    setBonusUnlocked,
    onImageClick,
    printProduct,
    mockupImages,
    products,
}: StepThreeBonusProps) {
    const [checkoutLoading, setCheckoutLoading] = useState(false);
    const router = useRouter();
    const { addToast } = useToast();

    const bonusTheme = bonusImages[0]?.theme_name || 'Artistic Style';

    const handleUnlockBonus = async () => {
        addToast('Redirecting to Stripe Checkout...', 'info');

        setCheckoutLoading(true);
        logger.info('Starting bonus unlock flow', { orderId: order.id });

        try {
            const response = await fetch(`/api/checkout/bonus-theme`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    orderId: order.id,
                }),
            });

            const data = await response.json();

            if (response.ok && data.url) {
                window.location.href = data.url;
            } else {
                addToast('Failed to start checkout. Please try again.', 'error');
                logger.error('Unlock failed response', { data });
                setCheckoutLoading(false);
            }
        } catch (err) {
            addToast('An error occurred during unlock.', 'error');
            logger.error('Unlock exception', err);
            setCheckoutLoading(false);
        }
    };

    const handleProductCheckout = async (product: { id: string; name: string; price: number }) => {
        addToast(`Redirecting to checkout for ${product.name}...`, 'info');

        try {
            // Find the best image for this product to metadata
            // Logic repeated from rendering but simplified here
            const pName = product.name.toLowerCase();
            let matchedMockup = null;
            if (pName.includes('canvas')) {
                matchedMockup = mockupImages.find(m =>
                    m.theme_name?.toLowerCase().includes('canvas front') ||
                    m.theme_name?.toLowerCase().includes('canvas')
                );
            } else if (pName.includes('tumbler')) {
                matchedMockup = mockupImages.find(m => m.theme_name?.toLowerCase().includes('tumbler'));
            } else if (pName.includes('bear')) {
                matchedMockup = mockupImages.find(m => m.theme_name?.toLowerCase().includes('bear'));
            }

            const response = await fetch(`/api/checkout/product`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    orderId: order.id,
                    productId: product.id,
                    productName: product.name,
                    price: product.price,
                    imageId: matchedMockup?.id || selectedImage?.id
                }),
            });

            const data = await response.json();

            if (response.ok && data.url) {
                window.location.href = data.url;
            } else {
                addToast('Failed to start checkout. Please try again.', 'error');
                logger.error('Product checkout failed', { data });
            }
        } catch (err) {
            addToast('An error occurred during checkout.', 'error');
            logger.error('Product checkout exception', err);
        }
    };

    const handleDownload = async (imageUrl: string, fileName: string) => {
        const response = await fetch(imageUrl);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    };

    const handleDownloadAll = async () => {
        addToast('Starting download of all bonus images...', 'info');
        for (let i = 0; i < bonusImages.length; i++) {
            await handleDownload(bonusImages[i].url, `${petName}_Bonus_${i + 1}.jpg`);
            await new Promise(r => setTimeout(r, 500));
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

                    {!bonusUnlocked && (
                        <div className="flex justify-center my-2">
                            <div className="inline-flex items-center gap-2 bg-rose-50 text-rose-600 px-4 py-1.5 rounded-lg border border-rose-100 font-medium text-sm animate-pulse">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                                <span>Offer expires in <CountdownTimer initialMinutes={15} /></span>
                            </div>
                        </div>
                    )}

                    <h2 className="text-4xl md:text-5xl font-bold text-brand-navy font-playfair">
                        Unlock the <span className="text-amber-600">&quot;{bonusTheme}&quot;</span> Collection
                    </h2>
                    <p className="text-brand-navy/70 max-w-2xl mx-auto text-lg leading-relaxed font-light">
                        Get <strong>{bonusImages.length} additional portraits</strong> in this exclusive style.
                        <br />Available for a limited time for just <span className="font-semibold text-brand-navy">$4.99</span>.
                    </p>
                </div>

                {bonusUnlocked && (
                    <div className="flex justify-center">
                        <button
                            onClick={handleDownloadAll}
                            className="btn-secondary flex items-center gap-2 text-base px-6 py-3 bg-zinc-100 hover:bg-zinc-200 text-brand-navy transition-colors font-medium rounded-full"
                        >
                            <Archive className="w-5 h-5" />
                            Download All Images
                        </button>
                    </div>
                )}

                {/* Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {bonusImages.map((image, idx) => {
                        const isTeaser = !bonusUnlocked && idx === 0;
                        const isLocked = !bonusUnlocked && idx !== 0;

                        return (
                            <motion.div
                                key={image.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.1 }}
                                className="group space-y-4"
                            >
                                <div
                                    className={`relative aspect-square rounded-2xl overflow-hidden shadow-lg border border-brand-navy/5 bg-white ${bonusUnlocked ? 'cursor-pointer' : ''}`}
                                    onClick={() => bonusUnlocked && onImageClick(idx)}
                                >
                                    <Image
                                        src={bonusUnlocked ? image.url : (image.watermarked_url || image.url)}
                                        alt="Bonus"
                                        fill
                                        className={`object-cover transition-all duration-700 ease-out 
                                            ${isLocked
                                                ? 'blur-[8px] grayscale-[50%] scale-105'
                                                : 'scale-100'}
                                            ${bonusUnlocked ? 'group-hover:scale-105' : ''}
                                        `}
                                    />

                                    {/* Locked State Overlay */}
                                    {isLocked && (
                                        <div className="absolute inset-0 flex items-center justify-center bg-brand-navy/10 backdrop-blur-[2px]">
                                            {/* Tiled Watermark Pattern (CSS/SVG simulation) */}
                                            <div className="absolute inset-0 opacity-10 pointer-events-none"
                                                style={{ backgroundImage: 'radial-gradient(circle, #000 1px, transparent 1px)', backgroundSize: '20px 20px' }}
                                            />
                                            <div className="bg-white/90 p-3 rounded-full shadow-lg backdrop-blur text-brand-navy z-10">
                                                <Lock className="w-6 h-6" />
                                            </div>
                                        </div>
                                    )}

                                    {/* Teaser Overlay */}
                                    {isTeaser && (
                                        <div className="absolute inset-0 pointer-events-none border-4 border-amber-400/50 rounded-2xl">
                                            <div className="absolute top-4 left-4 bg-amber-500 text-white text-xs font-bold px-2 py-1 rounded shadow-sm">
                                                PREVIEW
                                            </div>
                                            {/* Diagonal Watermark Text */}
                                            <div className="absolute inset-0 flex items-center justify-center opacity-30 select-none overflow-hidden">
                                                <div className="-rotate-45 text-4xl font-black text-white whitespace-nowrap">
                                                    PREVIEW PREVIEW PREVIEW
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Unlocked Hover */}
                                    {bonusUnlocked && (
                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                                            <div className="bg-white/90 p-3 rounded-full shadow-lg backdrop-blur text-brand-navy">
                                                <ZoomIn className="w-6 h-6" />
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Actions for Unlocked Images */}
                                {bonusUnlocked && (
                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => handleDownload(image.url, `${petName}_Bonus_${idx + 1}.jpg`)}
                                            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-white hover:bg-zinc-50 border border-zinc-200 text-zinc-600 hover:text-brand-navy font-medium rounded-xl text-sm transition-colors shadow-sm"
                                        >
                                            <Download className="w-4 h-4" />
                                            Download
                                        </button>
                                        <button
                                            onClick={() => {
                                                handleDownload(image.url, `${petName}_Bonus_Print_${idx + 1}.jpg`);
                                                addToast('Image saved! Ready to print.', 'success');
                                            }}
                                            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-white hover:bg-zinc-50 border border-zinc-200 text-zinc-600 hover:text-brand-navy font-medium rounded-xl text-sm transition-colors shadow-sm"
                                        >
                                            <Printer className="w-4 h-4" />
                                            Print
                                        </button>
                                    </div>
                                )}
                            </motion.div>
                        );
                    })}
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

            {/* Product Upsell Section */}
            {products.filter(p => p.id !== 'digital').length > 0 && (
                <section className="space-y-8">
                    <div className="text-center space-y-2">
                        <h3 className="text-2xl font-bold text-brand-navy font-playfair">Turn these into Masterpieces</h3>
                        <p className="text-zinc-600">Premium prints available for your new collection</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                        {products.filter(p => p.id !== 'digital').map((product) => (
                            <motion.div
                                key={product.id}
                                whileHover={{ y: -5 }}
                                className="bg-white rounded-xl p-4 shadow-sm border border-zinc-100 hover:shadow-md transition-all text-center space-y-3"
                            >
                                <div className="aspect-square bg-zinc-50 rounded-lg flex items-center justify-center mb-2 overflow-hidden relative">
                                    {/* Placeholder for Product Image - ideally dynamic */}
                                    <div className="absolute inset-0 bg-zinc-100 flex items-center justify-center text-zinc-300">
                                        <ShoppingBag className="w-8 h-8 opacity-20" />
                                    </div>
                                    {/* Dynamic Mockup Image */}
                                    {(() => {
                                        // Logic to find best mockup for this product
                                        let matchedMockup = null;
                                        const pName = product.name.toLowerCase();

                                        if (pName.includes('canvas')) {
                                            // Prefer "Canvas Front" or just any Canvas
                                            matchedMockup = mockupImages.find(m =>
                                                m.theme_name?.toLowerCase().includes('canvas front') ||
                                                m.theme_name?.toLowerCase().includes('canvas')
                                            );
                                        } else if (pName.includes('tumbler')) {
                                            matchedMockup = mockupImages.find(m =>
                                                m.theme_name?.toLowerCase().includes('tumbler')
                                            );
                                        } else if (pName.includes('bear')) {
                                            matchedMockup = mockupImages.find(m =>
                                                m.theme_name?.toLowerCase().includes('bear')
                                            );
                                        }

                                        // If we have a generated mockup for this product type, use it
                                        // Otherwise fall back to generic assets or show placeholder
                                        const imgSrc = matchedMockup?.url || `/assets/mockups/${pName.includes('canvas') ? 'canvas_mockup.png' : product.id + '_base.png'}`;

                                        return (
                                            <Image
                                                src={imgSrc}
                                                alt={product.name}
                                                width={200}
                                                height={200}
                                                className="object-contain p-4 opacity-100 hover:scale-105 transition-all duration-300"
                                                onError={(e) => {
                                                    // Fallback if image missing
                                                    (e.target as HTMLImageElement).src = '/assets/mockups/generic_placeholder.png'; // safe fallback
                                                    (e.target as HTMLImageElement).style.opacity = '0.5';
                                                }}
                                            />
                                        );
                                    })()}
                                </div>
                                <div>
                                    <h4 className="font-bold text-brand-navy">{product.name}</h4>
                                    <p className="text-sm text-zinc-500">{product.description}</p>
                                </div>
                                <div className="font-semibold text-emerald-600">${product.price}</div>
                                <button
                                    onClick={() => handleProductCheckout(product)}
                                    className="w-full py-2 rounded-lg bg-zinc-900 text-white text-sm font-medium hover:bg-zinc-800 transition-colors"
                                >
                                    Buy Now
                                </button>
                            </motion.div>
                        ))}
                    </div>
                </section>
            )}

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

        </div >
    );
}
