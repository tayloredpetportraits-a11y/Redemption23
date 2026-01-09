import { config } from 'dotenv';
config({ path: '.env.local' });
import { createAdminClient } from './src/lib/supabase/server';

async function checkOrder() {
    const supabase = createAdminClient();
    const orderId = '00103311-a055-43d8-924d-d41929f8c0b0';

    const { data: images } = await supabase
        .from('images')
        .select('*')
        .eq('order_id', orderId);

    console.log(`Order ${orderId} has ${images?.length} images.`);
    images?.forEach(img => {
        console.log(` - [${img.status}] ${img.type}: ${img.url}`);
    });
}

checkOrder().catch(console.error);
