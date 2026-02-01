'use client';
import { useState, useEffect } from 'react';
import { X, Check } from 'lucide-react';
import Image from 'next/image';
import type { Order, Image as ImageType } from '@/lib/supabase/client';

interface CommandCenterModalProps {
    order: Order;
    images: ImageType[];
    onClose: () => void;
    onApprove: (ids: string[]) => void;
    onReject: (id: string) => void;
}

export default function CommandCenterModal({ order, images, onClose, onApprove, onReject }: CommandCenterModalProps) {
    const [selectedIndex, setSelectedIndex] = useState(0);
    const sortedImages = [...images].sort((a, b) => {
        // Sort by primary first, then id
        if (a.type === 'primary' && b.type !== 'primary') return -1;
        if (a.type !== 'primary' && b.type === 'primary') return 1;
        return 0;
    });

    const currentImage = sortedImages[selectedIndex];

    // Keyboard Shortcuts
    useEffect(() => {
        const handleKeys = (e: KeyboardEvent) => {
            if (e.key === 'ArrowRight') {
                setSelectedIndex(prev => (prev + 1) % sortedImages.length);
            } else if (e.key === 'ArrowLeft') {
                setSelectedIndex(prev => (prev - 1 + sortedImages.length) % sortedImages.length);
            } else if (e.key.toLowerCase() === 'a' && currentImage) {
                onApprove([currentImage.id]);
                // Auto-advance
                setSelectedIndex(prev => (prev + 1) % sortedImages.length);
            } else if (e.key.toLowerCase() === 'r' && currentImage) {
                onReject(currentImage.id);
                // Auto-advance
                setSelectedIndex(prev => (prev + 1) % sortedImages.length);
            } else if (e.key === 'Escape') {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeys);
        return () => window.removeEventListener('keydown', handleKeys);
    }, [currentImage, sortedImages.length, onClose, onApprove, onReject]);

    if (!order || !currentImage) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/95 backdrop-blur-md">
            {/* EXIT BUTTON */}
            <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 bg-zinc-800 rounded-full text-white hover:bg-zinc-700 z-50 border border-zinc-700"
            >
                <X size={24} />
            </button>

            <div className="flex w-full h-full max-w-[1920px]">
                {/* 1. MAIN STAGE (Left 70%) */}
                <div className="flex-1 relative flex items-center justify-center bg-transparent p-8">
                    <div className="relative h-full w-full flex items-center justify-center">
                        <div className="relative w-full h-full max-h-[85vh] aspect-[3/4] md:aspect-auto">
                            <Image
                                src={currentImage.url}
                                alt="Review Target"
                                fill
                                className="object-contain drop-shadow-2xl"
                                priority
                            />
                        </div>

                        {/* OVERLAY STATUS */}
                        {currentImage.status !== 'pending_review' && (
                            <div className={`absolute top-8 right-8 px-6 py-2 rounded-full font-bold text-lg shadow-lg backdrop-blur-md
                                ${currentImage.status === 'approved' ? 'bg-green-500/90 text-white' : ''}
                                ${currentImage.status === 'rejected' ? 'bg-red-500/90 text-white' : ''}

                            `}>
                                {currentImage.status.toUpperCase()}
                            </div>
                        )}
                    </div>
                </div>

                {/* 2. INSPECTOR (Right 30%) */}
                <div className="w-[400px] bg-zinc-900 border-l border-zinc-800 flex flex-col text-zinc-100 shadow-2xl z-40">

                    {/* Header Details */}
                    <div className="p-6 border-b border-zinc-800 bg-zinc-900">
                        <h2 className="text-3xl font-bold mb-1 font-playfair text-white">{order.pet_name}</h2>
                        <p className="text-zinc-400 text-sm mb-4">{order.customer_email}</p>

                        <div className="flex flex-wrap gap-2">
                            <span className="px-2 py-1 bg-zinc-800 rounded text-xs text-zinc-300 border border-zinc-700">
                                {order.pet_breed || 'Unknown Breed'}
                            </span>
                            <span className="px-2 py-1 bg-zinc-800 rounded text-xs text-zinc-300 border border-zinc-700">
                                {sortedImages.length} Images
                            </span>
                        </div>
                    </div>

                    {/* Controls */}
                    <div className="p-6 space-y-4 flex-1 overflow-y-auto">
                        <div className="bg-zinc-800/50 p-4 rounded-lg border border-zinc-700/50">
                            <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3">Actions</h4>
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    onClick={() => { onApprove([currentImage.id]); setSelectedIndex((i) => (i + 1) % sortedImages.length); }}
                                    className="col-span-1 py-4 bg-green-600 hover:bg-green-500 rounded-xl text-lg font-bold flex flex-col items-center justify-center gap-1 transition-all active:scale-95 shadow-lg shadow-green-900/20"
                                >
                                    <Check className="w-6 h-6" />
                                    <span>Approve</span>
                                    <span className="text-[10px] opacity-60 font-mono">(A)</span>
                                </button>
                                <button
                                    onClick={() => { onReject(currentImage.id); setSelectedIndex((i) => (i + 1) % sortedImages.length); }}
                                    className="col-span-1 py-4 bg-red-600 hover:bg-red-500 rounded-xl text-lg font-bold flex flex-col items-center justify-center gap-1 transition-all active:scale-95 shadow-lg shadow-red-900/20"
                                >
                                    <X className="w-6 h-6" />
                                    <span>Reject</span>
                                    <span className="text-[10px] opacity-60 font-mono">(R)</span>
                                </button>
                            </div>
                        </div>

                        {/* Customer Notes */}
                        {order.customer_notes && (
                            <div className="bg-blue-900/20 border border-blue-500/30 p-4 rounded-lg">
                                <h4 className="text-blue-400 text-xs font-bold uppercase mb-2">Customer Notes</h4>
                                <p className="text-blue-100 text-sm italic">"{order.customer_notes}"</p>
                            </div>
                        )}

                        {/* Image Details */}
                        <div className="space-y-2 text-sm text-zinc-500 pt-4 border-t border-zinc-800">
                            <div className="flex justify-between">
                                <span>Image ID</span>
                                <span className="font-mono text-zinc-400">{currentImage.id.slice(0, 8)}...</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Type</span>
                                <span className={`font-bold ${currentImage.type === 'primary' ? 'text-amber-400' : 'text-purple-400'}`}>
                                    {currentImage.type.toUpperCase()}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* FILMSTRIP (Fixed Bottom) */}
                    <div className="flex-none bg-zinc-950 p-4 border-t border-zinc-800 overflow-x-auto">
                        <div className="flex gap-2 min-w-min mx-auto">
                            {sortedImages.map((img, idx) => (
                                <button
                                    key={img.id}
                                    onClick={() => setSelectedIndex(idx)}
                                    className={`relative w-16 h-16 rounded-md overflow-hidden border-2 flex-shrink-0 transition-all
                                        ${selectedIndex === idx ? 'border-white ring-2 ring-white/20 scale-110 z-10' : 'border-zinc-800 opacity-60 hover:opacity-100'}
                                    `}
                                >
                                    <Image src={img.url} alt="thumbnail" fill className="object-cover" />
                                    {/* Status Dot */}
                                    <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-tl-sm
                                        ${img.status === 'approved' ? 'bg-green-500' : ''}
                                        ${img.status === 'rejected' ? 'bg-red-500' : ''}
                                        ${img.status === 'pending_review' ? 'bg-amber-500' : ''}
                                    `} />
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
