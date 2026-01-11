'use client';

import { useState, useEffect } from 'react';
import { motion, useMotionValue, useTransform, useAnimation, PanInfo } from 'framer-motion';
import Image from 'next/image';
import { Check, X } from 'lucide-react';
import type { Image as ImageType } from '@/lib/supabase/client';

interface SwipeableCardProps {
    image: ImageType;
    onSwipe: (direction: 'left' | 'right') => void;
    disabled?: boolean;
}

export default function SwipeableCard({ image, onSwipe, disabled }: SwipeableCardProps) {
    const controls = useAnimation();
    const x = useMotionValue(0);
    const rotate = useTransform(x, [-200, 200], [-25, 25]);
    const opacity = useTransform(x, [-200, -150, 0, 150, 200], [0, 1, 1, 1, 0]);

    // Stamp Opacity
    const likeOpacity = useTransform(x, [10, 100], [0, 1]);
    const nopeOpacity = useTransform(x, [-100, -10], [1, 0]);

    const handleDragEnd = async (event: Event, info: PanInfo) => {
        const threshold = 100;
        if (info.offset.x > threshold) {
            await controls.start({ x: 500, opacity: 0 });
            onSwipe('right');
        } else if (info.offset.x < -threshold) {
            await controls.start({ x: -500, opacity: 0 });
            onSwipe('left');
        } else {
            controls.start({ x: 0 });
        }
    };

    return (
        <motion.div
            drag={disabled ? false : "x"}
            dragConstraints={{ left: 0, right: 0 }}
            onDragEnd={handleDragEnd}
            animate={controls}
            style={{ x, rotate, opacity }}
            className="absolute inset-0 w-full h-full bg-zinc-900 rounded-2xl overflow-hidden shadow-2xl ring-1 ring-zinc-800 cursor-grab active:cursor-grabbing touch-none"
        >
            <Image
                src={image.url}
                alt="Candidate"
                fill
                className="object-cover pointer-events-none"
                priority
            />

            <div className="absolute inset-x-0 bottom-0 p-6 bg-gradient-to-t from-black/80 to-transparent pointer-events-none">
                <h3 className="text-xl font-bold text-white shadow-black drop-shadow-md">{image.theme_name}</h3>
                <p className="text-zinc-300 text-sm capitalize drop-shadow-md">{image.type} Generation</p>
            </div>

            {/* STAMPS */}
            <motion.div style={{ opacity: likeOpacity }} className="absolute top-8 left-8 pointer-events-none">
                <div className="border-4 border-green-500 text-green-500 font-bold text-3xl px-4 py-2 rounded-xl -rotate-12 bg-black/20 backdrop-blur-sm shadow-xl">
                    APPROVE
                </div>
            </motion.div>

            <motion.div style={{ opacity: nopeOpacity }} className="absolute top-8 right-8 pointer-events-none">
                <div className="border-4 border-red-500 text-red-500 font-bold text-3xl px-4 py-2 rounded-xl rotate-12 bg-black/20 backdrop-blur-sm shadow-xl">
                    REJECT
                </div>
            </motion.div>
        </motion.div>
    );
}
