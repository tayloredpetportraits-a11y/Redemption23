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
}

export default function StepOneGallery({ images, petName, onImageClick, onNext, orderId }: StepOneGalleryProps) {

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
                    <p className="text-zinc-500 text-lg">Take a moment to enjoy your portraits! Download your favorites.</p>
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
                {images.map((image, index) => (
                    <motion.div
                        key={image.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="group space-y-4"
                    >
                        <div
                            onClick={() => onImageClick(index)}
                            className="relative aspect-square rounded-2xl overflow-hidden cursor-pointer shadow-md hover:shadow-xl transition-all duration-300 ring-1 ring-zinc-200 hover:ring-4 hover:ring-brand-blue/50"
                        >
                            <Image
                                src={image.url}
                                alt={`${petName} Portrait ${index + 1}`}
                                fill
                                className="object-cover transition-transform duration-500 group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-brand-navy/10 transition-colors" />
                        </div>

                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                handleDownload(image.url, `${petName}_Portrait_${index + 1}.jpg`);
                            }}
                            className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-white hover:bg-zinc-50 border border-zinc-200 text-zinc-600 hover:text-brand-navy font-medium rounded-xl text-base transition-colors min-h-[56px] active:scale-[0.98] shadow-sm"
                        >
                            <Download className="w-5 h-5" />
                            Download
                        </button>
                    </motion.div>
                ))}
            </div>

            <div className="flex justify-center pt-8 pb-12">
                <button
                    onClick={onNext}
                    className="btn-primary flex items-center gap-3 px-10 py-5 text-xl font-semibold shadow-xl shadow-brand-navy/20 hover:shadow-brand-navy/30 w-full sm:w-auto justify-center rounded-2xl"
                >
                    Choose My Redemption Item
                    <ArrowRight className="w-6 h-6" />
                </button>
            </div>
        </div>
    );
}
