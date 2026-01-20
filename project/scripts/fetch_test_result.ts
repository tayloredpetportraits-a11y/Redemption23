
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function check() {
    // ID from the running process output
    const orderId = '8559ff21-35b7-4f65-ac92-177c6d4a5d78';
    const { data: images } = await supabase.from('images').select('url, display_order').eq('order_id', orderId).order('display_order');
    if (images && images.length > 0) {
        console.log("Generated Images:");
        images.forEach(img => console.log(`- [Image ${img.display_order}](${img.url})`));
    } else {
        console.log("No images yet.");
    }
}
check();
