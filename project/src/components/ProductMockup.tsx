'use client';

import { useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';

interface ProductMockupProps {
    portraitUrl: string;
    productType: 'canvas' | 'tumbler' | 'mug' | 'blanket';
    petName: string;
}

export default function ProductMockup({ portraitUrl, productType, petName }: ProductMockupProps) {
    const [mockupLoaded, setMockupLoaded] = useState(false);

    // Mockup background images
    const mockupImages = {
        canvas: '/mockups/canvas-mockup.jpg',
        tumbler: '/mockups/tumbler-mockup.png',
        mug: '/mockups/mug-mockup.jpg',
        blanket: '/mockups/blanket-mockup.jpg',
    };

    // Overlay positioning for each product (adjust these percentages to align the portrait)
    const overlayStyles = {
        canvas: {
            top: '15%',
            left: '25%',
            width: '50%',
            height: '65%',
        },
        tumbler: {
            top: '30%',
            left: '35%',
            width: '30%',
            height: '40%',
        },
        mug: {
            top: '25%',
            left: '30%',
            width: '40%',
            height: '50%',
        },
        blanket: {
            top: '20%',
            left: '20%',
            width: '60%',
            height: '60%',
        },
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="relative w-full max-w-2xl mx-auto"
        >
            {/* Mockup background */}
            <div className="relative w-full aspect-square">
                <Image
                    src={mockupImages[productType]}
                    alt={`${productType} mockup`}
                    fill
                    className="object-contain"
                    onLoad={() => setMockupLoaded(true)}
                />

                {/* Portrait overlay */}
                {mockupLoaded && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3, duration: 0.5 }}
                        className="absolute"
                        style={overlayStyles[productType]}
                    >
                        <Image
                            src={portraitUrl}
                            alt={`${petName}'s portrait`}
                            fill
                            className="object-cover rounded-sm"
                        />
                    </motion.div>
                )}
            </div>
        </motion.div>
    );
}
