'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Sparkles } from 'lucide-react';
import ImageComponent from 'next/image';
import { MockupGenerator } from '../MockupEngine/MockupGenerator';
import type { Image as ImageType } from '@/lib/supabase/client';
import { confirmPrintSelection } from '@/app/actions/orders';

interface PrintProofingInterfaceProps {
    orderId: string;
    productType: string;
    images: ImageType[];
    petName: string;
    onConfirm?: () => void;
}

export default function PrintProofingInterface({
    orderId,
    productType,
    images,
    petName,
    onConfirm
}: PrintProofingInterfaceProps) {
    const [viewMode, setViewMode] = useState<'standard' | 'lifestyle'>('standard');

    // Default to the first image if none selected
    const [selectedImageId, setSelectedImageId] = useState<string>(images[0]?.id || '');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Find the currently selected image object to get its URL for the mockup
    const selectedImage = images.find(img => img.id === selectedImageId);

    // Determine mockup config key based on product type
    const getMockupKey = (type: string) => {
        if (type.includes('canvas')) {
            return viewMode === 'lifestyle' ? 'canvas-lifestyle' : 'canvas-11x14';
        }
        if (type.includes('mug')) return 'mug';
        if (type.includes('tumbler')) return 'tumbler';
        if (type.includes('bear')) return 'bear';
        return 'canvas-11x14'; // Fallback
    };

    const mockupKey = getMockupKey(productType);

    const handleConfirm = async () => {
        if (!selectedImageId) return;
        setIsSubmitting(true);
        try {
            await confirmPrintSelection(orderId, selectedImageId);
            if (onConfirm) onConfirm();
            // Force reload to update parent state (simplest way to exit this mode)
            window.location.reload();
        } catch (error) {
            console.error('Failed to confirm selection:', error);
            setIsSubmitting(false);
            alert('Something went wrong. Please try again.');
        }
    };

    return (
        <div className="flex flex-col lg:flex-row h-screen bg-slate-50 overflow-hidden">
            {/* LEFT: Selection Sidebar */}
            <div className="w-full lg:w-1/3 bg-white border-r border-slate-200 flex flex-col h-[40vh] lg:h-full z-20 shadow-xl">
                <div className="p-8 border-b border-slate-100 bg-white sticky top-0 z-10">
                    <div className="flex items-center gap-2 text-brand-blue mb-2">
                        <Sparkles className="w-4 h-4" />
                        <span className="text-sm font-bold tracking-wider uppercase">Action Required</span>
                    </div>
                    <h1 className="text-3xl font-serif font-bold text-slate-900 mb-2">
                        Select for Print
                    </h1>
                    <p className="text-slate-500 leading-relaxed">
                        We generated {images.length} unique portraits for {petName}.
                        Which one captures their soul? This will be printed on your {productType}.
                    </p>
                </div>

                <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
                    <div className="grid grid-cols-2 gap-4">
                        {images.map((img) => (
                            <motion.button
                                key={img.id}
                                onClick={() => setSelectedImageId(img.id)}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className={`relative aspect-[4/5] rounded-xl overflow-hidden border-4 transition-all duration-200 group ${selectedImageId === img.id
                                    ? 'border-brand-blue ring-4 ring-brand-blue/20 shadow-lg'
                                    : 'border-transparent hover:border-slate-200'
                                    }`}
                            >
                                <ImageComponent
                                    src={img.url}
                                    alt="Portrait Option"
                                    fill
                                    className="object-cover"
                                />
                                {selectedImageId === img.id && (
                                    <div className="absolute inset-0 bg-brand-blue/10 z-10 flex items-center justify-center">
                                        <div className="bg-brand-blue text-white rounded-full p-2 shadow-lg scale-110">
                                            <Check className="w-6 h-6" />
                                        </div>
                                    </div>
                                )}
                            </motion.button>
                        ))}
                    </div>
                </div>
            </div>

            {/* RIGHT: Live Preview */}
            <div className="flex-1 bg-slate-100 relative flex flex-col items-center justify-center p-8 lg:p-16">
                <div className="absolute inset-0 pattern-grid-lg opacity-[0.03] pointer-events-none" />

                {/* View Toggle */}
                {productType.includes('canvas') && (
                    <div className="absolute top-8 right-8 z-30 bg-white rounded-full p-1 shadow-md border border-slate-200 flex">
                        <button
                            onClick={() => setViewMode('standard')}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${viewMode === 'standard'
                                ? 'bg-brand-blue text-white shadow-sm'
                                : 'text-slate-500 hover:text-slate-900'
                                }`}
                        >
                            Close Up
                        </button>
                        <button
                            onClick={() => setViewMode('lifestyle')}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${viewMode === 'lifestyle'
                                ? 'bg-brand-blue text-white shadow-sm'
                                : 'text-slate-500 hover:text-slate-900'
                                }`}
                        >
                            In Room
                        </button>
                    </div>
                )}

                {/* Mockup Container */}
                <div className={`relative w-full transition-all duration-500 ${viewMode === 'lifestyle' ? 'max-w-4xl aspect-[16/9]' : 'max-w-2xl aspect-square'
                    } mb-12`}>
                    <motion.div
                        key={`${selectedImageId}-${viewMode}`} // Re-animate on change
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5 }}
                        className="w-full h-full"
                    >
                        <MockupGenerator
                            productType={mockupKey}
                            imageUrl={selectedImage?.url || null}
                            className="drop-shadow-2xl rounded-lg overflow-hidden"
                        />
                    </motion.div>
                </div>

                {/* Confirm Action */}
                <div className="relative z-30 text-center space-y-4">
                    <button
                        onClick={handleConfirm}
                        disabled={isSubmitting}
                        className="bg-brand-blue text-white text-xl font-bold px-12 py-5 rounded-full shadow-2xl shadow-brand-blue/30 hover:bg-blue-600 hover:scale-105 active:scale-95 transition-all flex items-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? (
                            <>Processing...</>
                        ) : (
                            <>
                                <Check className="w-6 h-6" />
                                Approve This Design
                            </>
                        )}
                    </button>
                    <p className="text-slate-400 text-sm">
                        By approving, you confirm this image is ready for production.
                    </p>
                </div>
            </div>
        </div>
    );
}
