'use client';

import React, { useMemo, useRef, useEffect, useState } from 'react';
import PerspT from 'perspective-transform';

interface Point { x: number; y: number }

interface PerspectiveWarpProps {
    children: React.ReactNode;
    // Corners are normalized 0-1 relative to the container size
    corners: {
        tl: Point;
        tr: Point;
        bl: Point;
        br: Point;
    };
    className?: string; // Additional classes for the wrapper
}

export default function PerspectiveWarp({ children, corners, className = '' }: PerspectiveWarpProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [matrix3d, setMatrix3d] = useState<string>('');
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

    useEffect(() => {
        if (!containerRef.current) return;

        const resizeObserver = new ResizeObserver((entries) => {
            for (const entry of entries) {
                const { width, height } = entry.contentRect;
                setDimensions({ width, height });
            }
        });

        resizeObserver.observe(containerRef.current);
        return () => resizeObserver.disconnect();
    }, []);

    useEffect(() => {
        if (!dimensions.width || !dimensions.height) return;

        const W = dimensions.width;
        const H = dimensions.height;

        // Source points: The unwarped rectangle (0,0) to (W,H)
        const srcPts = [0, 0, W, 0, 0, H, W, H];

        // Destination points: mapped from normalized (0-1) inputs to W,H space
        const dstPts = [
            corners.tl.x * W, corners.tl.y * H,
            corners.tr.x * W, corners.tr.y * H,
            corners.bl.x * W, corners.bl.y * H,
            corners.br.x * W, corners.br.y * H,
        ];

        try {
            // @ts-ignore
            const persp = PerspT(srcPts, dstPts);
            const coeffs = persp.coeffs;
            const [a, b, c, d, e, f, g, h] = coeffs;

            const val = `matrix3d(
                ${a}, ${d}, 0, ${g},
                ${b}, ${e}, 0, ${h},
                0, 0, 1, 0,
                ${c}, ${f}, 0, 1
            )`;

            setMatrix3d(val);

        } catch (err) {
            console.warn("Warp calculation failed:", err);
            setMatrix3d('');
        }

    }, [corners, dimensions]);

    return (
        <div className={`relative ${className}`} ref={containerRef}>
            <div
                style={{
                    transform: matrix3d,
                    transformOrigin: '0 0',
                    width: dimensions.width ? `${dimensions.width}px` : '100%',
                    height: dimensions.height ? `${dimensions.height}px` : '100%',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    opacity: dimensions.width ? 1 : 0 // Hide until measured
                }}
                className="pointer-events-none"
            >
                <div className="w-full h-full relative">
                    {children}
                </div>
            </div>
        </div>
    );
}
