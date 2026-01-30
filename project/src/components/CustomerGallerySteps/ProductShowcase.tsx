/* eslint-disable */
'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ImageComponent from 'next/image';
import { ShoppingBag, ArrowRight, Check } from 'lucide-react';
import type { Image as ImageType, ProductTemplate } from '@/lib/supabase/client';
import PerspectiveWarp from '../PerspectiveWarp';

export default function ProductShowcase({
    images,
    templates
}: {
    images: ImageType[];
    templates: ProductTemplate[];
}) {
    // If no images, or no templates, hide
    if (!images || images.length === 0 || !templates || templates.length === 0) return null;

    const [activeImage, setActiveImage] = useState<ImageType>(images[0]);

    return (
        <div className="py-24 bg-slate-900 border-t border-slate-800">
            <div className="max-w-7xl mx-auto px-4">

                <div className="text-center mb-12 animate-fade-in-up">
                    <span className="inline-block px-4 py-1 rounded-full bg-brand-blue/10 text-brand-blue text-sm font-bold tracking-widest uppercase mb-4 border border-brand-blue/20">
                        Official MerchPreview
                    </span>
                    <h2 className="text-3xl md:text-5xl font-serif font-bold text-white mb-6">
                        See it in Real Life
                    </h2>
                    <p className="text-slate-400 max-w-xl mx-auto text-lg font-light mb-8">
                        Select a portrait below to see how it looks on our premium products.
                    </p>

                    {/* IMAGE SELECTOR STRIP */}
                    <div className="flex justify-center gap-4 flex-wrap mb-12">
                        {images.map((img) => (
                            <button
                                key={img.id}
                                onClick={() => setActiveImage(img)}
                                className={`relative w-16 h-16 md:w-20 md:h-20 rounded-xl overflow-hidden border-2 transition-all ${activeImage.id === img.id
                                        ? 'border-brand-blue ring-4 ring-brand-blue/20 scale-110'
                                        : 'border-slate-700 opacity-60 hover:opacity-100 hover:scale-105'
                                    }`}
                            >
                                <ImageComponent
                                    src={img.url}
                                    alt="Variant"
                                    fill
                                    className="object-cover"
                                    unoptimized
                                />
                                {activeImage.id === img.id && (
                                    <div className="absolute inset-0 bg-brand-blue/20 flex items-center justify-center">
                                        <Check className="w-6 h-6 text-white drop-shadow-md" />
                                    </div>
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {templates.map((template, idx) => (
                        <motion.div
                            key={template.id}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-100px" }}
                            transition={{ delay: idx * 0.1, duration: 0.8 }}
                            className="group relative bg-slate-800 rounded-3xl overflow-hidden border border-slate-700 hover:border-slate-600 transition-colors"
                        >
                            {/* 1. Base Container */}
                            <div className={`${template.aspect_ratio === 'square' ? 'aspect-square' : 'aspect-[3/4]'} relative overflow-hidden bg-gray-100 group-hover:scale-105 transition-transform duration-700`}>

                                {/* Layer 1: User Art (The "Print") */}
                                <div className="absolute inset-0 z-0">
                                    {/* @ts-ignore */}
                                    {template.warp_config ? (
                                        <PerspectiveWarp corners={template.warp_config} className="w-full h-full">
                                            <div
                                                className="relative w-full h-full"
                                                // Dynamic Masking / Clipping
                                                style={{
                                                    // @ts-ignore
                                                    clipPath: template.warp_config?.clip || undefined,
                                                    // @ts-ignore
                                                    WebkitClipPath: template.warp_config?.clip || undefined
                                                }}
                                            >
                                                <AnimatePresence mode='wait'>
                                                    <motion.div
                                                        key={activeImage.id}
                                                        initial={{ opacity: 0 }}
                                                        animate={{ opacity: 1 }}
                                                        exit={{ opacity: 0 }}
                                                        transition={{ duration: 0.3 }}
                                                        className="relative w-full h-full"
                                                    >
                                                        <ImageComponent
                                                            src={activeImage.url}
                                                            alt="Your Art"
                                                            fill
                                                            className="object-cover"
                                                            unoptimized
                                                        />
                                                    </motion.div>
                                                </AnimatePresence>

                                                {/* Optional Texture Mask (e.g. wrinkles/grunge) */}
                                                {/* @ts-ignore */}
                                                {template.mask_url && (
                                                    <div
                                                        className="absolute inset-0 z-10 bg-black mix-blend-destination-in"
                                                        style={{
                                                            maskImage: `url(${template.mask_url})`,
                                                            WebkitMaskImage: `url(${template.mask_url})`,
                                                            maskSize: 'cover',
                                                            WebkitMaskSize: 'cover'
                                                        }}
                                                    />
                                                )}
                                            </div>
                                        </PerspectiveWarp>
                                    ) : (
                                        // Fallback: Simple Center Crop
                                        <div className="flex items-center justify-center p-[15%] w-full h-full">
                                            <div className="relative w-full h-full shadow-2xl">
                                                <ImageComponent
                                                    src={activeImage.url}
                                                    alt="Your Art"
                                                    fill
                                                    className="object-cover rounded-sm"
                                                    unoptimized
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Layer 2: The Mockup Template (Mug/Canvas Textures) */}
                                {/* using mix-blend-multiply allows the white parts of the mockup to become transparent,
                                        while shadows/textures darken the user art below. Best for white substrates. */}
                                <ImageComponent
                                    src={template.overlay_url}
                                    alt={template.name}
                                    fill
                                    className="object-cover z-10 pointer-events-none mix-blend-multiply opacity-90"
                                    unoptimized
                                />

                                {/* Layer 3: Realistic Lighting Overlay (Highlights/Reflections) */}
                                <div className="absolute inset-0 bg-gradient-to-tr from-black/0 via-white/5 to-white/20 z-20 pointer-events-none mix-blend-overlay" />

                                {/* Layer 4: Hard Shadow / Vignette for depth */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent z-10 pointer-events-none" />
                            </div>

                            <div className="p-6">
                                <h3 className="text-white font-bold text-xl mb-1">{template.name}</h3>
                                <p className="text-slate-400 text-sm mb-6">Premium quality, made to order.</p>
                                <a
                                    href={template.purchase_link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-full flex items-center justify-center gap-2 bg-white text-slate-900 py-3 rounded-xl font-bold hover:bg-slate-200 transition-colors"
                                >
                                    <ShoppingBag className="w-4 h-4" /> Order Now <ArrowRight className="w-4 h-4" />
                                </a>
                            </div>
                        </motion.div>
                    ))}
                </div>

            </div>
        </div>
    );
}
