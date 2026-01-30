/* eslint-disable */
'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Check, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import type { Image as ImageType } from '@/lib/supabase/client';
import { MockupGenerator } from '../MockupEngine/MockupGenerator';
import UpsellFunnel from '../UpsellFunnel';
import type { ProductTemplate } from '../ProductMockup';
import ProductMockup from '../ProductMockup';

interface Product {
    id: string;
    name: string;
    price: number;
    description: string;
    purchase_link?: string;
    is_digital?: boolean;
}

interface StepTwoRedemptionProps {
    orderId: string;
    petName: string;
    images: ImageType[];
    mockupImages: ImageType[];
    products: Product[];
    productTemplates: ProductTemplate[];
    selectedImageId: string | null;
    setSelectedImageId: (id: string) => void;
    printProduct: string;
    setPrintProduct: (id: string) => void;
    notes: string;
    setNotes: (notes: string) => void;

    onConfirm: () => void;
    onRequestRevision: () => void;
}

export default function StepTwoRedemption({
    orderId,
    petName,
    images,
    products,
    productTemplates,
    selectedImageId,
    setSelectedImageId,
    printProduct,
    setPrintProduct,
    notes,
    setNotes,
    onConfirm,
    onRequestRevision
}: StepTwoRedemptionProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    // const [hasSeenUpsell, setHasSeenUpsell] = useState(false);
    const [showUpsell, setShowUpsell] = useState(false);
    const [socialConsent, setSocialConsent] = useState(false);
    const [instagramHandle, setInstagramHandle] = useState('');

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

        // Check if we ALREADY have a high-quality mockup for this specific combo in `mockupImages`
        // Logic: specific theme name match?
        // Actually, we can just trigger the server action. It should be smart enough to return existing URL if cached/found.
        // For now, let's reset to allow the "Polishing" effect which delights users, 
        // OR use existing if found to be instant.

        setIsGlossing(true);
        setGlossUrl(null); // Reset to show client-side first while loading new one

        const timer = setTimeout(async () => {
            try {
                // Import specifically here to avoid top-level server-client issues if any, 
                // though 'import { generateGlossMockup }' at top is better. 
                // I will assume top-level import is added or I will add it in a separate edit.

                // CALL SERVER ACTION
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

        // VALIDATION: Must have image selected
        if (!effectiveImageId) {
            setError('Please select a reference portrait first.');
            return;
        }

        // LOGIC BRANCH: Digital vs Paid
        // Safe access to products
        const safeProducts = products || [];
        const selectedProd = safeProducts.find(p => p.id === printProduct);

        if (selectedProd?.is_digital) {
            // Free/Digital Flow -> Submit Order
            submitOrder(effectiveImageId || null);
        } else if (selectedProd?.purchase_link) {
            // Paid Flow -> Redirect to External Link (Stripe/Shop)
            window.location.href = selectedProd.purchase_link;
        } else {
            // Fallback
            setError('This product is currently unavailable.');
        }
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

    const handleRequestRevision = async () => {
        if (!selectedImageId) {
            setError('Please select the image you want revised.');
            return;
        }
        if (!notes.trim()) {
            setError('Please describe what changes you would like deeply in the "Requests" box above.');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const response = await fetch(`/api/customer/${orderId}/revision`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    selectedImageId,
                    notes,
                }),
            });

            if (response.ok) {
                onRequestRevision();
            } else {
                throw new Error('Failed to submit revision');
            }
        } catch {
            setError('Something went wrong submitting your revision. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const selectedImageUrl = images.find(img => img.id === selectedImageId)?.url;

    // Use selected image OR first image for mockups
    const mockupImageRaw = selectedImageUrl || (images.length > 0 ? images[0].url : '');

    return (
        <div className="space-y-8 max-w-4xl mx-auto px-4 sm:px-0">
            <div className="text-center space-y-2">
                <h2 className="text-2xl md:text-3xl font-bold text-brand-navy font-playfair">Step 2: Customise Your Art</h2>
                <p className="text-zinc-500 text-lg">Select your favorite portrait and choose a size.</p>
            </div>

            <div className="grid lg:grid-cols-2 gap-8 items-start">

                {/* NEW: Dynamic Mockup List if Templates Exist */}
                {productTemplates && productTemplates.length > 0 ? (
                    <div className="lg:col-span-2 space-y-8">

                        {/* 1. Selection Grid (Still need to pick image) */}
                        <section className="space-y-3">
                            <div className="flex justify-between items-center">
                                <h3 className="text-sm font-bold text-brand-navy uppercase tracking-wide">1. Select Your Favorite</h3>
                                <span className="text-xs text-zinc-500">{images.length} Options</span>
                            </div>
                            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
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

                        {/* 2. Dynamic Shop */}
                        <h3 className="text-sm font-bold text-brand-navy uppercase tracking-wide text-center">Shop Your Portrait</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                            {productTemplates.map(template => (
                                <ProductMockup
                                    key={template.id}
                                    product={template}
                                    userImage={mockupImageRaw}
                                />
                            ))}
                        </div>
                    </div>
                ) : (
                    // Fallback to legacy view if no templates
                    <>
                        {/* LEFT: Mockup Preview */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wide text-center">Live Preview</h3>
                            <div className="relative aspect-square bg-white rounded-2xl overflow-hidden shadow-xl shadow-brand-navy/5 border border-zinc-200 group">

                                {/* 1. Priority: Glossy AI Mockup (Lazy Loaded) */}
                                {/* 2. Fallback: Client-Side Immediate Mockup */}
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
                                                className="object-cover"
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

                            </div>

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
                                        <div className="grid grid-cols-4 gap-2 max-h-64 overflow-y-auto p-1 custom-scrollbar">
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

                                {/* 2. Select Product (Size) */}
                                <section className="space-y-3">
                                    <h3 className="text-sm font-bold text-brand-navy uppercase tracking-wide">2. Choose Size</h3>
                                    <div className="grid grid-cols-2 gap-3">
                                        {(products || []).length === 0 && (
                                            <div className="col-span-2 text-center text-zinc-500 py-4 italic">
                                                No physical upgrades available for this order.
                                            </div>
                                        )}
                                        {(products || []).map((product) => (
                                            <div
                                                key={product.id}
                                                onClick={() => setPrintProduct(product.id)}
                                                className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${printProduct === product.id
                                                    ? 'border-brand-navy bg-brand-blue/10 shadow-md transform scale-[1.02]'
                                                    : 'border-zinc-200 bg-white hover:border-brand-blue/50 hover:shadow-lg'
                                                    }`}
                                            >
                                                <div className="font-bold text-brand-navy text-lg">{product.name}</div>
                                                <div className="text-sm text-zinc-500 mt-1">{product.description}</div>
                                                <div className="text-brand-navy font-bold mt-2 text-base">
                                                    {product.price > 0 ? `$${product.price}+` : 'Free'}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </section>

                                {/* 3. Requests */}
                                <section className="space-y-3">
                                    <h3 className="text-sm font-bold text-brand-navy uppercase tracking-wide">Requests?</h3>
                                    <textarea
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                        placeholder="e.g. Remove the glare, lighter fur..."
                                        className="w-full bg-white border border-zinc-200 rounded-xl p-4 text-base text-brand-navy placeholder:text-zinc-400 focus:ring-2 focus:ring-brand-blue/50 outline-none h-32 resize-none shadow-inner"
                                    />
                                </section>

                                {/* 4. Social Media Shoutout */}
                                <section className="space-y-4 pt-4 border-t border-zinc-100">
                                    <div className="flex items-start gap-3">
                                        <div className="flex items-center h-6">
                                            <input
                                                id="social-consent"
                                                type="checkbox"
                                                checked={socialConsent}
                                                onChange={(e) => setSocialConsent(e.target.checked)}
                                                className="h-5 w-5 rounded border-zinc-300 text-brand-navy focus:ring-brand-navy/50"
                                            />
                                        </div>
                                        <div className="space-y-2 flex-1">
                                            <label htmlFor="social-consent" className="text-base font-medium text-brand-navy cursor-pointer">
                                                Feature my pet on social media? 📸
                                            </label>
                                            <p className="text-sm text-zinc-500">
                                                We love showing off our furry friends! Check this box if you&apos;re okay with us sharing this portrait on our Instagram/Facebook.
                                            </p>
                                        </div>
                                    </div>

                                    {socialConsent && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            className="pl-8"
                                        >
                                            <label htmlFor="instagram-handle" className="block text-sm font-medium text-brand-navy mb-1">
                                                Your Instagram Handle (Optional)
                                            </label>
                                            <input
                                                id="instagram-handle"
                                                type="text"
                                                value={instagramHandle}
                                                onChange={(e) => setInstagramHandle(e.target.value)}
                                                placeholder="@yourpet"
                                                className="w-full bg-white border border-zinc-200 rounded-lg px-4 py-2.5 text-base text-brand-navy placeholder:text-zinc-400 focus:ring-2 focus:ring-brand-blue/50 outline-none shadow-sm"
                                            />
                                            <p className="text-xs text-zinc-400 mt-1">So we can tag you!</p>
                                        </motion.div>
                                    )}
                                </section>
                            </div>
                        </div>

                        {/* Confirm Buttons - Placed in the right column on larger screens or below on mobile */}
                        <div className="lg:mt-0 pt-6 lg:pt-0  space-y-4 pb-12">
                            {/* Error Message */}
                            {error && (
                                <div className="text-rose-600 text-center bg-rose-50 p-4 rounded-xl border border-rose-100 text-base font-medium">
                                    {error}
                                </div>
                            )}

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
                                    ((products || []).find(p => p.id === printProduct)?.is_digital) ? "Claim Digital Download" : "Proceed to Purchase"
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

                        {/* Upsell Modal */}
                        {showUpsell && selectedImageUrl && (
                            <UpsellFunnel
                                portraitUrl={selectedImageUrl}
                                petName={petName}
                                currentProduct={printProduct}
                                images={images} // Pass available images for carousel
                                onAddToCart={(productId) => {
                                    setPrintProduct(productId);
                                    setShowUpsell(false);
                                }}
                                onDecline={() => {
                                    // Force submit with current image ID if one exists, relying on state might be slightly delayed but Upsell modal doesn't change it.
                                    // Better: pass dependencies or use ref? 
                                    // Actually, just calling submitOrder() relies on 'selectedImageId' which should be stable by now (Upsell doesn't change it).
                                    setShowUpsell(false);
                                    // We need to trigger the submit, potentially with the default ID if it was digital
                                    let finalId = selectedImageId;
                                    if (printProduct === 'digital' && !finalId && images.length > 0) {
                                        finalId = images[0].id;
                                    }
                                    submitOrder(finalId || null); // Pass explicit ID
                                }}
                            />
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
