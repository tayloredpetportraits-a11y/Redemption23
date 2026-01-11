'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Check, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import type { Image as ImageType } from '@/lib/supabase/client';
import { MockupGenerator } from '../MockupEngine/MockupGenerator';
import UpsellFunnel from '../UpsellFunnel';
import { type Product } from '@/lib/config';

// Sub-components
import SocialConsent from './components/SocialConsent';
import ProductSelector from './components/ProductSelector';

interface StepTwoRedemptionProps {
    orderId: string;
    petName: string;
    images: ImageType[];
    mockupImages: ImageType[];
    products: Product[];
    selectedImageId: string | null;
    setSelectedImageId: (id: string) => void;
    printProduct: string;
    setPrintProduct: (id: string) => void;
    notes: string;
    setNotes: (notes: string) => void;

    onConfirm: () => void;
    onRequestRevision: () => void;
    onPrev: () => void;
}

export default function StepTwoRedemption({
    orderId,
    petName,
    images,
    mockupImages,
    products,
    selectedImageId,
    setSelectedImageId,
    printProduct,
    setPrintProduct,
    notes,

    onConfirm,
    onRequestRevision,
    onPrev
}: StepTwoRedemptionProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [hasSeenUpsell, setHasSeenUpsell] = useState(false);
    const [showUpsell, setShowUpsell] = useState(false);
    const [socialConsent, setSocialConsent] = useState(false);
    const [instagramHandle, setInstagramHandle] = useState('');

    const [activeViewIndex, setActiveViewIndex] = useState(0);

    // Filter for relevant Multi-View Mockups (e.g. Canvas Front, Side)
    const currentProductObj = products.find(p => p.id === printProduct);
    const productName = currentProductObj?.name.toLowerCase() || '';

    const multiViewMockups = mockupImages.filter(m => {
        if (!m.theme_name) return false;

        const theme = m.theme_name.toLowerCase();
        // Canvas Logic
        if (productName.includes('canvas') && theme.includes('canvas')) return true;
        // Tumbler
        if (productName.includes('tumbler') && theme.includes('tumbler')) return true;
        // Bear
        if (productName.includes('bear') && theme.includes('bear')) return true;

        return false;
    });

    // Reset view index when product changes or portraits change
    useEffect(() => {
        setActiveViewIndex(0);
    }, [printProduct, selectedImageId]);

    // Glossy Mockup State (Progressive Enhancement)
    const [glossUrl, setGlossUrl] = useState<string | null>(null);
    const [isGlossing, setIsGlossing] = useState(false);

    // Effect: Trigger Gloss Generation on change
    useEffect(() => {
        if (!selectedImageId || !printProduct || printProduct === 'digital') {
            setGlossUrl(null);
            return;
        }

        const selectedImg = images.find(i => i.id === selectedImageId);
        if (!selectedImg) return;

        setIsGlossing(true);
        setGlossUrl(null); // Reset to show client-side first while loading new one

        const timer = setTimeout(async () => {
            try {
                // Dynamically import server action
                const { generateGlossMockup } = await import('@/app/actions/generate-gloss');
                const result = await generateGlossMockup(orderId, selectedImg.url, printProduct, selectedImageId);

                if (result.success && result.url) {
                    setGlossUrl(result.url);
                }
            } catch (err) {
                console.error("Gloss generation failed", err);
            } finally {
                setIsGlossing(false);
            }
        }, 1200); // 1.2s delay to let user settle on choice

        return () => clearTimeout(timer);
    }, [selectedImageId, printProduct, orderId, images]);


    const handleConfirm = async () => {
        // Fix: Auto-select first image if digital and none selected
        let effectiveImageId = selectedImageId;
        if (printProduct === 'digital' && !effectiveImageId && images.length > 0) {
            effectiveImageId = images[0].id;
            setSelectedImageId(effectiveImageId);
        }

        // Intercept Digital for Upsell - Only show ONCE
        if (printProduct === 'digital' && !showUpsell && !hasSeenUpsell) {
            setShowUpsell(true);
            setHasSeenUpsell(true);
            return;
        }

        // For Physical, require selection
        if (printProduct !== 'digital' && !effectiveImageId) {
            setError('Please select a portrait first.');
            return;
        }

        submitOrder(effectiveImageId || null);
    };

    const submitOrder = async (finalImageId: string | null = selectedImageId) => {
        setLoading(true);
        setError('');

        try {
            const response = await fetch(`/api/customer/${orderId}/confirm`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    selectedImageId: finalImageId,
                    printProduct,
                    notes,
                    socialConsent,
                    socialHandle: instagramHandle,
                }),
            });

            if (response.ok) {
                onConfirm();
            } else {
                throw new Error('Failed to confirm order.');
            }
        } catch (err) {
            console.error(err);
            setError('Something went wrong submitting your order. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleRequestRevision = () => {
        onRequestRevision();
    };

    const selectedImageUrl = images.find(img => img.id === selectedImageId)?.url;

    return (
        <div className="space-y-8 max-w-4xl mx-auto px-4 sm:px-0">
            <div className="text-center space-y-2">
                <h2 className="text-2xl md:text-3xl font-bold text-brand-navy font-playfair">Step 2: Customize Your Art</h2>
                <p className="text-zinc-500 text-lg">Select your favorite portrait and choose a size.</p>
            </div>

            <div className="flex items-center justify-between mb-2">
                <button
                    onClick={onPrev}
                    className="flex items-center gap-2 text-zinc-500 hover:text-brand-navy transition-colors font-medium"
                >
                    <span className="text-lg">←</span> Back
                </button>
            </div>

            <div className="grid lg:grid-cols-2 gap-8 items-start">
                {/* LEFT: Mockup Preview */}
                <div className="space-y-4">
                    <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wide text-center">Live Preview</h3>
                    <div className="relative aspect-square bg-white rounded-2xl overflow-hidden shadow-xl shadow-brand-navy/5 border border-zinc-200 group">

                        {multiViewMockups.length > 0 ? (
                            <div className="relative w-full h-full">
                                <motion.div
                                    key={activeViewIndex}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ duration: 0.3 }}
                                    className="relative w-full h-full"
                                >
                                    <Image
                                        src={multiViewMockups[activeViewIndex].url}
                                        alt={multiViewMockups[activeViewIndex].theme_name || 'Mockup'}
                                        fill
                                        className="object-contain"
                                        priority
                                    />
                                </motion.div>
                                {/* View Selector (Floating) */}
                                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 bg-white/80 backdrop-blur-md p-1.5 rounded-full shadow-sm z-20">
                                    {multiViewMockups.map((m, idx) => (
                                        <button
                                            key={m.id}
                                            onClick={(e) => { e.stopPropagation(); setActiveViewIndex(idx); }}
                                            className={`w-2 h-2 rounded-full transition-all ${idx === activeViewIndex ? 'bg-brand-navy w-4' : 'bg-zinc-300 hover:bg-brand-navy/50'
                                                }`}
                                        />
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="relative w-full h-full">
                                {/* Base: Client-Side Generator (Always rendered first) */}
                                <div className={`absolute inset-0 transition-opacity duration-1000 ${glossUrl ? 'opacity-0' : 'opacity-100'}`}>
                                    <MockupGenerator
                                        productType={printProduct}
                                        imageUrl={selectedImageUrl || null}
                                    />
                                </div>

                                {/* Overlay: Glossy AI Image (Fades in when ready) */}
                                {glossUrl && (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ duration: 1 }}
                                        className="absolute inset-0 z-10"
                                    >
                                        <Image
                                            src={glossUrl}
                                            alt="Glossy Preview"
                                            fill
                                            priority={true}
                                            className="object-contain"
                                        />
                                        {/* Sparkle Effect on Load */}
                                        <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/30 to-white/0 animate-shimmer pointer-events-none" />
                                    </motion.div>
                                )}

                                {/* Loading Indicator for Gloss (Subtle) */}
                                {isGlossing && !glossUrl && (
                                    <div className="absolute top-4 right-4 z-20">
                                        <div className="bg-white/80 backdrop-blur-md text-xs font-medium text-brand-navy px-2 py-1 rounded-full shadow-sm flex items-center gap-1.5">
                                            <Loader2 className="w-3 h-3 animate-spin text-brand-blue" />
                                            <span>Polishing...</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Multi-View Thumbnails (If available) */}
                    {multiViewMockups.length > 0 && (
                        <div className="flex justify-center gap-2">
                            {multiViewMockups.map((m, idx) => (
                                <button
                                    key={m.id}
                                    onClick={() => setActiveViewIndex(idx)}
                                    className={`relative w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${idx === activeViewIndex ? 'border-brand-navy ring-2 ring-brand-navy/20' : 'border-zinc-200 opacity-70 hover:opacity-100'
                                        }`}
                                >
                                    <Image src={m.url} alt="view" fill className="object-cover" />
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Size Label */}
                    <div className="text-center">
                        <span className="inline-block px-4 py-1.5 bg-zinc-100 rounded-full text-sm font-semibold text-zinc-600 border border-zinc-200 shadow-sm">
                            {products.find(p => p.id === printProduct)?.name || 'Select a Size'}
                        </span>
                    </div>

                    {/* RIGHT: Controls */}
                    <div className="space-y-8">

                        {/* 1. Select Portrait (Hidden for Digital initially) */}
                        {printProduct !== 'digital' && (
                            <section className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <h3 className="text-sm font-bold text-brand-navy uppercase tracking-wide">1. Select Portrait</h3>
                                    <span className="text-xs text-zinc-500">{images.length} Options</span>
                                </div>
                                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-64 overflow-y-auto p-1 custom-scrollbar">
                                    {images.map((image) => (
                                        <div
                                            key={image.id}
                                            onClick={() => setSelectedImageId(image.id)}
                                            className={`relative aspect-square rounded-xl overflow-hidden cursor-pointer transition-all shadow-sm ${selectedImageId === image.id ? 'ring-4 ring-brand-navy scale-95 opacity-100' : 'opacity-60 hover:opacity-100 hover:scale-105'
                                                }`}
                                        >
                                            <Image src={image.url} alt="Option" fill className="object-cover" />
                                            {selectedImageId === image.id && (
                                                <div className="absolute inset-0 bg-brand-navy/20 flex items-center justify-center">
                                                    <Check className="w-6 h-6 text-white drop-shadow-md" />
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* 2. Select Product (Size) - Using Subcomponent */}
                        <ProductSelector
                            products={products}
                            printProduct={printProduct}
                            setPrintProduct={setPrintProduct}
                        />

                        {/* 4. Social Media Shoutout - Using Subcomponent */}
                        <SocialConsent
                            petName={petName}
                            socialConsent={socialConsent}
                            setSocialConsent={setSocialConsent}
                            instagramHandle={instagramHandle}
                            setInstagramHandle={setInstagramHandle}
                        />
                    </div>
                </div>

                {/* Confirm Buttons - Placed in the right column on larger screens or below on mobile */}
                <div className="lg:mt-0 pt-6 lg:pt-0 space-y-4 pb-24 md:pb-12">
                    {/* Testimonial Block */}
                    <div className="bg-zinc-50 rounded-xl p-4 border border-zinc-100 flex gap-3">
                        <div className="flex-shrink-0">
                            <div className="w-10 h-10 rounded-full bg-brand-navy/10 flex items-center justify-center text-lg">🐶</div>
                        </div>
                        <div>
                            <div className="flex text-amber-400 mb-1">★★★★★</div>
                            <p className="text-zinc-600 text-sm italic pr-2">&quot;The quality of the canvas is incredible. Best gift I&apos;ve ever given!&quot;</p>
                            <p className="text-zinc-400 text-xs mt-1 font-medium">- Jessica M.</p>
                        </div>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="text-rose-600 text-center bg-rose-50 p-4 rounded-xl border border-rose-100 text-base font-medium">
                            {error}
                        </div>
                    )}

                    {/* Desktop/Tablet Main Button */}
                    <button
                        onClick={handleConfirm}
                        disabled={(!selectedImageId && printProduct !== 'digital') || !printProduct || loading}
                        className="w-full btn-primary py-5 text-xl font-bold rounded-2xl shadow-xl shadow-brand-navy/20 disabled:opacity-50 disabled:grayscale transition-all hover:scale-[1.01] active:scale-[0.99] min-h-[64px]"
                    >
                        {loading ? (
                            <span className="flex items-center justify-center gap-2">
                                <Loader2 className="w-6 h-6 animate-spin" />
                                Processing...
                            </span>
                        ) : (
                            printProduct === 'digital' ? "Proceed to Delivery" : "Confirm Order & Print"
                        )}
                    </button>

                    <button
                        onClick={handleRequestRevision}
                        disabled={loading}
                        className="w-full py-4 text-base font-medium text-zinc-500 hover:text-brand-navy hover:bg-zinc-50 rounded-xl transition-colors border border-transparent hover:border-zinc-200"
                    >
                        Wait, I need a revision on this photo
                    </button>
                </div>

                {/* Sticky Mobile CTA */}
                <div className="fixed bottom-0 inset-x-0 p-4 bg-white border-t border-zinc-200 shadow-[0_-4px_20px_rgba(0,0,0,0.1)] md:hidden z-40">
                    <button
                        onClick={handleConfirm}
                        disabled={(!selectedImageId && printProduct !== 'digital') || !printProduct || loading}
                        className="w-full btn-primary py-4 text-lg font-bold rounded-xl shadow-lg disabled:opacity-50"
                    >
                        {loading ? "Processing..." : (printProduct === 'digital' ? "Proceed to Delivery" : "Confirm & Print")}
                    </button>
                </div>

                {/* Upsell Modal */}
                {showUpsell && selectedImageUrl && (
                    <UpsellFunnel
                        portraitUrl={selectedImageUrl}
                        petName={petName}
                        currentProduct={printProduct}
                        onAddToCart={(productId) => {
                            setPrintProduct(productId);
                            setShowUpsell(false);
                        }}
                        onDecline={() => {
                            setShowUpsell(false);
                            let finalId = selectedImageId;
                            if (printProduct === 'digital' && !finalId && images.length > 0) {
                                finalId = images[0].id;
                            }
                            submitOrder(finalId || null);
                        }}
                    />
                )}
            </div>
        </div>
    );
}
