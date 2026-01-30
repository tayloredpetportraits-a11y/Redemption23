
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
    // 1. Canvas (Standard - Clean Wall)
    'canvas-11x14': {
        base: '/assets/mockups/canvas_base_clean.png',
        style: {
            // Unsplash canvas usually centered or on wall. 
            // Estimates for generic "Front Facing" canvas.
            top: '20%',
            left: '25%',
            width: '50%',
            aspectRatio: '11 / 14',
            boxShadow: '2px 4px 12px rgba(0,0,0,0.5)',
            filter: 'contrast(1.05) brightness(0.95)',
            mixBlendMode: 'multiply', // Ensure texture shows through if white canvas
        },
    },
    'canvas-16x20': {
        base: '/assets/mockups/canvas_base_clean.png',
        style: {
            top: '20%',
            left: '22%', // Wider
            width: '56%',
            aspectRatio: '16 / 20',
            boxShadow: '2px 4px 15px rgba(0,0,0,0.6)',
            filter: 'contrast(1.05) brightness(0.95)',
            mixBlendMode: 'multiply',
        },
    },

    // 1b. Canvas (Lifestyle - Living Room)
    'canvas-lifestyle': {
        base: '/assets/mockups/canvas_mockup_living_room.png',
        style: {
            // Estimated for "hanging above sofa"
            top: '20%',
            left: '35%',
            width: '30%',
            aspectRatio: '11 / 14',
            transform: 'perspective(1000px) rotateX(1deg)', // Slight perspective
            boxShadow: '5px 10px 30px rgba(0,0,0,0.3)',
            mixBlendMode: 'multiply', // Better blending with wall texture
            opacity: 0.95,
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

    // 4. Mug (New)
    'mug': {
        base: '/assets/mockups/mug_base.png',
        style: {
            // Mug usually needs curved warp, but simple overlay for now.
            top: '35%',
            left: '32%',
            width: '35%',
            aspectRatio: '1 / 1',
            borderRadius: '0px',
            mixBlendMode: 'multiply',
            filter: 'brightness(1.0)' // Remove brightness boost if base is white
        },
    },

    // 5. Pillow (New)
    'pillow-18x18': {
        base: '/assets/mockups/pillow_base.png',
        style: {
            top: '25%',
            left: '25%',
            width: '50%',
            aspectRatio: '1 / 1',
            borderRadius: '4px',
            mixBlendMode: 'multiply',
            transform: 'rotate(0deg)', // Reset assumption
            boxShadow: 'none'
        },
    },

    // 4. Digital (Fallback)
    'digital': {
        base: '/assets/mockups/canvas_mockup_clean.png',
        style: {
            top: '25%',
            left: '35%',
            width: '30%',
            aspectRatio: '1 / 1',
            borderRadius: '12px',
            filter: 'drop-shadow(0 0 10px rgba(59, 130, 246, 0.5))',
        }
    },
    // Alias for components requesting just 'canvas'
    'canvas': {
        base: '/assets/mockups/canvas_mockup_clean.png',
        style: {
            top: '15%',
            left: '25%',
            width: '50%',
            aspectRatio: '11 / 14',
            boxShadow: '2px 10px 20px rgba(0,0,0,0.2)',
            filter: 'brightness(0.98)',
        },
    }
};
