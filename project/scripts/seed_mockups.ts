
import { createAdminClient } from '../src/lib/supabase/server';
import dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function seedMockups() {
    console.log('🌱 Seeding Product Templates...');

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
        console.error('❌ Missing Supabase credentials in .env.local');
        return;
    }

    const supabase = createAdminClient();

    // 1. Defining Templates (Using reliable placeholders for now)
    // In a real app, these overlay_urls would be transparent PNGs of the product frames.
    const templates = [
        {
            name: 'Classic Canvas',
            // Canvas on wall (Cleaner, single item)
            overlay_url: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?auto=format&fit=crop&w=800&q=80',
            aspect_ratio: 'portrait',
            purchase_link: 'https://printify.com/app/products/1/canvas',
            is_active: true,
            warp_config: {
                // Tilted Canvas coordinates (Visual Estimate for new image)
                tl: { x: 0.32, y: 0.28 },
                tr: { x: 0.68, y: 0.28 },
                bl: { x: 0.32, y: 0.78 },
                br: { x: 0.68, y: 0.78 },
                clip: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)'
            }
        },
        {
            name: 'Ceramic Mug',
            // White Mug on table
            overlay_url: 'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?auto=format&fit=crop&w=800&q=80',
            aspect_ratio: 'square',
            purchase_link: 'https://printify.com/app/products/71/mug',
            is_active: true,
            warp_config: {
                // Mug Print Area 
                tl: { x: 0.35, y: 0.35 },
                tr: { x: 0.75, y: 0.32 },
                bl: { x: 0.35, y: 0.75 },
                br: { x: 0.75, y: 0.78 },
                // Clip to hide spillover outside cylinder
                clip: 'polygon(0% 5%, 100% 0%, 100% 100%, 0% 95%)'
            }
        },
        {
            name: 'Throw Pillow',
            // Pillow on couch
            overlay_url: 'https://images.unsplash.com/photo-1584100936595-c0654b55a2e6?auto=format&fit=crop&w=800&q=80',
            aspect_ratio: 'square',
            purchase_link: 'https://printify.com/app/products/106/throw-pillow',
            is_active: true,
            warp_config: {
                // Soft pillow shape
                tl: { x: 0.20, y: 0.20 },
                tr: { x: 0.80, y: 0.20 },
                bl: { x: 0.20, y: 0.80 },
                br: { x: 0.80, y: 0.80 },
                clip: 'inset(0% 0% 0% 0% round 5%)'
            }
        }
    ];

    // 2. Clear Existing (Optional: comment out if you want to keep them)
    const { error: deleteError } = await supabase.from('product_templates').delete().neq('name', 'KeepMe');
    if (deleteError) console.error('⚠️ Failed to clear old templates:', deleteError.message);
    else console.log('🧹 Cleared old templates.');

    // 3. Insert New
    const { data, error } = await supabase.from('product_templates').insert(templates).select();

    if (error) {
        console.error('❌ Insertion Failed:', error);
    } else {
        console.log(`✅ Successfully seeded ${data.length} templates:`);
        data.forEach(t => console.log(`   - ${t.name} (${t.aspect_ratio})`));
    }
}

seedMockups();
