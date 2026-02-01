'use client';

import { useEffect, useRef } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import JSConfetti from 'js-confetti';
import { ArrowRight, Heart, Sparkles } from 'lucide-react';

export default function ImpactBanner() {
    const confettiRef = useRef<JSConfetti | null>(null);

    useEffect(() => {
        // Initialize confetti instance
        confettiRef.current = new JSConfetti();

        // Fire confetti on mount - celebration for their order
        const fireConfetti = async () => {
            await confettiRef.current?.addConfetti({
                emojis: ['🎉', '🐾', '🦴', '🧡', '✨'],
                confettiColors: ['#F59E0B', '#14B8A6', '#ffffff'],
                confettiNumber: 40,
            });
        };

        const timer = setTimeout(() => {
            fireConfetti();
        }, 800);

        return () => clearTimeout(timer);
    }, []);

    return (
        <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="w-full bg-zinc-900 border-b border-zinc-800 relative overflow-hidden"
        >
            {/* Background gradients */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#F59E0B]/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/4 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-[#14B8A6]/5 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/4 pointer-events-none" />

            <div className="max-w-7xl mx-auto px-4 py-8 md:py-10">
                <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12">

                    {/* Visual Side */}
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="shrink-0 relative group"
                    >
                        <div className="relative w-full max-w-[320px] md:w-[400px] aspect-[16/9] rounded-2xl overflow-hidden shadow-2xl border border-zinc-700/50">
                            <Image
                                src="/taylored-to-help-banner.jpg"
                                alt="Shelter dog before and after transformation"
                                fill
                                className="object-cover transition-transform duration-700 group-hover:scale-105"
                            />

                            {/* Overlay Badge */}
                            <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-md text-white text-xs font-bold px-3 py-1.5 rounded-full border border-white/10 flex items-center gap-1.5">
                                <Sparkles className="w-3 h-3 text-[#F59E0B]" />
                                <span className="tracking-wide">MISSION</span>
                            </div>
                        </div>

                        {/* Decorative elements behind */}
                        <div className="absolute -z-10 -top-3 -left-3 w-full h-full border border-zinc-800 rounded-2xl" />
                        <div className="absolute -z-20 -bottom-3 -right-3 w-full h-full bg-zinc-800/50 rounded-2xl" />
                    </motion.div>

                    {/* Content Side */}
                    <div className="flex-1 text-center md:text-left space-y-4 max-w-2xl">
                        <div className="space-y-2">
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                                className="inline-flex items-center gap-2 px-3 py-1 bg-[#14B8A6]/10 text-[#2DD4BF] rounded-full text-sm font-medium mx-auto md:mx-0"
                            >
                                <Heart className="w-4 h-4 fill-current" />
                                Your Impact
                            </motion.div>

                            <motion.h2
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4 }}
                                className="text-2xl md:text-3xl lg:text-4xl font-bold text-white leading-tight"
                            >
                                Your portraits are ready! <span className="inline-block animate-bounce-subtle">🎉</span>
                            </motion.h2>
                        </div>

                        <motion.p
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 }}
                            className="text-zinc-400 text-lg leading-relaxed"
                        >
                            Plus, your order is helping us launch <span className="text-[#F59E0B] font-semibold">Taylored to Help</span> — our mission to give shelter dogs professional adoption photos to help them find forever homes faster.
                        </motion.p>

                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.6 }}
                            className="pt-2"
                        >
                            <a
                                href="/taylored-to-help"
                                className="inline-flex items-center gap-2 bg-white text-zinc-900 hover:bg-zinc-100 font-bold py-3 px-8 rounded-full transition-all transform hover:-translate-y-1 shadow-lg shadow-white/10 group/btn"
                            >
                                Learn More
                                <ArrowRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-1" />
                            </a>
                        </motion.div>
                    </div>

                </div>
            </div>
        </motion.div>
    );
}
