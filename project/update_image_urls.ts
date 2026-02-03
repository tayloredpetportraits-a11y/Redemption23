import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function updateImageUrls() {
    console.log('Updating product image URLs...');

    // Update Canvas
    const { error: canvasError } = await supabase
        .from('printify_product_configs')
        .update({ image_url: 'https://placehold.co/400x400/1a1a2e/f97316?text=Canvas+11x14&font=montserrat' })
        .eq('product_type', 'canvas-11x14');

    if (canvasError) {
        console.error('Canvas update error:', canvasError);
    } else {
        console.log('✅ Canvas updated');
    }

    // Update Mug
    const { error: mugError } = await supabase
        .from('printify_product_configs')
        .update({ image_url: 'https://placehold.co/400x400/1a1a2e/7c3aed?text=Mug+15oz&font=montserrat' })
        .eq('product_type', 'mug-15oz');

    if (mugError) {
        console.error('Mug update error:', mugError);
    } else {
        console.log('✅ Mug updated');
    }

    // Verify
    const { data, error } = await supabase
        .from('printify_product_configs')
        .select('product_name, image_url')
        .order('display_order');

    if (error) {
        console.error('Verification error:', error);
    } else {
        console.log('\nCurrent image URLs:');
        data.forEach(p => console.log(`${p.product_name}: ${p.image_url}`));
    }
}

updateImageUrls();
