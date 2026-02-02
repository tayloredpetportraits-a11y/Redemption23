import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkRawData() {
    const orderId = 'baea151c-2d02-4a9f-95be-102206457a42';

    console.log(`\n🔍 Raw database query for order: ${orderId}\n`);

    const { data: images, error } = await supabase
        .from('images')
        .select('*')
        .eq('order_id', orderId)
        .order('created_at');

    if (error) {
        console.error('Error:', error);
        return;
    }

    console.log(`Total images: ${images?.length || 0}\n`);
    console.log('Raw data:');
    console.log(JSON.stringify(images, null, 2));
}

checkRawData();
