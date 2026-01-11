'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import { Download, Archive, ArrowRight } from 'lucide-react';
import type { Image as ImageType } from '@/lib/supabase/client';

interface StepOneGalleryProps {
    images: ImageType[];
    petName: string;
    onImageClick: (index: number) => void;
    onNext: () => void;
    orderId: string;
    selectedImageId?: string | null;
    onSelectImage: (id: string) => void;
    onRequestRevision: () => void;
}

export default function StepOneGallery({ images, petName, onImageClick, onNext, orderId, selectedImageId, onSelectImage, onRequestRevision }: StepOneGalleryProps) {

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

        // Tracking in background
        await fetch(`/api/customer/${orderId}/track-download`, { method: 'POST' });
    };

    const handleDownloadAll = async () => {
        for (let i = 0; i < images.length; i++) {
            await handleDownload(images[i].url, `${petName}_Portrait_${i + 1}.jpg`);
            // small delay to prevent browser throttling
            await new Promise(r => setTimeout(r, 300));
        }
    };

    return (
        <div className="space-y-8 px-4 sm:px-0">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm">
                <div className="text-center md:text-left space-y-2">
                    <h2 className="text-2xl md:text-3xl font-bold text-brand-navy font-playfair">Step 1: Your Gallery</h2>
                    <p className="text-zinc-500 text-lg">Download your digital files below. <strong>Select your favorite</strong> to print!</p>
                </div>
                <button
                    onClick={handleDownloadAll}
                    className="btn-secondary flex items-center gap-2 text-base px-6 py-3 min-h-[48px] bg-zinc-100 hover:bg-zinc-200 text-brand-navy transition-colors font-medium rounded-lg"
                >
                    <Archive className="w-5 h-5" />
                    Download All
                </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {images.map((image, index) => {
                    const isSelected = selectedImageId === image.id;
                    return (
                        <motion.div
                            key={image.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className={`group space-y-4 rounded-3xl p-3 border-2 transition-all duration-300 ${isSelected ? 'border-brand-navy bg-brand-blue/5 shadow-md' : 'border-transparent hover:border-zinc-100'}`}
                        >
                            <div
                                onClick={() => onImageClick(index)}
                                className={`relative aspect-square rounded-2xl overflow-hidden cursor-pointer shadow-md transition-all duration-300 ${isSelected ? 'ring-2 ring-brand-navy' : 'hover:shadow-xl hover:ring-4 hover:ring-brand-blue/50'}`}
                            >
                                <Image
                                    src={image.url}
                                    alt={`${petName} Portrait ${index + 1}`}
                                    fill
                                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                                />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-brand-navy/10 transition-colors" />

                                {/* Selection Indicator/Button Over Image */}
                                <div className="absolute top-3 right-3 z-10">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onSelectImage(image.id);
                                        }}
                                        className={`p-3 rounded-full shadow-lg backdrop-blur-md transition-all duration-200 ${isSelected ? 'bg-brand-navy text-white scale-110' : 'bg-white/90 text-zinc-400 hover:text-brand-navy hover:scale-110'}`}
                                    >
                                        <div className="sr-only">Select as Favorite</div>
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill={isSelected ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
                                            <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
                                        </svg>
                                    </button>
                                </div>
                            </div>

                            <div className="flex gap-2">
                                <button
                                    onClick={() => onSelectImage(image.id)}
                                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold transition-all ${isSelected ? 'bg-brand-navy text-white shadow-lg shadow-brand-navy/20' : 'bg-white border border-zinc-200 text-brand-navy hover:bg-zinc-50'}`}
                                >
                                    {isSelected ? (
                                        <>
                                            <Check className="w-4 h-4" />
                                            Selected
                                        </>
                                    ) : (
                                        "Select to Print"
                                    )}
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleDownload(image.url, `${petName}_Portrait_${index + 1}.jpg`);
                                    }}
                                    className="px-4 py-3 bg-white hover:bg-zinc-50 border border-zinc-200 text-zinc-600 hover:text-brand-navy rounded-xl transition-colors shadow-sm"
                                    title="Download"
                                >
                                    <Download className="w-5 h-5" />
                                </button>
                            </div>
                        </motion.div>
                    );
                })}
            </div>

            <div className="flex flex-col items-center gap-4 pt-8 pb-12 w-full max-w-md mx-auto">
                <button
                    onClick={onNext}
                    className="btn-primary flex items-center gap-3 px-10 py-5 text-xl font-semibold shadow-xl shadow-brand-navy/20 hover:shadow-brand-navy/30 w-full justify-center rounded-2xl relative overflow-hidden group"
                >
                    <span className="relative z-10 flex items-center gap-3">
                        {selectedImageId ? "Proceed with Selected" : "Choose My Redemption Item"}
                        <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                    </span>
                </button>

                <button
                    onClick={onRequestRevision}
                    className="text-sm font-medium text-zinc-400 hover:text-brand-navy underline underline-offset-4 decoration-zinc-300 hover:decoration-brand-navy/30 transition-all p-2"
                >
                    Request a Revision
                </button>
            </div>
        </div>
    );
}

import { Check } from 'lucide-react';
