
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

console.log('URL:', supabaseUrl);
// console.log('Key:', supabaseKey); // Don't log key

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugUpdate() {
    // Verify Images
    const { data: images } = await supabase
        .from('images')
        .select('*')
        .eq('order_id', '59521dad-762b-4481-bb76-53cdbe9aecf7');

    console.log('Images:', images);

    if (images && images.length > 0) {
        const firstImageId = images[0].id; // Use real ID
        console.log('Using real Image ID:', firstImageId);

        const { data, error } = await supabase
            .from('orders') // Try update again with real ID
            .update({
                status: 'confirmed',
                payment_status: 'paid',
                selected_image_id: firstImageId, // use valid ID
                selected_print_product: 'royalty-canvas',
                customer_notes: 'debug notes',
                social_consent: true,
                social_handle: '@debug_full_mirror'
            })
            .eq('id', '59521dad-762b-4481-bb76-53cdbe9aecf7')
            .select();

        if (error) {
            console.error('Update with real ID Error:', error);
        } else {
            console.log('Update with real ID Success:', data);
        }
    } else {
        console.log('No images found for order!');
    }
}

debugUpdate();
