
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

const UPDATES = [
    {
        name: 'Classic Canvas',
        overlay_url: '/assets/mockups/canvas_base_clean.png',
        // Canvas is usually full bleed or slight frame. Assuming base is mostly canvas.
        // Let's set it to occupy most of the space.
        // mix-blend-multiply means this overlay goes ON TOP.
        // So the image is BEHIND.
        warp_config: {
            tl: { x: 0.08, y: 0.08 },
            tr: { x: 0.92, y: 0.08 },
            bl: { x: 0.08, y: 0.92 },
            br: { x: 0.92, y: 0.92 },
            clip: 'inset(0% 0% 0% 0%)'
        }
    },
    {
        name: 'Ceramic Mug',
        overlay_url: '/assets/mockups/mug_base.png',
        // Mug usually has handle on right/left and curved surface.
        // We'll estimate the printable area in the middle.
        warp_config: {
            tl: { x: 0.20, y: 0.30 }, // Shifted LEFT from 0.25
            tr: { x: 0.70, y: 0.30 }, // Shifted LEFT from 0.75
            bl: { x: 0.25, y: 0.70 }, // Shifted LEFT
            br: { x: 0.65, y: 0.70 }, // Shifted LEFT, narrowed slightly
            clip: 'inset(0% 0% 0% 0%)'
        }
    },
    {
        name: 'Throw Pillow',
        overlay_url: '/assets/mockups/pillow_base.png',
        // Pillow is square-ish but puffy.
        warp_config: {
            tl: { x: 0.22, y: 0.22 }, // More padding (was 0.15)
            tr: { x: 0.78, y: 0.22 },
            bl: { x: 0.22, y: 0.78 },
            br: { x: 0.78, y: 0.78 },
            clip: 'inset(0% 0% 0% 0% round 20px)'
        }
    }
];

async function updateTemplates() {
    for (const update of UPDATES) {
        console.log(`Updating ${update.name}...`);
        const { error } = await supabase
            .from('product_templates')
            .update({
                overlay_url: update.overlay_url,
                warp_config: update.warp_config
            })
            .eq('name', update.name);

        if (error) {
            console.error(`Failed to update ${update.name}:`, error);
        } else {
            console.log(`Updated ${update.name} successfully.`);
        }
    }
}

updateTemplates();
