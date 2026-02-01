'use client';

import { useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';

interface CanvasMockupProps {
    portraitUrl: string;
    productType: 'canvas' | 'bear' | 'tumbler';
    petName: string;
}

export default function CanvasMockup({ portraitUrl, productType, petName }: CanvasMockupProps) {
    const [mockupLoaded, setMockupLoaded] = useState(false);

    // Mockup templates for each product type
    const mockupTemplates = {
        canvas: '/mockups/canvas-living-room.jpg',  // You'll add this image
        bear: '/mockups/bear-mockup.jpg',
        tumbler: '/mockups/tumbler-mockup.jpg',
    };

    // Position and transform for each product type
    const overlayStyles = {
        canvas: {
            top: '28%',
            left: '38%',
            width: '24%',
            height: '32%',
            transform: 'perspective(1000px) rotateY(-3deg) rotateX(2deg)',
        },
        bear: {
            top: '35%',
            left: '42%',
            width: '16%',
            height: '16%',
            transform: 'perspective(800px) rotateY(0deg)',
        },
        tumbler: {
            top: '30%',
            left: '44%',
            width: '12%',
            height: '35%',
            transform: 'perspective(600px) rotateY(5deg)',
        },
    };

    const currentStyle = overlayStyles[productType];

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="relative w-full aspect-[4/3] bg-gray-900 rounded-lg overflow-hidden"
        >
            {/* Background mockup template */}
            <Image
                src={mockupTemplates[productType]}
                alt={`${productType} mockup`}
                fill
                className="object-cover"
                onLoad={() => setMockupLoaded(true)}
            />

            {/* Customer's portrait overlaid */}
            {mockupLoaded && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3, duration: 0.5 }}
                    className="absolute"
                    style={currentStyle}
                >
                    <Image
                        src={portraitUrl}
                        alt={`${petName}'s portrait`}
                        fill
                        className="object-cover rounded-sm shadow-2xl"
                    />
                </motion.div>
            )}

            {/* Label */}
            <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-sm px-4 py-2 rounded-lg">
                <p className="text-white text-sm font-medium">
                    Preview: {petName}'s {productType === 'canvas' ? 'Canvas' : productType === 'bear' ? 'Cuddle Bear' : 'Tumbler'}
                </p>
            </div>
        </motion.div>
    );
}
