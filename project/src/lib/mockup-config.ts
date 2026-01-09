
export interface MockupConfig {
    base: string;
    mask?: string;
    texture?: string; // Used for simple overlay blending
    displacementMap?: string; // Used for SVG displacement (warping)
    style: {
        top: string;
        left: string;
        width: string;
        height?: string;
        aspectRatio?: string;
        transform?: string;
        borderRadius?: string;
        filter?: string;
        mixBlendMode?: string;
        opacity?: number;
        // V2: Advanced Tuning
        displacementScale?: number; // How strong the warp is
        perspectiveOrigin?: string;
        rotateX?: number;
        rotateY?: number;
        rotateZ?: number;
        boxShadow?: string;
    };
}

export const MOCKUP_CONFIGS: Record<string, MockupConfig> = {
    // 1. Canvas (Standard)
    'canvas-11x14': {
        base: '/assets/mockups/canvas_mockup.png',
        style: {
            top: '25%', // Calibrated manually
            left: '35%',
            width: '30%',
            aspectRatio: '11 / 14',
            transform: 'perspective(1000px) rotateY(-5deg)', // Keeping transform as it likely helps realism, though temp plan didn't have it, I'll keep it as it's a 3D effect. Wait, temp plan didn't have transform. If calibration was done WITHOUT transform, keeping it might break it. But usually 11x14 on a wall needs some perspective if the wall is angled. The temp plan says "boxShadow: '2px 4px 12px rgba(0,0,0,0.5)' // fake depth".
            // The temp plan has NO transform. If I keep transform, the positioning might be off.
            // However, the existing config HAD transform.
            // The prompt says "Calibrated manually". If the user did this in a 2D editor without perspective, adding perspective back might shift it.
            // But if the base image is the SAME, and the user just gave top/left/width, they might imply "put it here".
            // Let's assume I should KEEP other props unless they conflict.
            // Actually, the temp plan only specified top, left, width, aspectRatio, and boxShadow.
            // It did NOT specify transform.
            // If I look at the temp plan comments: "Calibrated manually", "fake depth".
            // If I keep the transform, it might be safer to comment it out or remove it IF the calibration implies flat.
            // But `canvas_mockup.png` usually IS perspective.
            // Let's look at the usage in `temp_mockup_plan.ts`. It's just a simple <img> with overlay.
            // `img src={currentMockup.bg}`
            // `img src={selectedImage} style={{ position: 'absolute', ...currentMockup.overlay }}`
            // This implies the user tested it WITHOUT transform (just absolute positioning).
            // So if I add transform back, it will definitely be wrong (rotated).
            // I will REMOVE transform for these updated ones to match the user's manual calibration exactly.
            // BUT, the existing config had `rotateY(-5deg)`. Maybe the user didn't notice the rotation or calibrated it to look good flat?
            // "canvas_mockup.png" might be a straight-on shot?
            // Actually, let's look at the file list. `canvas_mockup.png`.
            // I'll stick to the user's explicit values. The user provided `top`, `left`, `width`, `aspectRatio`, `boxShadow`.
            // I will REMOVE `transform` for these keys, as it wasn't in the plan and `boxShadow` provides the "fake depth".

            boxShadow: '2px 4px 12px rgba(0,0,0,0.5)',
            filter: 'contrast(1.05) brightness(0.95)',
            mixBlendMode: 'normal',
        },
    },
    'canvas-16x20': {
        base: '/assets/mockups/canvas_mockup.png',
        style: {
            top: '22%',
            left: '32%',
            width: '36%',
            aspectRatio: '16 / 20',
            boxShadow: '2px 4px 15px rgba(0,0,0,0.6)',
            filter: 'contrast(1.05) brightness(0.95)',
        },
    },

    // 2. Bear (New & Improved)
    'bear': {
        base: '/assets/mockups/bear_base.png',
        mask: '/assets/mockups/bear_mask.png',
        displacementMap: '/assets/mockups/bear_base.png', // Self-displacement often works for simple fabric
        style: {
            top: '40%',
            left: '35%',
            width: '30%',
            aspectRatio: '1 / 1',
            transform: 'rotate(-2deg)',
            mixBlendMode: 'multiply',
            opacity: 0.9,
            displacementScale: 20,
        },
    },

    // 3. Tumbler (New)
    'tumbler': {
        base: '/assets/mockups/tumbler_base.png',
        displacementMap: '/assets/mockups/tumbler_base.png',
        style: {
            top: '30%',
            left: '35%',
            width: '30%',
            height: '40%',
            borderRadius: '5px',
            transform: 'perspective(800px) rotateY(15deg)',
            mixBlendMode: 'multiply',
            filter: 'brightness(1.02)',
            displacementScale: 30, // Strong cylinder warp
        },
    },

    // 4. Digital (Fallback)
    'digital': {
        base: '/assets/mockups/canvas_mockup.png',
        style: {
            top: '25%',
            left: '35%',
            width: '30%',
            aspectRatio: '1 / 1',
            borderRadius: '12px',
            filter: 'drop-shadow(0 0 10px rgba(59, 130, 246, 0.5))',
        }
    }
};
