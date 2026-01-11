
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
    'canvas': {
        base: '/assets/mockups/canvas_mockup.png',
        style: {
            top: '25%',
            left: '35%',
            width: '30%',
            aspectRatio: '11 / 14',
            boxShadow: '2px 4px 12px rgba(0,0,0,0.5)',
            filter: 'contrast(1.05) brightness(0.95)',
            mixBlendMode: 'normal',
        },
    },
    'canvas-11x14': {
        base: '/assets/mockups/canvas_mockup.png',
        style: {
            top: '25%',
            left: '35%',
            width: '30%',
            aspectRatio: '11 / 14',
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
