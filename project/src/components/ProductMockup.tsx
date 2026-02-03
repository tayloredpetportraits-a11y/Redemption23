'use client';

import { useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';

interface ProductMockupProps {
    /** URL to the customer's pet portrait */
    portraitUrl: string;
    /** URL to transparent PNG overlay (from database mockup_overlay_url) */
    overlayUrl?: string | null;
    /** Product type for fallback/debugging */
    productType?: string;
    /** Pet name for alt text */
    petName?: string;
    /** Additional container classes */
    className?: string;
    /** Disable animations */
    noAnimation?: boolean;
}

/**
 * CSS-based product mockup component (NO API CALLS!)
 * 
 * Layers a transparent PNG overlay over a pet portrait using pure CSS.
 * Instant rendering, no loading states, infinitely flexible.
 * 
 * Architecture:
 * - Bottom layer (z-0): Pet portrait (object-cover)
 * - Top layer (z-10): Product overlay PNG with transparency (object-contain)
 * 
 * Fallback: If no overlay provided, shows clean pet portrait only
 */
export default function ProductMockup({
    portraitUrl,
    overlayUrl,
    productType = 'product',
    petName = 'Pet',
    className = '',
    noAnimation = false
}: ProductMockupProps) {
    const [portraitError, setPortraitError] = useState(false);
    const [overlayError, setOverlayError] = useState(false);

    // Graceful error handling
    if (portraitError) {
        return (
            <div className={`relative w-full aspect-square bg-zinc-900 flex items-center justify-center rounded-lg ${className}`}>
                <p className="text-zinc-500 text-sm">Portrait unavailable</p>
            </div>
        );
    }

    const content = (
        <div className={`relative w-full aspect-square overflow-hidden rounded-lg ${className}`}>
            {/* Bottom Layer: Pet Portrait (z-index: 0) */}
            <div className="absolute inset-0 w-full h-full">
                <Image
                    src={portraitUrl}
                    alt={`${petName}'s portrait`}
                    fill
                    className="object-cover"
                    onError={() => {
                        console.error('Portrait failed to load:', portraitUrl);
                        setPortraitError(true);
                    }}
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    priority
                />
            </div>

            {/* Top Layer: Product Overlay (z-index: 10) */}
            {overlayUrl && !overlayError && (
                <div className="absolute inset-0 w-full h-full pointer-events-none z-10">
                    <Image
                        src={overlayUrl}
                        alt={`${productType} overlay`}
                        fill
                        className="object-contain"
                        onError={() => {
                            console.warn(`Overlay failed to load for ${productType}:`, overlayUrl);
                            setOverlayError(true);
                        }}
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                </div>
            )}

            {/* Dev indicator when no overlay exists */}
            {!overlayUrl && process.env.NODE_ENV === 'development' && (
                <div className="absolute top-2 right-2 bg-yellow-500/20 text-yellow-200 text-xs px-2 py-1 rounded pointer-events-none z-20">
                    No overlay
                </div>
            )}
        </div>
    );

    // Wrap in motion.div if animations enabled
    if (noAnimation) {
        return content;
    }

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="w-full"
        >
            {content}
        </motion.div>
    );
}
