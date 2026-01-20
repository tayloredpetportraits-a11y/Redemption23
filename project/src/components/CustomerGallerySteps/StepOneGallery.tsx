'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence, useAnimation, PanInfo } from 'framer-motion';
import Image from 'next/image';
import { Download, Archive, ArrowRight, Check, X, Loader2, RefreshCw, Smartphone, Lock } from 'lucide-react';
import type { Image as ImageType } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

interface StepOneGalleryProps {
    images: ImageType[];
    upsellImages: ImageType[];
    petName: string;
    onImageClick: (index: number) => void;
    onNext: () => void;
    orderId: string;
}

import { createCheckoutSession } from '@/app/actions/stripe';
import TriggerCelebration from '../TriggerCelebration';
import DownloadActionBar from '../DownloadActionBar';

const container = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1
        }
    }
};

const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
};

export default function StepOneGallery({ images: initialImages, upsellImages, petName, onImageClick, onNext, orderId }: StepOneGalleryProps) {
    const [images, setImages] = useState<ImageType[]>(initialImages);
    const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());
    const [isCheckingOut, setIsCheckingOut] = useState(false);
    const router = useRouter();

    // ... existing effects

    const handleUnlockClick = async () => {
        try {
            setIsCheckingOut(true);
            await createCheckoutSession(orderId);
        } catch (error) {
            console.error(error);
            alert("Something went wrong initializing checkout.");
            setIsCheckingOut(false);
        }
    };

    const handleDownload = async (imageUrl: string, fileName: string) => {
        try {
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
            // Tracking in background
            await fetch(`/api/customer/${orderId}/track-download`, { method: 'POST' });
        } catch (e) {
            console.error("Download failed", e);
        }
    };

    const handleDownloadAll = async () => {
        // Fix: Download whatever images are currently visible/in the list
        // Since we are showing pending images now, we should allow downloading them too.
        const targetImages = images.filter(img => img.status !== 'rejected');

        for (let i = 0; i < targetImages.length; i++) {
            await handleDownload(targetImages[i].url, `${petName}_Portrait_${i + 1}.jpg`);
            await new Promise(r => setTimeout(r, 300));
        }
    };

    return (
        <div className="space-y-12 px-4 sm:px-0 relative">
            <TriggerCelebration />
            {/* ... Existing header ... */}
            <div className="space-y-8">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6 bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm">
                    <div className="text-center md:text-left space-y-2">
                        <h2 className="text-2xl md:text-3xl font-bold text-brand-navy font-playfair">Step 1: Your Gallery</h2>
                        <p className="text-zinc-500 text-lg">Download your high-res portraits or grab a mobile wallpaper!</p>
                    </div>
                    <button
                        onClick={handleDownloadAll}
                        className="btn-secondary flex items-center gap-2 text-base px-6 py-3 min-h-[48px] bg-zinc-100 hover:bg-zinc-200 text-brand-navy transition-colors font-medium rounded-lg"
                    >
                        <Archive className="w-5 h-5" />
                        Download All Approved
                    </button>
                </div>

                <motion.div
                    variants={container}
                    initial="hidden"
                    animate="show"
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8"
                >
                    <AnimatePresence mode='popLayout'>
                        {images.map((image, index) => (
                            <ImageCard
                                key={image.id}
                                image={image}
                                petName={petName}
                                index={index}
                                onImageClick={onImageClick}
                                isProcessing={processingIds.has(image.id)}
                                handleDownload={handleDownload}
                                variants={item}
                            />
                        ))}
                    </AnimatePresence>
                </motion.div>
            </div>

            {/* BONUS THEME TEASE (LOCKED) */}
            {upsellImages && upsellImages.length > 0 && (
                <div className="relative pt-12 border-t-2 border-dashed border-zinc-200">
                    <div className="text-center space-y-3 mb-12">
                        <div className="inline-flex items-center gap-2 bg-amber-500/10 text-amber-600 px-4 py-1.5 rounded-full text-sm font-bold uppercase tracking-wider mb-2">
                            <Lock className="w-4 h-4" />
                            Bonus Content
                        </div>
                        <h2 className="text-3xl md:text-4xl font-bold text-brand-navy font-playfair">
                            Wait... We Couldn&apos;t Help Ourselves!
                        </h2>
                        <p className="text-zinc-500 text-lg max-w-2xl mx-auto">
                            The AI got creative and made these extra themes. They were too cute to delete, so we kept them in a vault for you.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 opacity-75 grayscale-[20%] hover:grayscale-0 transition-all duration-500">
                        {upsellImages.map((image) => (
                            <div key={image.id} className="relative aspect-square rounded-2xl overflow-hidden shadow-lg border-2 border-zinc-100 group">
                                {/* Blurred Image */}
                                <Image
                                    src={image.url}
                                    alt="Locked Bonus"
                                    fill
                                    className="object-cover blur-[8px] scale-105"
                                />

                                {/* Lock Overlay */}
                                <div className="absolute inset-0 bg-white/20 backdrop-blur-[2px] z-10 flex flex-col items-center justify-center gap-4">
                                    <div className="w-16 h-16 bg-white rounded-full shadow-xl flex items-center justify-center text-brand-navy">
                                        <Lock className="w-8 h-8" />
                                    </div>
                                    <span className="font-bold text-white drop-shadow-md text-lg">Locked Theme</span>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* CTA Layout - Sticky-ish or just centered below */}
                    <div className="mt-12 flex justify-center">
                        <button
                            onClick={handleUnlockClick}
                            disabled={isCheckingOut}
                            className="relative group bg-gradient-to-r from-amber-400 to-orange-500 text-white px-10 py-5 rounded-2xl shadow-xl shadow-amber-500/20 hover:shadow-amber-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-75 disabled:cursor-not-allowed"
                        >
                            <span className="flex items-center gap-3 text-xl font-bold">
                                {isCheckingOut ? (
                                    <>
                                        <Loader2 className="w-6 h-6 animate-spin" />
                                        Redirecting...
                                    </>
                                ) : (
                                    <>
                                        Unlock Bonus Pack ($9)
                                        <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                                    </>
                                )}
                            </span>
                            <div className="absolute inset-x-0 -bottom-2 mx-auto w-[90%] h-2 bg-orange-500/50 blur-lg rounded-full -z-10" />
                        </button>
                    </div>
                </div>
            )}


            <div className="flex justify-center pt-8 pb-12 border-t border-zinc-100 mt-12">
                <button
                    onClick={onNext}
                    className="btn-primary flex items-center gap-3 px-10 py-5 text-xl font-semibold shadow-xl shadow-brand-navy/20 hover:shadow-brand-navy/30 w-full sm:w-auto justify-center rounded-2xl"
                >
                    Choose My Redemption Item
                    <ArrowRight className="w-6 h-6" />
                </button>
            </div>
            {/* Sticky Action Bar */}
            <DownloadActionBar images={images.filter(img => img.status !== 'rejected')} petName={petName} />
        </div>
    );
}

function ImageCard({ image, petName, index, onImageClick, isProcessing, handleDownload, variants }:
    { image: ImageType, petName: string, index: number, onImageClick: (i: number) => void, isProcessing: boolean, handleDownload: (url: string, name: string) => void, variants?: any }) {

    const controls = useAnimation();
    const [dragStart, setDragStart] = useState({ x: 0 });

    useEffect(() => {
        controls.start({ opacity: 1, y: 0 });
    }, [controls]);

    const handleDragEnd = (event: unknown, info: PanInfo) => {
        // Drag logic removed as per user request - gallery is read-only for customer
    };

    if (image.status === 'rejected' || isProcessing) {
        return (
            <motion.div
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="aspect-square rounded-2xl bg-zinc-100 flex flex-col items-center justify-center gap-4 border-2 border-dashed border-zinc-200"
            >
                <Loader2 className="w-8 h-8 text-brand-blue animate-spin" />
                <p className="text-zinc-500 font-medium text-sm">Regenerating...</p>
            </motion.div>
        );
    }

    return (
        <motion.div
            layout
            key={image.id}
            variants={variants}
            whileHover={{ scale: 1.02 }}
            className="group relative"
        >
            <div
                onClick={() => onImageClick(index)}
                className={`relative aspect-square rounded-2xl overflow-hidden shadow-md transition-all duration-300 ring-1 cursor-pointer ring-zinc-200 hover:ring-brand-blue/50`}
            >
                <Image
                    src={image.url}
                    alt={`${petName} Portrait ${index + 1}`}
                    fill
                    className="object-cover"
                />
            </div>

            {/* Desktop Actions */}
            <div className="mt-4">
                <div className="flex gap-2 w-full">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            handleDownload(image.url, `${petName}_Portrait_${index + 1}.jpg`);
                        }}
                        className="flex-1 flex items-center justify-center gap-2 py-3 bg-brand-navy hover:bg-brand-navy/90 text-white font-medium rounded-xl transition-colors shadow-sm text-sm"
                    >
                        <Download className="w-4 h-4" />
                        High-Res
                    </button>
                    <a
                        href={`/api/images/wallpaper?url=${encodeURIComponent(image.url)}`}
                        download={`${petName}_Wallpaper_${index + 1}.jpg`}
                        onClick={(e) => e.stopPropagation()}
                        className="flex-1 flex items-center justify-center gap-2 py-3 bg-white hover:bg-zinc-50 border border-zinc-200 text-brand-navy font-medium rounded-xl transition-colors shadow-sm text-sm"
                    >
                        <Smartphone className="w-4 h-4" />
                        Wallpaper
                    </a>
                </div>
            </div>
        </motion.div>
    );
}
