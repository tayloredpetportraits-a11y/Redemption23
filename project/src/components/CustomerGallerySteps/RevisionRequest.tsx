'use client';

import { useState } from 'react';
import Image from 'next/image';

import { Loader2, ArrowLeft, Check } from 'lucide-react';
import type { Image as ImageType } from '@/lib/supabase/client';

interface RevisionRequestProps {
    images: ImageType[];
    onCancel: () => void;
    onSubmit: (imageId: string, notes: string) => Promise<void>;
}

export default function RevisionRequest({ images, onCancel, onSubmit }: RevisionRequestProps) {
    const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
    const [notes, setNotes] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async () => {
        if (!selectedImageId) {
            setError('Please select the image you want revised.');
            return;
        }
        if (!notes.trim()) {
            setError('Please describe the changes you need.');
            return;
        }

        setLoading(true);
        setError('');

        try {
            await onSubmit(selectedImageId, notes);
        } catch (err) {
            console.error(err);
            setError('Failed to submit revision. Please try again.');
            setLoading(false);
        }
        // Parent handles success state transition
    };

    return (
        <div className="space-y-8 max-w-4xl mx-auto px-4 sm:px-0">
            {/* Header */}
            <div className="flex items-center justify-between">
                <button
                    onClick={onCancel}
                    className="flex items-center gap-2 text-zinc-500 hover:text-brand-navy transition-colors font-medium"
                >
                    <ArrowLeft className="w-5 h-5" />
                    Back to Redemption
                </button>
            </div>

            <div className="text-center space-y-2">
                <h2 className="text-2xl md:text-3xl font-bold text-brand-navy font-playfair">Request a Revision</h2>
                <p className="text-zinc-500 text-lg">Select the portrait that needs changes and tell us what to fix.</p>
            </div>

            <div className="grid lg:grid-cols-2 gap-8">
                {/* LEFT: Image Selection */}
                <section className="space-y-4">
                    <h3 className="text-sm font-bold text-brand-navy uppercase tracking-wide">1. Select Image to Fix</h3>
                    <div className="grid grid-cols-2 gap-4">
                        {images.map((image) => (
                            <div
                                key={image.id}
                                onClick={() => setSelectedImageId(image.id)}
                                className={`relative aspect-square rounded-xl overflow-hidden cursor-pointer transition-all shadow-sm ${selectedImageId === image.id
                                    ? 'ring-4 ring-brand-navy scale-95 opacity-100'
                                    : 'opacity-70 hover:opacity-100 hover:scale-[1.02]'
                                    }`}
                            >
                                <Image src={image.url} alt="Option" fill className="object-cover" />
                                {selectedImageId === image.id && (
                                    <div className="absolute inset-0 bg-brand-navy/20 flex items-center justify-center">
                                        <Check className="w-8 h-8 text-white drop-shadow-md" />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </section>

                {/* RIGHT: Notes & Submit */}
                <section className="space-y-6">
                    <div className="space-y-3">
                        <h3 className="text-sm font-bold text-brand-navy uppercase tracking-wide">2. Describe Changes</h3>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="e.g. Please make the fur lighter, remove the glare on the eyes..."
                            className="w-full bg-white border border-zinc-200 rounded-xl p-4 text-base text-brand-navy placeholder:text-zinc-400 focus:ring-2 focus:ring-brand-blue/50 outline-none h-64 resize-none shadow-inner"
                        />
                    </div>

                    {error && (
                        <div className="text-rose-600 bg-rose-50 p-3 rounded-lg text-sm border border-rose-100 text-center">
                            {error}
                        </div>
                    )}

                    <button
                        onClick={handleSubmit}
                        disabled={loading || !selectedImageId || !notes.trim()}
                        className="w-full btn-primary py-4 text-lg font-bold rounded-xl shadow-lg shadow-brand-navy/20 disabled:opacity-50 disabled:grayscale transition-all hover:scale-[1.01] active:scale-[0.99]"
                    >
                        {loading ? (
                            <span className="flex items-center justify-center gap-2">
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Submitting Request...
                            </span>
                        ) : (
                            "Submit Revision Request"
                        )}
                    </button>

                    <p className="text-center text-xs text-zinc-400">
                        Note: Revisions typically take 24-48 hours.
                    </p>
                </section>
            </div>
        </div>
    );
}
