'use client';

import React from 'react';
import Image from 'next/image';
import { MOCKUP_CONFIGS, MockupConfig } from '@/lib/mockup-config';

interface MockupGeneratorProps {
    productType: string;
    imageUrl: string | null;
    className?: string;
    configOverride?: Partial<MockupConfig>;
}

export const MockupGenerator: React.FC<MockupGeneratorProps> = ({
    productType,
    imageUrl,
    className = '',
    configOverride,
}) => {
    const config = { ...MOCKUP_CONFIGS[productType], ...configOverride };
    const filterId = `displacement-${productType}-${Math.random().toString(36).substr(2, 9)}`;

    if (!config || !config.base) {
        return (
            <div className={`bg-zinc-100 flex items-center justify-center text-zinc-400 ${className}`}>
                Mockup not found
            </div>
        );
    }

    // Calculate overlay style
    const overlayStyle: React.CSSProperties = {
        top: config.style.top,
        left: config.style.left,
        width: config.style.width,
        height: config.style.height || 'auto',
        aspectRatio: config.style.aspectRatio,
        transform: config.style.transform,
        transformOrigin: 'center center',
        filter: `${config.style.filter || ''} ${config.displacementMap ? `url(#${filterId})` : ''}`,
        mixBlendMode: config.style.mixBlendMode as React.CSSProperties['mixBlendMode'],
        opacity: config.style.opacity || 1,
        boxShadow: config.style.boxShadow,
    };

    // Mask styles if a mask image is provided
    const maskStyle: React.CSSProperties = config.mask
        ? {
            WebkitMaskImage: `url(${config.mask})`,
            maskImage: `url(${config.mask})`,
            WebkitMaskSize: 'contain',
            maskSize: 'contain',
            WebkitMaskPosition: 'center',
            maskPosition: 'center',
            WebkitMaskRepeat: 'no-repeat',
            maskRepeat: 'no-repeat',
        }
        : {
            borderRadius: config.style.borderRadius,
        };

    return (
        <div className={`relative w-full h-full overflow-hidden ${className}`}>

            {/* SVG Filter Definition for Displacement */}
            {config.displacementMap && (
                <svg className="absolute w-0 h-0">
                    <defs>
                        <filter id={filterId}>
                            <feImage
                                href={config.displacementMap}
                                result="displacement-map"
                                width="100%"
                                height="100%"
                                preserveAspectRatio="none"
                            />
                            <feDisplacementMap
                                in="SourceGraphic"
                                in2="displacement-map"
                                scale={config.style.displacementScale || 20}
                                xChannelSelector="R"
                                yChannelSelector="G"
                            />
                        </filter>
                    </defs>
                </svg>
            )}

            {/* 1. Base Product Image */}
            <div className="relative w-full h-full">
                <Image
                    src={config.base}
                    alt={`${productType} base`}
                    fill
                    className="object-cover"
                    priority
                />
            </div>

            {/* 2. Print Layer (The User's Portrait) */}
            {imageUrl ? (
                <div
                    className="absolute z-10 overflow-hidden"
                    style={{ ...overlayStyle, ...maskStyle }}
                >
                    <div className="relative w-full h-full">
                        <Image
                            src={imageUrl}
                            alt="Print"
                            fill
                            className="object-cover"
                        />
                        {/* Inner Glare/Highlight (Optional) */}
                        <div className="absolute inset-0 bg-gradient-to-tr from-black/10 via-transparent to-white/20 mix-blend-overlay pointer-events-none" />
                    </div>
                </div>
            ) : (
                // Placeholder state if no image selected
                <div
                    className="absolute z-10 flex items-center justify-center bg-white/50 backdrop-blur-[1px] border border-zinc-200"
                    style={{ ...overlayStyle, borderRadius: config.style.borderRadius }}
                >
                    <span className="text-[10px] uppercase tracking-widest text-zinc-400 font-medium">Select Portrait</span>
                </div>
            )}

            {/* 3. Texture/Lighting Overlay (Shadows ON TOP of the print) */}
            {config.texture && (
                <div className="absolute inset-0 z-20 pointer-events-none mix-blend-multiply opacity-70">
                    <Image
                        src={config.texture}
                        alt="texture"
                        fill
                        className="object-cover"
                    />
                </div>
            )}

            {/* 4. Global Lighting Fixes (Optional Vignette) */}
            <div className="absolute inset-0 z-30 pointer-events-none shadow-[inset_0_0_20px_rgba(0,0,0,0.05)]" />
        </div>
    );
};
