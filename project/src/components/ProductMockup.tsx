'use client';

import { motion } from 'framer-motion';
import { ShoppingBag } from 'lucide-react';
import Image from 'next/image';

// Define the type here or import it if I put it in a types file.
// Since it's a new table, I'll define it locally for now.
export interface ProductTemplate {
    id: string;
    name: string;
    overlay_url: string;
    aspect_ratio: 'square' | 'portrait';
    purchase_link?: string; // Legacy / Optional
    price?: number; // Price in cents
    stripe_price_id?: string;
    is_active?: boolean;
}

interface ProductMockupProps {
    product: ProductTemplate;
    userImage: string; // URL of the dog image
}

export default function ProductMockup({ product, userImage }: ProductMockupProps) {

    // Determine aspect ratio classes
    // This assumes the product overlay itself is the aspect ratio container
    const aspectRatioClass = product.aspect_ratio === 'portrait' ? 'aspect-[3/4]' : 'aspect-square';

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="group relative flex flex-col bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all border border-zinc-100"
        >
            {/* Mockup Area */}
            <div className={`relative w-full ${aspectRatioClass} overflow-hidden bg-zinc-100`}>

                {/* 1. User Image (Background) */}
                {/* We use a lower z-index or just place it first in DOM. */}
                {/* We need to position it "behind" the product overlay. 
                    Ideally, the user image fills the container? 
                    Or the overlay has a transparent window? 
                    Assuming user image fills container for now. */}
                <div className="absolute inset-0 p-8"> {/* Padding might be needed if overlay frames it? Adjust as needed. */}
                    <div className="relative w-full h-full">
                        <Image
                            src={userImage}
                            alt="Your Pet"
                            fill
                            className="object-cover rounded-sm"
                        />
                    </div>
                </div>

                {/* 2. Product Overlay (Foreground) */}
                {/* This PNG must possess transparency where the user image should show through. */}
                <div className="absolute inset-0 z-10 pointer-events-none">
                    <Image
                        src={product.overlay_url}
                        alt={product.name}
                        fill
                        className="object-contain" // strict overlay alignment
                    />
                </div>

                {/* Hover Effect / Badge */}
                <div className="absolute top-2 right-2 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="bg-white/90 backdrop-blur text-xs font-bold px-2 py-1 rounded-full shadow-sm text-zinc-700">
                        {product.name}
                    </span>
                </div>
            </div>

            {/* Footer / Buy Button */}
            <div className="p-4 border-t border-zinc-50 bg-white z-20">
                <div className="flex items-center justify-between mb-3">
                    <h4 className="font-bold text-zinc-800 text-sm">{product.name}</h4>
                </div>

                <a
                    href={product.purchase_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full py-2.5 bg-zinc-900 text-white text-sm font-medium rounded-lg hover:bg-zinc-800 transition-colors"
                >
                    <ShoppingBag className="w-4 h-4" />
                    Buy Now
                </a>
            </div>
        </motion.div>
    );
}
