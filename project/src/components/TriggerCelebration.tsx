/* eslint-disable */
'use client';

import { useEffect } from 'react';
import confetti from 'canvas-confetti';

export default function TriggerCelebration() {
    useEffect(() => {
        const duration = 3000;
        const animationEnd = Date.now() + duration;

        // Fire after slight delay to let images load/fade in
        const timer = setTimeout(() => {

            // Mix 1: Gold & Brand Colors (Classy)
            const count = 200;
            const defaults = {
                origin: { y: 0.7 },
                zIndex: 100,
                colors: ['#0F172A', '#E2E8F0', '#FFD700', '#F59E0B'] // Navy, Slate, Gold, Amber
            };

            function fire(particleRatio: number, opts: any) {
                confetti({
                    ...defaults,
                    ...opts,
                    particleCount: Math.floor(count * particleRatio)
                });
            }

            fire(0.25, { spread: 26, startVelocity: 55 });
            fire(0.2, { spread: 60 });
            fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
            fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
            fire(0.1, { spread: 120, startVelocity: 45 });

            // Mix 2: Emojis (Fun)
            const emojiTimer = setInterval(() => {
                const timeLeft = animationEnd - Date.now();

                if (timeLeft <= 0) {
                    clearInterval(emojiTimer);
                    return;
                }

                const particleCount = 2; // few at a time

                // Left Side
                confetti({
                    particleCount,
                    angle: 60,
                    spread: 55,
                    origin: { x: 0 },
                    shapes: ['emoji'], // @ts-ignore - 'emoji' shape is valid in recent types but might error in stricter TS
                    shapeOptions: {
                        emoji: {
                            value: ['🐾', '🦴', '🐶', '❤️'],
                        }
                    },
                    scalar: 1.5,
                    zIndex: 99
                });

                // Right Side
                confetti({
                    particleCount,
                    angle: 120,
                    spread: 55,
                    origin: { x: 1 },
                    shapes: ['emoji'], // @ts-ignore
                    shapeOptions: {
                        emoji: {
                            value: ['🐾', '🦴', '🐶', '❤️'],
                        }
                    },
                    scalar: 1.5,
                    zIndex: 99
                });

            }, 250);

        }, 500);

        return () => clearTimeout(timer);
    }, []);

    return null; // Logic only component
}
